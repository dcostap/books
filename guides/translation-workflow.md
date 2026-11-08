# Workflow: translating a chapter

The user directs the work: what to translate, with which agents and models, and when it is good enough. This file only lists the tools and habits that help.

- **Instructions:** every translator or reviewer reads `guides/translation-es.md` and the "Translation" section of `books/<id>/NOTES.md`. A task is these two files plus a few lines, for example "translate job 2" or "do not edit; list spoilers".
- **Book notes first:** before a chapter, add its names, *tú* or *usted*, and anything special to the book notes. Ask the user about choices that come back in every chapter.
- **Jobs:** `.venv/Scripts/python tools/translation.py prep books/<id> <n> [--jobs N] [--paragraphs N]` writes the jobs, with a number on each token.
- **Check:** `python tools/translation.py check books/<id> <n> <job>` must print `OK`.
- **Read:** `python tools/translation.py show books/<id> <n> [job]` prints each sentence with its line and popup units. Then `build.py` and look at the chapter in the app with the Spanish line on.
- **Concepts:** `guides/concepts-es.json` is for all books. Translators link new concept ids and propose them in their reply. The user or the orchestrator decides: add the entry (with examples, and typical mistakes in `wrong` when there are some; every English word in `name` and `text` goes in *asterisks*, as in notes), or remove the link and keep the note text. `build.py` lists links to entries that do not exist.
- **Learn:** when the same mistake comes back, propose a change to the guide or the book notes to the user.
- **English errors:** do not change `text.md` to fix the English text, because that breaks the timings. Tell the user.
