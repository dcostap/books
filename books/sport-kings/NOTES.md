# Sherlock Holmes and the Sport of Kings

## Sources

- Text: Jennifer Bassett’s Oxford Bookworms Stage 1 retelling of *Silver Blaze*, A1–A2. [Oxford lists 5,925 words](https://www.oup.es/es/sherlock-holmes-and-the-sport-of-kings/).
- `source/book.pdf`: [text-only PDF](https://www.dannysenglish.com/wp-content/uploads/2024/03/Sherlock-Holmes-and-the-Sport-of-Kings.pdf). The six chapters start on printed pages 1, 5, 10, 16, 21 and 24. Add three to get the PDF page numbers. Use PDF pages 4–31. Omit the introduction and glossary.
- `cover.jpg`: [Oxford’s cover image](https://www.oup.es/wp-content/uploads/2024/06/Oxford-Bookworms-1-Sherlock-Holmes-and-the-Sport-of-Kings.jpg). The source PDF has no chapter pictures. Use a print scan for any future crops of Ron Tiner’s illustrations. Place pictures after the text that they show.
- Audio: [Reading English upload](https://www.youtube.com/watch?v=31o6i0Fjhrg), 1:04:58. Keep the unchanged source at `audio/sport-kings/full.mp4` (stereo AAC at 44.1 kHz). Five short waveforms match the [official Gareth Armstrong preview](https://books.apple.com/ie/audiobook/sherlock-holmes-and-the-sport-of-kings/id410440618) at the same offset, with correlations of 0.98–0.99.

## Audio cleanup

These ranges are in seconds in `full.mp4`. Keep the spoken chapter headings. The music occurs before each heading and after the last line. Do not cut narration just because the auto-captions mark it as music.

| Chapter | In | Out |
|---|---:|---:|
| 1 | 13.54 | 553.05 |
| 2 | 572.57 | 1268.75 |
| 3 | 1289.40 | 2054.45 |
| 4 | 2073.59 | 2774.14 |
| 5 | 2793.49 | 3216.48 |
| 6 | 3235.80 | 3877.56 |

The opening subscribe overlay adds click peaks at 17.32 and 17.43 s, a small click at 18.24 s, and a bell at 18.70 s. The bell overlaps the end of “Blaze.” Reuse the Duke audio filters there. Remove the bell tail in the pause and keep the first “I” at about 21.95 s. The final subscribe overlay is entirely in the music after the story.

Run from the repository root. The filter times in the second command are relative to `01-source.wav`.

```bash
src=audio/sport-kings/full.mp4
ffmpeg -v error -ss 13.54 -i "$src" -t 539.51 -vn -c:a pcm_f32le audio/sport-kings/01-source.wav
.venv/Scripts/python books/duke/fix_audio.py audio/sport-kings/01-source.wav audio/sport-kings/01.webm --cut 5.63 8.26 --gap 0.75 --chime 5.15 6.90 --click 4.68 4.74 --declick 3.766 3.794 --declick 3.872 3.901
for span in '02 572.57 696.18' '03 1289.40 765.05' '04 2073.59 700.55' '05 2793.49 422.99' '06 3235.80 641.76'; do
    set -- $span
    ffmpeg -v error -ss "$2" -i "$src" -t "$3" -vn -ac 1 -ar 48000 -c:a libopus -b:a 24k "audio/sport-kings/$1.webm"
done
```

The filters reduced the three click peaks above 6 kHz by 27–37 dB. The main bell peak near 2.77 kHz fell by 32 dB just after its start. The six clean files total 1:02:44. Keep the raw upload and clean audio local. `01-source.wav` is a temporary lossless file.

## Word timings

The Whisper maps come from the clean WebM files. Whisper matched 97.7–99.0% of the English words per chapter. The forced aligner timed all 5,941 tokens without using rough times for any section. The preview build checked token order and audio bounds for every chapter. Chrome played chapter 1 and sought to a word near the end of chapter 6.

If the audio changes, run `tools/transcribe.py` before `tools/retime.py`. If only the text changes, run `tools/retime.py` with the existing Whisper map. Run `tools/build.py` to add the book to `site/` when it is ready for release.

## Spanish help

Follow `guides/translation-es.md` and `guides/translation-workflow.md`. The reader is at A2. Use clear Spanish from Spain. Keep the Holmes and Watson forms of address from `books/duke/NOTES.md`. Keep character names as written in the English retelling. Explain place names without giving clues about the story.

No Spanish translation of the Bassett edition was found. The local reference is `sources/sport-kings/estrella-de-plata.pdf` and its `.txt` extract. [Elejandría](https://www.elejandria.com/libro/estrella-de-plata/conan-doyle-arthur/2169) credits its own translation of the original from Wikisource. The PDF metadata gives June 2024. Use it as a reference for wording, not as a translation of the graded text. It has no matching chapter divisions. Do not import details from the full story.

| English chapter | Related scenes in the Spanish PDF |
|---|---|
| 1 | PDF pp. 3–6, breakfast and train |
| 2 | PDF pp. 6–11, the events at the stables and the first questions |
| 3 | PDF pp. 10–18, arrival and the items in the trainer’s pockets |
| 4 | PDF pp. 17–23, the search and the return to the house |
| 5 | PDF pp. 23–25, the race |
| 6 | PDF pp. 25–29, Holmes’s explanation |

Review these terms before translation: `stables` → *cuadras*, `stable boy` → *mozo de cuadra*, `trainer` → *entrenador*, `moor` → *páramo*, `horse track` → *huella*, `horseshoe` → *herradura*. Use *Silver Blaze* for the name, not the reference title *Estrella de plata*. The graded English says *Mr Ross*, not *Colonel Ross*.

In chapter 2, Simpson uses *tú* with Edith and Ned. Ned uses *usted* with Simpson. The Strakers use *tú* with each other.

Do not explain a clue before the story does. In particular, do not assign motives or explain the dog, sheep or items in the trainer’s pockets early.

### Review record

All 663 entries passed two job reviews and two whole-chapter reviews. Each pass used a fresh `openai-codex/gpt-6.1-sol` reviewer with high thinking. The reviews ran for about 36 minutes with up to five agents. Each pass checked the reading lines, popup units, notes, and shared references. The whole-chapter passes also checked voice, repeated terms, forms of address, and when the story reveals each clue.

Each cell gives the reviewer ID and baseline commit. The Git log records the accepted changes after each pass that changed a file.

| Ch. | Job pass 1 | Job pass 2 | Whole pass 1 | Whole pass 2 |
|---|---|---|---|---|
| 1 | `sa-6a50b69d`, `04d6bd2` | `sa-01300422`, `fe64ecb` | `sa-3f06b7b9`, `5561cf9` | `sa-74ed133f`, `3797a2e` |
| 2 | `sa-ed006733`, `7fec728` | `sa-084a80b0`, `0bada63` | `sa-a8e3888a`, `cf4be0d` | `sa-d24d81c8`, `668a8ec` (no edits) |
| 3 | `sa-55305e06`, `096f735` | `sa-34691e36`, `29f43ce` | `sa-7e91396d`, `4090e55` | `sa-c0fc806d`, `422ae88` |
| 4 | `sa-5941a34f`, `7fec728` | `sa-a4777990`, `957fc6a` | `sa-a635ca21`, `6c4f32d` | `sa-b7bd1781`, `7a0adf5` |
| 5 | `sa-5efae113`, `7fec728` | `sa-1703c873`, `5f3693f` (no edits) | `sa-18000fc5`, `5f3693f` | `sa-5baa1ba4`, `a8b6bba` (no edits) |
| 6 | `sa-40387fda`, `c91b3d7` | `sa-b423f3f2`, `f15099b` | `sa-106713ac`, `cb12940` | `sa-aa255267`, `ba71538` |

No chapter issues or missing shared references remain. The shared `take` card is longer than the dictionary guide recommends. Keep its linked senses until a separate review checks the chapters that use them.
