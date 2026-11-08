# Audiobook reader

A static web app. It shows the text of a book and plays the narration. The current sentence and word are highlighted as the narrator reads them. Progress, settings, and saved words are kept in `localStorage`.

## Install on a phone

Open the published HTTPS site. In Chrome, select **Instalar app** in the library or use Chrome's install menu.
On iPhone or iPad, open Safari's Share menu and select **Add to Home Screen**.
The app opens in its own window. It has phone icons, theme colours, and space for screen cutouts.

After the first online visit, the library and saved words can open offline.
Previously loaded chapter text and Spanish help can also open offline. **Audio still needs an internet connection.**
The browser can remove cached files when device storage is low. Keep a backup of saved words.

Updates install when all app windows and browser tabs for the app close. Updates do not interrupt playback.
GitHub Actions runs `python tools/prepare_pwa.py` before publishing. Run it for other deployments or local cache tests.
It sets the cache version from the site files. No manual version change is needed.
Keep `site/icons/icon-1024.png` as the full-size icon master. The other icons include separate Android maskable artwork.
Run the PWA checks with `node --test tools/pwa.test.mjs`.

## Layout

```
books/<id>/book.json          book metadata, the source PDF, and the list of chapters (source audio paths)
books/<id>/NOTES.md           what is special to one book: audio, text, and translation (names, level, tú or usted)
books/<id>/cover.jpg
books/<id>/source/book.pdf    the book text (the same edition the narrator reads)
books/<id>/<nn>/text.md       the text the reader sees (from the book; edit this)
books/<id>/<nn>/whisper.json  what Whisper hears, with rough times (a map; generated)
books/<id>/<nn>/words.json    every token of text.md with its exact time (generated)
tools/import_text.py          book.pdf -> text.md for each chapter
tools/transcribe.py           audio -> whisper.json
tools/retime.py               text.md + whisper.json + audio -> words.json (forced aligner)
tools/build.py                books/ -> site/ (chapter JSON, chapter MP3, Spanish help, library.json)
tools/translation.py          Spanish help: splits a chapter into jobs, checks the answers, and shows them
guides/translation-es.md      the rules for the Spanish help (all books), for translators and reviewers
guides/concepts-es.json       ideas of English grammar that notes link to, with examples (all books)
guides/translation-workflow.md  how the orchestrator runs the translation of a chapter
books/<id>/<nn>/es/           the jobs and the answers for one chapter
site/                         the web app; GitHub Pages publishes this folder
```

## How the timing works

The book text is the truth. The timing comes from aligning the book text itself to the audio.

1. `transcribe.py` runs Whisper. Whisper's text has errors, and its word times are rough (on chapter 1 it started words 0.5 s early, by a different amount each time). That is enough for a map: which part of the text is where in the audio.
2. `retime.py` uses a forced aligner (torchaudio `MMS_FA`) to find where each word of `text.md` is spoken. It works on pieces of about 10 s. The map tells which text belongs to which piece, and each cut goes at the quietest moment of a pause. On chapter 1, 88% of the word starts are within 150 ms of the real start in the audio.

`retime.py` also prints how well the text fits the audio, for example `text matches Whisper for 97.1% of 4593 words`, and the longest unmatched stretches. A low rate or a long stretch means a wrong edition, a missing page, or narration that is not in the text.

## Editing text.md

You can edit `text.md` after `retime.py`, for example to fix a typo or split a paragraph. `build.py` then links each edited word to the nearest timed words and tells you to run `retime.py` again for exact times. `retime.py` takes about 15 s for each chapter.

Format:

- Blocks are separated by a blank line.
- A block that starts with `# ` is a heading. A block that is only `*` is a scene break. All other blocks are paragraphs.
- Sentences end at `.`, `!`, or `?` (a closing quote after them is allowed). `Mr.`, `Mrs.`, and initials such as `J.` do not end sentences.
- Add what the narrator reads that is not in the book as a heading, for example the book title before chapter 1. Then it is highlighted when it is spoken.

## Spanish help

The Spanish line under the English (the "ES" button) shows a natural Spanish translation of each sentence, in chunks under the English words they translate. Tap a word: the popup shows its unit (a word with its small words, or an idiom), its Spanish meaning at that place, its dictionary form, its other common meanings, an optional note, and the Spanish sentence with the unit's Spanish marked. A note can link to an idea of grammar (`[[uncountable]]`): the popup then shows the idea's explanation, examples and typical mistakes under the note. On narrow screens, this part is folded.

The bookmark in the popup saves the unit to "Mis palabras", with an optional note. A saved unit has a ring around it, in the theme's "saved" colour (`--saved`). On wide screens, its note shows in a bubble in the right margin. The "Mis palabras" page lists the saved units, newest first, with a search. Tap one to open the chapter at its place. The audio position does not change. The page also exports and imports a JSON copy, because `localStorage` is lost when the browser data is cleared.

Agents write the help. `guides/translation-workflow.md` has the steps, and `guides/translation-es.md` has the rules. In short:

1. `python tools/translation.py prep books/duke 1` splits the chapter into jobs of about 1500 words (`--jobs N` sets the number; `--paragraphs N` makes jobs for the first N blocks only).
2. An agent does each job. It runs `python tools/translation.py check books/duke 1 <job>` until the answer is correct.
3. `python tools/translation.py show books/duke 1` prints the answers for a person or a reviewer to read.
4. `build.py` checks the answers again and merges them. It skips an answer with errors, and a sentence whose text changed after prep.

hp1 chapter 1 uses the older format (one set of units for the popup and the line, and `books/hp1/es/glossary.md`). The tools still accept it.

## Commands

```
python -m venv .venv
.venv/Scripts/python -m pip install -r tools/requirements.txt
.venv/Scripts/python tools/import_text.py books/hp1    # needs pdftotext (poppler)
.venv/Scripts/python tools/transcribe.py books/hp1 1   # needs an NVIDIA GPU
.venv/Scripts/python tools/retime.py books/hp1 1
.venv/Scripts/python tools/build.py                     # needs ffprobe
npx http-server site -c-1                               # local preview; the server must support Range requests
```

If a book has no text source, `transcribe.py` writes a first draft of `text.md` from Whisper.
