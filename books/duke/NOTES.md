# Sherlock Holmes and the Duke's Son: notes

Things that are special to this book. Read this before you add a chapter. Add to it when you find something new.

## Sources

- Text: `source/book.pdf`, an Internet Archive scan of the 2002 printing (ISBN 9780194229616) with an OCR layer. The 2008 edition (ISBN 9780194787093) has the same text, but its PDF has images only.
- Audio: the Oxford Bookworms audiobook, read by Richard Mitchly (Audible, 59 min). Our copy is one MP3 of 58:52 (48 kHz stereo, 224 kbps), probably from YouTube. It is not in git: `audio/duke/full.mp3`.
- Only chapter 1 is in git. Chapters 2–7 stay on this computer (`.gitignore`). To publish a chapter, add it to `book.json` and remove its line from `.gitignore`.

## Audio

The chapter files come from `full.mp3`, cut with `-c copy` at 355.94, 907.53, 1358.76, 2024.1, 2629.86 and 2995.32 s. The files with these cuts are `audio/duke/0N-*.mp3`.

Each chapter has these problems. Remove them with `fix_audio.py` **before** `transcribe.py`, so the timings fit the clean audio:

1. **Title music.** After the narrator reads the chapter title, music plays for about 10.5 s. It starts about 0.6 s after the last word of the title. It fades out under the first word of the text. Remove it with `--cut`: start in the silence before the music, and stop just before the first word. The default `--gap 0.5` gives a pause of about 1.1 s after the title, the same as the narrator's pause inside the title.
2. **YouTube chime and mouse click.** A "subscribe" chime: a click, then tones at 2689 and 2774 Hz with overtones, for about 1.8 s. Remove the tones with `--chime` and the click with `--click`. The click is 80–110 ms long. Find its edges with a high-pass (4 kHz) envelope. If the click is on top of speech, do not cut more than `--click` does.
3. **Mouse clicks before the chime.** In chapter 1, a mouse button click (press and release, 106 ms apart) is in the "sh" of "Sherlock", 1.3 s before the chime. Each is a spike of about 4 ms, 15–20 dB over the speech above 5 kHz. `--click` cannot remove it, because the "sh" is also high sound. Use `--declick` with a window of about 25 ms around each spike. Look for these spikes in the 2 s before each chime.

To find the chime, scan the chapter for a narrow peak at 2689 or 2774 Hz, then look at a spectrogram (`ffmpeg -lavfi showspectrumpic`). Speech also gives weak peaks at these frequencies. A real chime shows as thin horizontal lines that continue through the pauses.

Keep the original file as `audio/duke/0N-original-with-chime.mp3`. Make the clean file from the original in one run, so the audio gets only one more lossy encode. `fix_audio.py` writes the project's format (Opus 24 kbps mono, `.webm`). The Opus file has the same timing as the MP3 (0 ms offset).

| Ch | Title music (approx., s in the cut file) | Chime | Click | Done |
|----|------|------|------|------|
| 1 | 5.66–15.97 | 19.62–21.55 | 19.706–19.782; declick 18.303–18.330 and 18.410–18.437 | yes |
| 2 | 6.38–17.91 | none found | | |
| 3 | 6.71–17.71 | none found | | |
| 4 | 5.80–16.63 | none found | | |
| 5 | 6.00–17.73 | none found | | |
| 6 | 7.40–19.07 | none found | | |
| 7 | 5.43–16.74 | 530.15–531.95 ("…put it carefully…") | 530.196–530.302 (on top of the "t" in "put") | |

The title music times for chapters 2–7 are the gaps between words, not the edges of the music. Measure the edges before you cut. For chapter 1, the music starts 0.6 s after the title and ends 0.01 s before the first word.

Chapter 1 command:

```
.venv/Scripts/python books/duke/fix_audio.py audio/duke/01-original-with-chime.mp3 audio/duke/01-sherlock-holmes-has-a-visitor.webm --cut 5.66 15.97 --cut 239.20 241.03 --chime 19.62 21.55 --click 19.706 19.782 --declick 18.303 18.330 --declick 18.410 18.437
```

The second cut in chapter 1 makes a pause of 3.3 s shorter, after "…the page about the Duke of Holdernesse." The pause is digital silence, so the cut cannot be heard. The pause is now 2.0 s. The word times after it in `whisper.json` and `words.json` moved 1.33 s earlier; Whisper did not run again.

The files of chapters 2–7 on this computer still have the title music. Their `whisper.json` and `words.json` fit the audio with the music. After you clean a chapter, run `transcribe.py` and `retime.py` again.

## Text

- The OCR text needed cleanup: OCR errors, picture captions, map labels and broken paragraphs. Compare each chapter with the page images.
- Dashes are the book's spaced en dash (–).
- Headings are title case, as in hp1: `# Chapter One: Sherlock Holmes Has a Visitor`.
- `book.json` has a Whisper prompt with the names of the people and places.

## Narration against the text

Whisper agrees with 98–99% of the words. The rest are pronunciation only. Do not change the text for these:

- "Holdernesse" is said "Holderness".
- Whisper hears "Shaw" as "Shore".
- Whisper writes numbers as figures ("16").

Places where the narrator may differ from the book. Listen to each one before you publish its chapter:

- Ch4, about 1:20: "and once some cow tracks"? The book has "and some cow tracks".
- Ch4, about 3:40: "Nope" against the book's ‘No,’.
- Ch4, about 8:00: a stumble, "So… so far".

The chapter 4 times are with the title music in the audio.

## Translation

Follow `guides/translation-es.md`. This section adds what is special to this book.

### Reader

- Level **A2** in English. The book is an Oxford Bookworms Stage 1 reader (about 400 headwords). Expect beginners: many words need a gloss, irregular verbs need their base form, and contractions and simple grammar can need a note.
- Notes in short, easy Spanish.

### Voice

- Dr Watson tells the story in the first person ("I"). The sentences are short and simple, because it is a graded reader.
- The story happens in England in about 1900. The Spanish can have a little period flavour (*el señor Holmes*, *caballero*), but it must not sound old or stiff.
- Holmes is calm, sure of himself and a little dry. Dr Huxtable is formal and worried.

### Tú or usted

- Holmes and Watson: *usted*, as in the classic Spanish translations of Conan Doyle.
- Everybody else, with everybody: *usted*, unless the book notes say otherwise for a pair.

### Names and terms

Add the names of each chapter before you translate it. Names in a later chapter can tell too much. Do not add them early.

| English | Spanish | Hint |
|---|---|---|
| Sherlock Holmes | Sherlock Holmes | |
| Mr Holmes | señor Holmes | |
| Watson, Dr Watson | Watson, el doctor Watson | The narrator. |
| Baker Street | Baker Street | Holmes lives at 221B Baker Street, London. |
| Dr Thorneycroft Huxtable | el doctor Thorneycroft Huxtable | |
| Dr (before a name) | doctor | *el doctor Huxtable*. |
| sir | señor, caballero | When Holmes speaks to a man with respect. |
| Mackleton | Mackleton | A town in the north of England (invented). |
| the north of England | el norte de Inglaterra | |
| London | Londres | |
| the Ferrers case | el caso Ferrers | |
| the Abergavenny case | el caso Abergavenny | |
| the Duke of Holdernesse | el duque de Holdernesse | Spanish writes *duque* in lower case. |
| the Duke | el duque | |
| Government Minister | ministro del Gobierno | |
| Edith | Edith | |
| Lord Grey | lord Grey | Spanish writes *lord* in lower case. |
| Lord Arthur Saltire | lord Arthur Saltire | |
| Lancashire | Lancashire | |
| Wales | Gales | |
| pounds | libras | Money. |

### Spoilers

This is a mystery. The reader must find things out at the same time as Holmes.

- Use only what the text has told up to the sentence you translate. Do not use what you know of later chapters, or of Conan Doyle's story *The Adventure of the Priory School*.
- Do not hint that a person, a place or a detail will be important.
- A note about a name explains only the language (a title, a spelling), never who the person is in the story.

## Open questions

- Chapter 2 seemed out of sync in the browser at about 0:32. This is not checked. Check it when you clean chapter 2. Its audio comes straight from the `-c copy` cut and was never encoded again.
