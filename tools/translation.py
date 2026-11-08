"""Spanish translations of a chapter (instructions: guides/translation-es.md and guides/translation-workflow.md).

Usage:
  python tools/translation.py prep books/duke 1 [--jobs N] [--paragraphs N] [--force]
                                                                       split the chapter into jobs
  python tools/translation.py check books/duke 1 3                     check the answer to job 3
  python tools/translation.py show books/duke 1 [3]                    print the answers (or job 3) to read them

Files in books/<id>/<nn>/es/:
  source.json   the sentences when the jobs were made, and the sentence range of each job
  jobs/NN.md    job NN: its sentences, with a number on each token
  NN.json       the answer to job NN

An answer gives two things for each sentence:
  line   the reading line: a natural Spanish translation of the sentence, cut into chunks. Each chunk is
         under a run of English tokens. The chunks, read in order, are the sentence translation.
  words  the popup help: units (a word, or an idiom or a phrasal verb) with their Spanish meaning in
         context, an optional base form (the dictionary form), an optional note and optional other meanings
         ("also"). A note can link to an idea of English grammar with [[id]]: guides/concepts-es.json
         explains it, and the app shows it under the note.
Every word token is in exactly one chunk and in exactly one unit. build.py merges the answers into
site/books/<id>/<nn>.es.json as {es, line, units} for each sentence.

The answers of hp1 chapter 1 use an older format, {id, es, units}, without a reading line. The check
and the merge still accept it.
"""
import argparse
import json
import re
import sys
from pathlib import Path

from build import parse

SENTENCE_KEYS = {"id", "line", "words"}
OLD_SENTENCE_KEYS = {"id", "es", "units"}
UNIT_KEYS = {"t", "es", "base", "note", "also"}
CONCEPTS = Path(__file__).resolve().parent.parent / "guides" / "concepts-es.json"
LINK = re.compile(r"\[\[([a-z0-9-]+)\]\]")


def load_concepts():
    """The ideas of English grammar that notes can link to:
    {id: {name, en, text, examples: [[English, Spanish]...], wrong (optional): [[wrong English, right English]...]}}.
    """
    concepts = json.loads(CONCEPTS.read_text(encoding="utf-8"))
    pairs = lambda x, least: (isinstance(x, list) and len(x) >= least and all(
        isinstance(e, list) and len(e) == 2 and all(isinstance(s, str) and s.strip() for s in e) for e in x))
    for id, c in concepts.items():
        ok = (LINK.fullmatch(f"[[{id}]]") and isinstance(c, dict)
              and {"name", "en", "text", "examples"} <= set(c) <= {"name", "en", "text", "examples", "wrong"}
              and all(isinstance(c[k], str) and c[k].strip() for k in ("name", "en", "text"))
              and pairs(c["examples"], 2) and pairs(c.get("wrong", [["-", "-"]]), 1))
        if not ok:
            sys.exit(f'{CONCEPTS}: "{id}" must be {{"name", "en", "text", "examples": [["English", "Spanish"], ...] (2 or more), '
                     '"wrong": [["wrong English", "right English"], ...] (optional)}, with an id of lower-case letters, digits and -')
    return concepts


def links(answer):
    """The concept ids that the notes of an answer link to, with where: [(id, "s5 unit 2")...]."""
    return [(id, f"s{s['id']} unit {u}") for s in answer["sentences"] for u, unit in enumerate(s.get("words", s.get("units")))
            for id in LINK.findall(unit.get("note", ""))]


def is_word(token):
    """True if the token has a letter or a digit. Tokens such as "–" and "…" need no unit."""
    return bool(re.search(r"[^\W_]", token))


def chapter_sentences(chapter_dir):
    """The sentences of text.md in reading order, as (paragraph number, tokens)."""
    book = json.loads((chapter_dir.parent / "book.json").read_text(encoding="utf-8"))
    blocks = parse((chapter_dir / "text.md").read_text(encoding="utf-8"), book.get("oldSentenceSplit", False))
    return [(b, s) for b, block in enumerate(blocks) for s in block["sentences"]]


def token_list(t, tokens, at):
    """The errors in a list of token numbers."""
    if not isinstance(t, list) or not t or not all(isinstance(i, int) for i in t) or t != sorted(set(t)):
        return [f'{at}: "t" must be a non-empty list of token numbers, ascending, without repeats; found {t}']
    return [f"{at}: token {i} does not exist (the sentence has tokens 0 to {len(tokens) - 1})"
            for i in t if not 0 <= i < len(tokens)]


def check_units(units, tokens, where):
    """The errors in the popup units of one sentence ("words", or "units" in the old format)."""
    if not isinstance(units, list):
        return [f"{where}: the popup units must be a list"]
    errors, owner = [], {}
    for u, unit in enumerate(units):
        at = f"{where} unit {u}"
        if not isinstance(unit, dict) or not {"t", "es"} <= set(unit) <= UNIT_KEYS:
            errors.append(f'{at}: a unit is {{"t": [...], "es": "...", "base": "...", "note": "...", "also": [...]}} '
                          f'(base, note and also are optional); found {unit}')
            continue
        bad = token_list(unit["t"], tokens, at)
        errors += bad
        if not bad:
            for i in unit["t"]:
                if i in owner:
                    errors.append(f'{at}: token {i} "{tokens[i]}" is also in unit {owner[i]}')
                owner[i] = u
        if not isinstance(unit["es"], str) or not unit["es"].strip():
            errors.append(f'{at}: "es" must be a non-empty string')
        for key in ("base", "note"):
            if key in unit and (not isinstance(unit[key], str) or not unit[key].strip()):
                errors.append(f'{at}: "{key}" must be a non-empty string; leave it out if there is none')
        if "[[" in LINK.sub("", unit.get("note", "")):
            errors.append(f'{at}: a link in a note is [[id]], with an id of lower-case letters, digits and -')
        also = unit.get("also", ["-"])
        if not isinstance(also, list) or not 1 <= len(also) <= 4 or not all(isinstance(x, str) and x.strip() for x in also):
            errors.append(f'{at}: "also" must be a list of 1 to 4 non-empty strings; leave it out if there is none')
    errors += [f'{where}: token {i} "{token}" is in no unit' for i, token in enumerate(tokens)
               if is_word(token) and i not in owner]
    return errors


def check_line(line, tokens, where):
    """The errors in the reading line of one sentence."""
    if not isinstance(line, list) or not line:
        return [f'{where}: "line" must be a non-empty list of chunks']
    errors, last = [], -1
    covered = set()
    for c, chunk in enumerate(line):
        at = f"{where} chunk {c}"
        if not isinstance(chunk, dict) or set(chunk) != {"t", "es"}:
            errors.append(f'{at}: a chunk is {{"t": [...], "es": "..."}}; found {chunk}')
            continue
        if not isinstance(chunk["es"], str) or not chunk["es"].strip():
            errors.append(f'{at}: "es" must be a non-empty string')
        bad = token_list(chunk["t"], tokens, at)
        if bad:
            errors += bad
            continue
        t = chunk["t"]
        gaps = [i for i in range(t[0], t[-1] + 1) if i not in t and is_word(tokens[i])]
        if gaps:
            errors.append(f'{at}: a chunk is a run of tokens next to each other; it skips token {gaps[0]} "{tokens[gaps[0]]}". '
                          "If the Spanish order is different, make one bigger chunk")
        if t[0] <= last:
            errors.append(f"{at}: the chunks must follow the English order, without overlaps; it starts at token {t[0]}, "
                          f"but the chunk before it ends at token {last}")
        last = max(last, t[-1])
        covered |= set(t)
    errors += [f'{where}: token {i} "{token}" is in no chunk' for i, token in enumerate(tokens)
               if is_word(token) and i not in covered]
    return errors


def check(answer, sentences, first, last):
    """Return a list of errors in the answer to the job with sentences first..last (an empty list if it is correct)."""
    if not isinstance(answer, dict) or set(answer) != {"sentences"} or not isinstance(answer["sentences"], list):
        return ['the file must be one object: {"sentences": [...]}']
    errors = []
    ids = [s.get("id") if isinstance(s, dict) else None for s in answer["sentences"]]
    if ids != list(range(first, last + 1)):
        errors.append(f"the sentence ids must be {first} to {last}, in order, each one time; found {ids}")
    for s in answer["sentences"]:
        if not isinstance(s, dict) or not isinstance(s.get("id"), int) or not first <= s["id"] <= last:
            continue
        where, tokens = f"s{s['id']}", sentences[s["id"]][1]
        if set(s) == OLD_SENTENCE_KEYS:
            if not isinstance(s["es"], str) or not s["es"].strip():
                errors.append(f'{where}: "es" (the sentence translation) must be a non-empty string')
            errors += check_units(s["units"], tokens, where)
        elif set(s) == SENTENCE_KEYS:
            errors += check_line(s["line"], tokens, where)
            errors += check_units(s["words"], tokens, where)
        else:
            errors.append(f"{where}: the keys must be {sorted(SENTENCE_KEYS)}; found {sorted(s)}")
    return errors


def site_entry(s):
    """One sentence of an answer, as the app reads it: {es, line (new format only), units}."""
    if "units" in s:
        return {"es": s["es"], "units": s["units"]}
    return {"es": " ".join(c["es"] for c in s["line"]), "line": s["line"], "units": s["words"]}


def load_source(chapter_dir):
    return json.loads((chapter_dir / "es" / "source.json").read_text(encoding="utf-8"))


def load_answer(path):
    """The answer as JSON, or None and the error."""
    try:
        return json.loads(path.read_text(encoding="utf-8")), None
    except FileNotFoundError:
        return None, f"{path} does not exist"
    except json.JSONDecodeError as error:
        return None, f"{path} is not valid JSON: {error}"


def merge(chapter_dir):
    """The checked translations of the chapter: a list with one item (or None) for each sentence.

    Skips answers with errors, and sentences whose text changed after prep. Prints what it skipped.
    """
    sentences = chapter_sentences(chapter_dir)
    if not (chapter_dir / "es" / "source.json").exists():
        return None
    source = load_source(chapter_dir)
    merged = [None] * len(sentences)
    for job, (first, last) in enumerate(source["jobs"], 1):
        path = chapter_dir / "es" / f"{job:02d}.json"
        if not path.exists():
            continue
        answer, error = load_answer(path)
        errors = [error] if error else check(answer, [(0, t.split()) for t in source["sentences"]], first, last)
        if errors:
            print(f"  {path}: {len(errors)} errors, skipped (run: python tools/translation.py check ... {job})")
            continue
        for s in answer["sentences"]:
            i = s["id"]
            if i < len(sentences) and " ".join(sentences[i][1]) == source["sentences"][i]:
                merged[i] = site_entry(s)
        new = sorted({id for id, _ in links(answer)} - set(load_concepts()))
        if new:
            print(f"  {path}: links to concepts that are not in {CONCEPTS.name}: {', '.join(new)}. "
                  "Add them, or remove the links. The app shows the notes without them.")
    changed = sum(i >= len(sentences) or " ".join(sentences[i][1]) != text for i, text in enumerate(source["sentences"]))
    if changed:
        print(f"  {changed} sentences changed after prep: they have no translation until the jobs are made again")
    return merged


# Words in one job when --jobs is not given. Big jobs keep a chapter consistent: one agent makes
# the same choices (tú or usted, one gloss for one word, one note for one idea) in all its sentences.
JOB_WORDS = 1500


def prep(book_dir, number, jobs, paragraphs, force):
    """Make the jobs. With paragraphs, the jobs cover only the first that many blocks (headings count)."""
    chapter_dir = book_dir / f"{number:02d}"
    es = chapter_dir / "es"
    answers = sorted(es.glob("[0-9][0-9].json"))
    if answers and not force:
        sys.exit(f"{es} already has answers ({len(answers)} files). Use --force to make new jobs; the old answers will not fit.")
    sentences = chapter_sentences(chapter_dir)
    covered = [s for s in sentences if paragraphs is None or s[0] < paragraphs]

    # Cut after a paragraph, when the job has its share of the words.
    total = sum(len(t) for _, t in covered)
    jobs = jobs or max(1, round(total / JOB_WORDS))
    ranges, first, words = [], 0, 0
    for i, (paragraph, tokens) in enumerate(covered):
        words += len(tokens)
        paragraph_ends = i + 1 == len(covered) or covered[i + 1][0] != paragraph
        if paragraph_ends and (words >= total * (len(ranges) + 1) / jobs or i + 1 == len(covered)):
            ranges.append([first, i])
            first = i + 1

    (es / "jobs").mkdir(parents=True, exist_ok=True)
    for old in (es / "jobs").glob("*.md"):
        old.unlink()
    source = {"sentences": [" ".join(t) for _, t in sentences], "jobs": ranges}
    (es / "source.json").write_text(json.dumps(source, ensure_ascii=False, indent=1) + "\n", encoding="utf-8", newline="\n")
    for job, (first, last) in enumerate(ranges, 1):
        lines = [f"# Job {job:02d}: sentences {first} to {last} of {book_dir.as_posix()} chapter {number}", "",
                 f"Answer file: {(es / f'{job:02d}.json').as_posix()}",
                 f"Check: python tools/translation.py check {book_dir.as_posix()} {number} {job}",
                 "Instructions: guides/translation-es.md", "",
                 "A blank line separates paragraphs. Each token has its number in [brackets].", ""]
        for i in range(first, last + 1):
            if i > first and sentences[i][0] != sentences[i - 1][0]:
                lines.append("")
            lines.append(f"s{i}: " + " ".join(f"[{k}]{t}" for k, t in enumerate(sentences[i][1])))
        (es / "jobs" / f"{job:02d}.md").write_text("\n".join(lines) + "\n", encoding="utf-8", newline="\n")
        size = sum(len(sentences[i][1]) for i in range(first, last + 1))
        print(f"job {job:02d}: sentences {first}-{last} ({last - first + 1} sentences, {size} tokens)")


def check_cmd(book_dir, number, job):
    chapter_dir = book_dir / f"{number:02d}"
    source = load_source(chapter_dir)
    if not 1 <= job <= len(source["jobs"]):
        sys.exit(f"there is no job {job}; the jobs are 1 to {len(source['jobs'])}")
    first, last = source["jobs"][job - 1]
    path = chapter_dir / "es" / f"{job:02d}.json"
    answer, error = load_answer(path)
    errors = [error] if error else check(answer, [(0, t.split()) for t in source["sentences"]], first, last)
    if errors:
        print(f"{path}: {len(errors)} errors")
        for e in errors[:60]:
            print(f"  {e}")
        if len(errors) > 60:
            print(f"  ... and {len(errors) - 60} more")
        sys.exit(1)
    units = [u for s in answer["sentences"] for u in s.get("words", s.get("units"))]
    chunks = sum(len(s.get("line", [])) for s in answer["sentences"])
    count = lambda key: sum(key in u for u in units)
    print(f"OK: {path}: {len(answer['sentences'])} sentences, {chunks} chunks, {len(units)} units, "
          f"{count('base')} base forms, {count('note')} notes, {count('also')} with other meanings, "
          f"{len(links(answer))} concept links")
    concepts = load_concepts()
    for id, where in links(answer):
        if id not in concepts:
            print(f"  new concept [[{id}]] in {where}: not in {CONCEPTS.as_posix()}. Propose it in your reply.")


def show(book_dir, number, job):
    """Print the answers of the chapter (or of one job) for a person to read: the reading line, then the popup help."""
    chapter_dir = book_dir / f"{number:02d}"
    source = load_source(chapter_dir)
    jobs = [job] if job else range(1, len(source["jobs"]) + 1)
    for j in jobs:
        answer, error = load_answer(chapter_dir / "es" / f"{j:02d}.json")
        if error:
            print(f"job {j}: {error}\n")
            continue
        for s in answer["sentences"]:
            tokens = source["sentences"][s["id"]].split()
            span = lambda t: " … ".join(" ".join(tokens[i] for i in run) for run in runs(t))
            print(f"s{s['id']}  {' '.join(tokens)}")
            entry = site_entry(s)
            if "line" in entry:
                print("  line: " + " | ".join(f"{span(c['t'])} = {c['es']}" for c in entry["line"]))
            print(f"  es:   {entry['es']}")
            for u in entry["units"]:
                base = f" ({u['base']})" if "base" in u else ""
                print(f"    {span(u['t'])}{base} = {u['es']}" + (f"\n        note: {u['note']}" if "note" in u else "")
                      + (f"\n        also: {' | '.join(u['also'])}" if "also" in u else ""))
            print()


def runs(t):
    """Token numbers as runs of numbers next to each other: [1, 2, 5] -> [[1, 2], [5]]."""
    out = []
    for i in t:
        if out and i == out[-1][-1] + 1:
            out[-1].append(i)
        else:
            out.append([i])
    return out


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    sub = parser.add_subparsers(dest="command", required=True)
    p = sub.add_parser("prep")
    p.add_argument("book_dir", type=Path)
    p.add_argument("chapter", type=int)
    p.add_argument("--jobs", type=int, help=f"number of jobs (default: one for each {JOB_WORDS} words)")
    p.add_argument("--paragraphs", type=int, help="only the first N blocks of text.md (headings count)")
    p.add_argument("--force", action="store_true")
    c = sub.add_parser("check")
    c.add_argument("book_dir", type=Path)
    c.add_argument("chapter", type=int)
    c.add_argument("job", type=int)
    s = sub.add_parser("show")
    s.add_argument("book_dir", type=Path)
    s.add_argument("chapter", type=int)
    s.add_argument("job", type=int, nargs="?")
    args = parser.parse_args()
    if args.command == "prep":
        prep(args.book_dir, args.chapter, args.jobs, args.paragraphs, args.force)
    elif args.command == "check":
        check_cmd(args.book_dir, args.chapter, args.job)
    else:
        show(args.book_dir, args.chapter, args.job)


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
