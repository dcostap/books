"""Build the site data from books/.

Usage: python tools/build.py

For each books/<id>/book.json:
  - aligns each chapter's text.md to its words.json and writes site/books/<id>/<nn>.json
  - copies the chapter audio to site/books/<id>/<nn>.<ext> as it is (a second lossy encode loses quality)
  - merges the checked Spanish translations (books/<id>/<nn>/es/) into site/books/<id>/<nn>.es.json
  - copies the cover
  - makes the pictures of the chapters (see picture())
Then writes site/library.json (the books by level, easiest first), and site/concepts-es.json and site/dictionary-en.json from guides/.

The text is the source of truth for what the reader sees. The timings come from words.json,
which retime.py makes from text.md. If text.md changed after that, the build links each edited
word to the nearest timed words, and it tells you to run retime.py again for exact times.
"""
import difflib
import json
import re
import shutil
import subprocess
from pathlib import Path

import numpy as np
from PIL import Image

ROOT = Path(__file__).resolve().parent.parent
SITE = ROOT / "site"
ABBREVIATIONS = {"mr.", "mrs.", "ms.", "dr.", "st.", "prof."}
FIGURE = re.compile(r"!\[(.*)\]\(([\w-]+)\)")  # ![caption](name)


def norm(token):
    return re.sub(r"[^a-z0-9]", "", token.lower())


def spread(tokens, times, i1, i2, start, end):
    """Share the time span [start, end] over tokens[i1:i2], in proportion to their length."""
    weights = [len(t) + 1 for t in tokens[i1:i2]]
    total, at = sum(weights), start
    for k, weight in enumerate(weights):
        step = (end - start) * weight / total
        times[i1 + k] = (at, at + step)
        at += step


def align(tokens, words):
    """Give each text token a (start, end) time from the closest matching timed words.

    Returns the times and, for each token, True if it matched a timed word exactly.
    """
    times, matched = [None] * len(tokens), [False] * len(tokens)
    matcher = difflib.SequenceMatcher(None, [norm(t) for t in tokens], [norm(w[0]) for w in words], autojunk=False)
    for op, i1, i2, j1, j2 in matcher.get_opcodes():
        if op == "equal":
            for k in range(i2 - i1):
                times[i1 + k] = tuple(words[j1 + k][1:3])
                matched[i1 + k] = True
        elif op == "replace":
            spread(tokens, times, i1, i2, words[j1][1], words[j2 - 1][2])
        elif op == "delete":  # text has words that the audio does not: squeeze them into the gap
            start = words[j1 - 1][2] if j1 > 0 else 0.0
            end = words[j1][1] if j1 < len(words) else start
            spread(tokens, times, i1, i2, start, end)
        # "insert": the audio has words that the text does not. They get no token.
    return times, matched


def ends_sentence(token):
    initial = re.fullmatch(r"[A-Z]\.", token)  # "J. K. Rowling"
    return re.search(r"[.!?][\"'”’)]*$", token) and token.lower() not in ABBREVIATIONS and not initial


def split(tokens, old_split):
    """Split tokens into sentences.

    A quote that ends in ? or ! does not end the sentence when a small letter comes next: "‘What is it?’ said
    Holmes." is one sentence. With old_split (book.json "oldSentenceSplit"), it does: hp1 chapter 1's translation
    was made with that split.
    """
    sentences = [[]]
    for k, token in enumerate(tokens):
        sentences[-1].append(token)
        said = k + 1 < len(tokens) and tokens[k + 1][0].islower() and re.search(r"[?!][\"'”’]+$", token)
        if ends_sentence(token) and (old_split or not said):
            sentences.append([])
    return [s for s in sentences if s]


def parse(text, old_split=False):
    """Split text.md into blocks of sentences of tokens.

    Blocks are separated by blank lines. "# " marks a heading, and "*" alone is a scene break.
    "![caption](name)" alone is a picture, books/<id>/pictures/<name>.png, with an optional caption. The narrator
    does not read captions: their sentences have no times, and they come after all the sentences of the text
    (chapter_sentences in translation.py), so a new picture does not move the sentences or the words of the text.
    """
    blocks = []
    for raw in re.split(r"\n\s*\n", text.strip()):
        figure = FIGURE.fullmatch(raw.strip())
        if raw.strip() == "*":
            blocks.append({"type": "break", "sentences": []})
        elif figure:
            blocks.append({"type": "figure", "picture": figure[2], "sentences": [],
                           "caption": split(figure[1].split(), old_split)})
        else:
            blocks.append({"type": "h" if raw.startswith("# ") else "p",
                           "sentences": split(raw.removeprefix("# ").split(), old_split)})
    return blocks


def tokens_of(blocks):
    return [t for b in blocks for s in b["sentences"] for t in s]


def build_chapter(text, words, old_split=False):
    """Return the blocks of text.md with timed tokens, and the number of tokens without an exact time."""
    blocks = parse(text, old_split)
    times, matched = align(tokens_of(blocks), words)
    times = iter(times)
    for block in blocks:
        for sentence in block["sentences"]:
            for k, token in enumerate(sentence):
                start, end = next(times)
                sentence[k] = [token, round(start, 2), round(end, 2)]
    return blocks, matched.count(False)


def picture(book_dir, book_id, name, column):
    """Make site/books/<id>/pictures/<name>.webp and return the fields of its block.

    The picture is books/<id>/pictures/<name>.png: black ink on a transparent background. Until it exists, the build
    uses the crop from the book scan, pictures/raw/<name>.png, and makes its paper transparent. The app uses the
    picture as a mask and draws it in the colour of the text, so it fits every theme.
    The width, in em of the reading text, is the size the picture had on the page next to the text: column is the
    width of the book's text column in the raw crops (book.json "pictureColumn"). The app's column is 30 em; the
    pictures are about 73% of their size on the page.
    """
    raw, final = book_dir / "pictures" / "raw" / f"{name}.png", book_dir / "pictures" / f"{name}.png"
    source = final if final.exists() else raw
    out = SITE / "books" / book_id / "pictures" / f"{name}.webp"
    if not out.exists() or out.stat().st_mtime < source.stat().st_mtime:
        out.parent.mkdir(parents=True, exist_ok=True)
        image = Image.open(source)
        if image.width > 1000:  # enough for the viewer on a large screen
            image = image.resize((1000, round(image.height * 1000 / image.width)), Image.LANCZOS)
        if "A" in image.getbands():
            ink = image.getchannel("A")
        else:  # a scan: dark is ink, the paper and its noise are transparent
            gray = np.asarray(image.convert("L"), float)
            paper = np.percentile(gray, 97) - 12
            black = min(np.percentile(gray, 1), paper - 90)  # a crop with little or light ink stays light
            ink = Image.fromarray((np.clip((paper - gray) / (paper - black), 0, 1) * 255).astype(np.uint8))
        zero = Image.new("L", ink.size, 0)
        Image.merge("RGBA", (zero, zero, zero, ink)).save(out, quality=80, alpha_quality=70, method=6)
    with Image.open(raw) as scan, Image.open(out) as made:
        return {"src": f"books/{book_id}/pictures/{name}.webp", "width": round(scan.width / column * 22, 1),
                "ratio": round(made.width / made.height, 4)}


def duration(path):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)],
                         check=True, capture_output=True, text=True).stdout
    return round(float(out), 2)


def main():
    from translation import load_concepts, load_dictionary, merge  # here, because translation.py imports this file

    library = []
    for book_file in sorted((ROOT / "books").glob("*/book.json")):
        book_dir, book_id = book_file.parent, book_file.parent.name
        book = json.loads(book_file.read_text(encoding="utf-8"))
        out_dir = SITE / "books" / book_id
        out_dir.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(book_dir / book["cover"], out_dir / book["cover"])

        chapters = []
        for n, chapter in enumerate(book["chapters"], 1):
            src_dir = book_dir / f"{n:02d}"
            audio = out_dir / f"{n:02d}{Path(chapter['audio']).suffix}"
            shutil.copyfile(ROOT / chapter["audio"], audio)
            words = json.loads((src_dir / "words.json").read_text(encoding="utf-8"))
            blocks, untimed = build_chapter((src_dir / "text.md").read_text(encoding="utf-8"), words,
                                            book.get("oldSentenceSplit", False))
            for block in blocks:
                if block["type"] == "figure":
                    block |= picture(book_dir, book_id, block.pop("picture"), book["pictureColumn"])
            data = {"title": chapter["title"], "audio": f"books/{book_id}/{audio.name}",
                    "duration": duration(audio), "blocks": blocks}
            translation, es_path = merge(src_dir), out_dir / f"{n:02d}.es.json"
            if translation and any(translation):
                es_path.write_text(json.dumps(translation, ensure_ascii=False, separators=(",", ":")),
                                   encoding="utf-8", newline="\n")
                data["translation"] = f"books/{book_id}/{es_path.name}"
                print(f"  Spanish: {sum(map(bool, translation))} of {len(translation)} sentences")
            else:
                es_path.unlink(missing_ok=True)
            (out_dir / f"{n:02d}.json").write_text(json.dumps(data, ensure_ascii=False, separators=(",", ":")),
                                                   encoding="utf-8", newline="\n")
            chapters.append({"n": n, "title": chapter["title"], "data": f"books/{book_id}/{n:02d}.json",
                             "duration": data["duration"]})
            print(f"{book_id} {n:02d}: {len(tokens_of(blocks))} tokens, {len(blocks)} blocks")
            if untimed:
                print(f"  {untimed} tokens changed after the last retime; run tools/retime.py {book_dir.relative_to(ROOT)} {n}")

        library.append({"id": book_id, "title": book["title"], "author": book["author"],
                        "narrator": book["narrator"], "level": book["level"], "cover": f"books/{book_id}/{book['cover']}",
                        "chapters": chapters})
    library.sort(key=lambda b: b["level"])  # CEFR levels sort as text: A1–A2 before B1–B2
    (SITE / "library.json").write_text(json.dumps(library, ensure_ascii=False, indent=2) + "\n",
                                       encoding="utf-8", newline="\n")
    (SITE / "concepts-es.json").write_text(json.dumps(load_concepts(), ensure_ascii=False, separators=(",", ":")),
                                           encoding="utf-8", newline="\n")
    (SITE / "dictionary-en.json").write_text(json.dumps(load_dictionary(), ensure_ascii=False, separators=(",", ":")),
                                             encoding="utf-8", newline="\n")


if __name__ == "__main__":
    main()
