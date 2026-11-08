"""The English dictionary for the popup (guides/dictionary-en.json), and the raw data to make its entries.

Usage:
  python tools/dictionary.py index                       build the local index from the download (one time)
  python tools/dictionary.py raw WORD [WORD ...]         print the raw data of words, to write their entries
  python tools/dictionary.py words books/duke 1 [JOB]    list the base words of a chapter (or job), and which
                                                         ones have no entry yet
  python tools/dictionary.py check                       check guides/dictionary-en.json

The raw data is English Wiktionary, as kaikki.org exports it (CC BY-SA). Download it to
sources/kaikki/English.jsonl.gz (git ignores sources/):
  curl -L -H "Accept-Encoding: gzip" -o sources/kaikki/English.jsonl.gz \\
    https://kaikki.org/dictionary/English/kaikki.org-dictionary-English.jsonl

Instructions for the entries: guides/dictionary-en.md.
"""
import argparse
import gzip
import json
import re
import sqlite3
import sys
from pathlib import Path

from wordfreq import zipf_frequency

ROOT = Path(__file__).resolve().parent.parent
DOWNLOAD = ROOT / "sources" / "kaikki" / "English.jsonl.gz"
INDEX = ROOT / "sources" / "kaikki" / "index.sqlite"
DICTIONARY = ROOT / "guides" / "dictionary-en.json"
FORMS = {"past": "pasado", "participle": "participio", "plural": "plural", "comparative": "comparativo",
         "superlative": "superlativo"}  # the app shows the Spanish names
ID = re.compile(r"[a-z0-9-]+")


def slim(e):
    """One raw entry, without what the entries do not need (sounds, etymology, categories...)."""
    senses = []
    for s in e.get("senses", []):
        senses.append({k: v for k, v in {
            "gloss": (s.get("glosses") or s.get("raw_glosses") or [""])[-1],
            "tags": s.get("tags"),
            "of": [f["word"] for f in s.get("form_of", [])] or None,
            "ex": [x["text"] for x in s.get("examples", [])[:2] if x.get("text")] or None,
        }.items() if v})
    return {k: v for k, v in {
        "pos": e.get("pos"),
        "forms": [[f["form"], f.get("tags", [])] for f in e.get("forms", []) if f.get("form") and
                  set(f.get("tags", [])) & {"past", "participle", "plural", "comparative", "superlative"}] or None,
        "senses": senses,
        "es": [[t.get("sense", ""), t["word"]] for t in e.get("translations", []) if t.get("code") == "es" and t.get("word")] or None,
    }.items() if v}


def index():
    if not DOWNLOAD.exists():
        sys.exit(f"{DOWNLOAD} does not exist. See the usage in this file to download it.")
    INDEX.unlink(missing_ok=True)
    db = sqlite3.connect(INDEX)
    db.execute("CREATE TABLE entries (word TEXT, data TEXT)")
    n = 0
    with gzip.open(DOWNLOAD, "rt", encoding="utf-8") as f:
        for line in f:
            e = json.loads(line)
            if e.get("lang_code") != "en" or not e.get("word"):
                continue
            db.execute("INSERT INTO entries VALUES (?, ?)", (e["word"], json.dumps(slim(e), ensure_ascii=False)))
            n += 1
            if n % 200000 == 0:
                print(f"  {n} entries")
    db.execute("CREATE INDEX by_word ON entries (word)")
    db.commit()
    print(f"{INDEX}: {n} entries")


def lookup(db, word):
    """The raw entries of a word: [{pos, forms, senses, es}...]."""
    return [json.loads(d) for (d,) in db.execute("SELECT data FROM entries WHERE word = ?", (word,))]


def open_index():
    if not INDEX.exists():
        sys.exit(f"{INDEX} does not exist. Run: python tools/dictionary.py index")
    return sqlite3.connect(INDEX)


def raw(words):
    db = open_index()
    for word in words:
        entries = lookup(db, word)
        if not entries:
            print(f"== {word}: not in Wiktionary\n")
        for e in entries:
            print(f"== {word} ({e['pos']})")
            if "forms" in e:
                print("  forms: " + ", ".join(f"{form} ({' '.join(tags)})" for form, tags in e["forms"]))
            for n, s in enumerate(e["senses"], 1):
                tags = f" [{', '.join(s['tags'])}]" if "tags" in s else ""
                print(f"  {n}.{tags} {s['gloss']}" + (f"  (form of: {', '.join(s['of'])})" if "of" in s else ""))
                for x in s.get("ex", []):
                    print(f"       e.g. {x[:140]}")
            groups = {}
            for sense, es in e.get("es", []):
                groups.setdefault(sense, []).append(es)
            for sense, es in groups.items():
                print(f"  es ({sense or '-'}): {', '.join(es)}")
            print()


def load():
    return json.loads(DICTIONARY.read_text(encoding="utf-8")) if DICTIONARY.exists() else {}


def check_entries(entries):
    """The errors in the dictionary."""
    errors = []
    for word, e in entries.items():
        if not isinstance(e, dict) or not {"senses"} <= set(e) <= {"forms", "senses"}:
            errors.append(f'"{word}": an entry is {{"forms": {{...}} (optional), "senses": [...]}}')
            continue
        forms = e.get("forms", {"past": "-"})
        if not isinstance(forms, dict) or not forms or not set(forms) <= set(FORMS) or not all(
                isinstance(x, str) and x.strip() for x in forms.values()):
            errors.append(f'"{word}": "forms" must be an object with some of the keys {", ".join(FORMS)}')
        senses = e["senses"]
        if not isinstance(senses, list) or not senses:
            errors.append(f'"{word}": "senses" must be a non-empty list')
            continue
        ids = [s.get("id") if isinstance(s, dict) else None for s in senses]
        for s in senses:
            if (not isinstance(s, dict) or set(s) != {"id", "es", "ex"} or not isinstance(s["id"], str)
                    or not ID.fullmatch(s["id"]) or not all(isinstance(s[k], str) and s[k].strip() for k in ("es", "ex"))):
                errors.append(f'"{word}": a sense is {{"id": "travel", "es": "billete", "ex": "a train ticket"}}, '
                              f"with an id of lower-case letters, digits and -; found {s}")
        if len(set(ids)) != len(ids):
            errors.append(f'"{word}": the sense ids must be different')
    return errors


def check():
    errors = check_entries(load())
    for e in errors:
        print(e)
    if errors:
        sys.exit(1)
    print(f"OK: {DICTIONARY.name}: {len(load())} entries")


def clean(token):
    """A token without the punctuation around it: "‘Watson?’" -> "Watson". Keeps "doctor's"."""
    return re.sub(r"^\W+|(\W|'s$)+$", "", token.replace("’", "'"))


def base_words(db, token):
    """The words that a token can be a form of, and the token itself: "came" -> ["come", "came"].

    Wiktionary also has rare readings ("came" is also a past of "cum"). Keep the readings that are about as
    common as the most common one (wordfreq).
    """
    word = clean(token)
    if not re.search(r"[^\W\d_]", word):
        return []
    candidates = []
    for w in dict.fromkeys([word, word.lower()]):
        for e in lookup(db, w):
            for s in e["senses"]:
                for of in s.get("of", []):
                    if "form-of" in s.get("tags", []) and of not in candidates and lookup(db, of):
                        candidates.append(of)
    own = word.lower() if lookup(db, word.lower()) else word
    candidates = list(dict.fromkeys(candidates + [own]))
    top = max(zipf_frequency(c, "en") for c in candidates)
    return [c for c in candidates if zipf_frequency(c, "en") >= top - 1.2]


def words(book_dir, number, job):
    """The base words in a chapter, and the phrases (2 to 4 words) that Wiktionary has as entries."""
    sys.path.insert(0, str(ROOT / "tools"))
    from translation import load_source
    source = load_source(book_dir / f"{number:02d}")
    first, last = source["jobs"][job - 1] if job else (0, len(source["sentences"]) - 1)
    db, entries = open_index(), load()
    found = {}
    for i in range(first, last + 1):
        tokens = source["sentences"][i].split()
        bases = [base_words(db, t) for t in tokens]
        for b in bases:
            if b and not any(w == b[0] or w.startswith(b[0] + " / ") for w in found):  # "get / got" after "get"
                found.setdefault(" / ".join(b), None)
        for n in (2, 3, 4):
            for k in range(len(tokens) - n + 1):
                # Phrasal verbs and idioms: "looked at" -> "look at", the first word in its base form. Phrases
                # end where the sentence has a comma or a quote.
                if any(re.search(r"[,;:?!’'\"–—]$", t) for t in tokens[k:k + n - 1]):
                    continue
                rest = [clean(t).lower() for t in tokens[k + 1:k + n]]
                for head in bases[k][:-1] or bases[k]:  # a form of a word: only the base form ("look at", not "looked at")
                    phrase = " ".join([head] + rest)
                    if lookup(db, phrase):
                        found.setdefault(phrase, None)
    missing = [w for w in found if not any(x in entries for x in w.split(" / "))]
    print(f"{len(found)} words and phrases; {len(missing)} without an entry in {DICTIONARY.name}:")
    for w in missing:
        print(f"  {w}")


def main():
    parser = argparse.ArgumentParser(description=__doc__.split("\n")[0])
    sub = parser.add_subparsers(dest="command", required=True)
    sub.add_parser("index")
    r = sub.add_parser("raw")
    r.add_argument("words", nargs="+")
    w = sub.add_parser("words")
    w.add_argument("book_dir", type=Path)
    w.add_argument("chapter", type=int)
    w.add_argument("job", type=int, nargs="?")
    sub.add_parser("check")
    args = parser.parse_args()
    if args.command == "index":
        index()
    elif args.command == "raw":
        raw(args.words)
    elif args.command == "words":
        words(args.book_dir, args.chapter, args.job)
    else:
        check()


if __name__ == "__main__":
    sys.stdout.reconfigure(encoding="utf-8")
    main()
