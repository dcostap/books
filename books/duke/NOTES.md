# Sherlock Holmes and the Duke's Son: notes

Things that are special to this book. Read this before you add a chapter. Add to it when you find something new.

## Sources

- Text: `source/book.pdf`, an Internet Archive scan of the 2002 printing (ISBN 9780194229616) with an OCR layer. The 2008 edition (ISBN 9780194787093) has the same text, but its PDF has images only.
- Audio: the Oxford Bookworms audiobook, read by Richard Mitchly (Audible, 59 min). Our copy is one MP3 of 58:52 (48 kHz stereo, 224 kbps), probably from YouTube. It is not in git: `audio/duke/full.mp3`.
- All seven chapters are included.

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
| 2 | 6.95–17.76 | none found | | yes |
| 3 | 7.02–17.62 | none found | | yes |
| 4 | 6.20–16.58 | none found | | yes |
| 5 | 6.20–17.55 | none found | | yes |
| 6 | 7.65–18.96 | none found | | yes |
| 7 | 5.75–16.64 | 530.15–531.95 ("…put it carefully…") | 530.196–530.302; declick 528.825–528.852 and 528.930–528.960 | yes |

The title music times for chapters 3–7 are the gaps between words, not the edges of the music. Measure the edges before you cut. For chapter 1, the music starts 0.6 s after the title and ends 0.01 s before the first word. For chapter 2, the title ends at 6.45 s, the music plays from 7.05 to 17.25 s, and the first word starts at 17.80 s.

Chapter 1 command:

```
.venv/Scripts/python books/duke/fix_audio.py audio/duke/01-original-with-chime.mp3 audio/duke/01-sherlock-holmes-has-a-visitor.webm --cut 5.66 15.97 --cut 239.20 241.03 --chime 19.62 21.55 --click 19.706 19.782 --declick 18.303 18.330 --declick 18.410 18.437
```

The second cut in chapter 1 makes a pause of 3.3 s shorter, after "…the page about the Duke of Holdernesse." The pause is digital silence, so the cut cannot be heard. The pause is now 2.0 s. The word times after it in `whisper.json` and `words.json` moved 1.33 s earlier; Whisper did not run again.

Chapter 2 command (the source has no chime, so it keeps its name):

```
.venv/Scripts/python books/duke/fix_audio.py audio/duke/02-dr-huxtables-story.mp3 audio/duke/02-dr-huxtables-story.webm --cut 6.95 17.76
```

Chapter 3 command. The title ends at 6.80 s, the music plays from 7.12 to 17.30 s, and the first word starts at 17.66 s. `--gap 0.8` gives the same pause after the title as in chapters 1 and 2 (1.06 s):

```
.venv/Scripts/python books/duke/fix_audio.py audio/duke/03-holmes-and-watson-go-north.mp3 audio/duke/03-holmes-and-watson-go-north.webm --cut 7.02 17.62 --gap 0.8
```

In chapter 3, Whisper wrote "Holmes!" again and again from 3:24 to 4:00, and invented words in two other places. The words in 196–248, 340–360 and 398–416 s of `whisper.json` come from Whisper on short clips (`condition_on_previous_text=False`). After that, `retime.py` matches 97.6% of the words.

Chapter 4 command. The title ends at 5.97 s, the music starts at about 6.4 s, and it still plays when the first word starts at 16.63 s, as in chapter 1:

```
.venv/Scripts/python books/duke/fix_audio.py audio/duke/04-the-body-on-the-moor.mp3 audio/duke/04-the-body-on-the-moor.webm --cut 6.20 16.58 --gap 0.8
```

Chapter 5 command. The title ends at 5.95 s, the music plays from about 7.0 to 17.2 s, and the first word starts at 17.60 s:

```
.venv/Scripts/python books/duke/fix_audio.py audio/duke/05-a-visit-to-the-green-man.mp3 audio/duke/05-a-visit-to-the-green-man.webm --cut 6.20 17.55 --gap 0.8
```

In chapter 5, Whisper heard "Yes." at about 8:05 as "What Somebody's", and it did not hear the second "and sometimes like this" at about 4:10. The words in 247–259.5 and 483–495 s of `whisper.json` come from Whisper on short clips. After that, `retime.py` matches 99.7% of the words.

Chapter 6 command. The title ends at about 7.45 s, the music starts at about 8.3 s, and the first word starts at 19.01 s:

```
.venv/Scripts/python books/duke/fix_audio.py audio/duke/06-sherlock-holmes-talks-to-the-duke.mp3 audio/duke/06-sherlock-holmes-talks-to-the-duke.webm --cut 7.65 18.96 --gap 0.8
```

For chapter 6, Whisper repeated phrases with its default settings. The final map uses `condition_on_previous_text=False`, with fresh clips at 52–68.7 and 77.5–106.5 s. Whisper matches 97.4% of the text words; currency figures and joined words account for most differences. The forced aligner timed all 577 text tokens without fallback.

Chapter 7 command. The title ends at about 5.54 s, music starts at about 6.4 s, and the first word starts at 16.68 s:

```
.venv/Scripts/python books/duke/fix_audio.py audio/duke/07-original-with-chime.mp3 audio/duke/07-the-dukes-son.webm --cut 5.75 16.64 --gap 0.8 --chime 530.15 531.95 --click 530.196 530.302 --declick 528.825 528.852 --declick 528.930 528.960
```

Two short mouse-click peaks occur before the chime, at 528.835 and 528.941 s. Both rise about 30 dB above nearby sound above 6 kHz. The short `--declick` windows remove these peaks without cutting speech.

For chapter 7, Whisper matches 99.0% of the text words. The forced aligner timed all 940 text tokens without fallback. A separate alignment of 21–26 s corrects the end of «minute» before a long pause: 25.28 s, not 27.17 s.

## Text

- The OCR text needed cleanup: OCR errors, picture captions, map labels and broken paragraphs. Compare each chapter with the page images.
- Dashes are the book's spaced en dash (–).
- Headings are title case, as in hp1: `# Chapter One: Sherlock Holmes Has a Visitor`.
- `book.json` has a Whisper prompt with the names of the people and places.

## Pictures

- `pictures/raw/NN-K.png` are 300 dpi crops of the book's pictures from `source/book.pdf`. `NN` is the chapter, `K` is the picture number in the chapter.
- In `text.md`, `![caption](NN-K)` puts a picture after the paragraph that it shows. Never put a picture before its paragraph, because it can tell the story before the text does.
- The captions are the book's captions. Where a caption ends in "…", the text completes it from the paragraph.
- 05-2, 05-3 and 05-4 are Holmes's drawings of the tracks on page 35. They have no caption.
- 03-2 (the map) has no caption in the book. Picture 07-1 has the caption «That evening James met Arthur in Ragged Shaw.»
- To replace a crop, put `pictures/NN-K.png` next to `raw/`: black ink on a transparent background, about 1000–1400 px wide. Only the alpha counts, so make grey shading partial alpha. The build uses it in place of the raw crop.
- `book.json` `pictureColumn` is the width of the book's text column in the raw crops, in px. The build uses it to show each picture at its size on the page.

## Narration against the text

Whisper agrees with 98–99% of the words. The rest are pronunciation only. Do not change the text for these:

- "Holdernesse" is said "Holderness".
- Whisper hears "Shaw" as "Shore".
- Whisper writes numbers as figures ("16").

Places where the narrator differs from the book. The text keeps the book's words:

- Ch4, 1:10: the narrator says "and once some cow tracks". The book has "and some cow tracks".
- Ch4, 3:30: the narrator says "Nope". The book has ‘No,’.

Whisper on short clips hears these two places the same way. A stumble near "So far, so good" (8:00 in the audio with the title music) is not there: the clip is clean.

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
- Ch7, quoted family speech: James addresses Arthur as *tú*. In the words James wants his father to say, the Duke addresses James as *tú*. The Duke and Holmes still use *usted*.

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
| the Priory School | el colegio Priory | Dr Huxtable's school, near Mackleton. *Priory* stays in English, as a name. |
| school (a boarding school) | colegio | The boys live there. |
| Lord Soames, Lord Lever | lord Soames, lord Lever | |
| Mr James Wilder | el señor James Wilder | |
| secretary | secretario | |
| Lord Saltire, young Arthur | lord Saltire, el joven Arthur | The Duke's son, ten years old. *Arthur* stays in English. |
| the Duchess | la duquesa | Lower case, as *duque*. |
| the south of France | el sur de Francia | |
| Heidegger | Heidegger | |
| the German teacher | el profesor de alemán | He teaches German: Holmes asks about "German lessons". |
| schoolroom | aula | |
| Holdernesse Hall | Holdernesse Hall | The Duke's house. A note can say that *Hall* is a big country house. |
| Liverpool | Liverpool | |
| office | despacho | Dr Huxtable's room at the school. |
| postbag | saca de correos | British; US *mailbag*. |
| policeman | policía | |
| the White Horse Inn | la posada White Horse | Inn names stay in English, as *Priory*. A note can give the meaning: «caballo blanco». |
| Ragged Shaw | Ragged Shaw | A small wood. *Shaw* is an old word for a small wood; *ragged* means «irregular, desigual». |
| moor | páramo | Open, high land with no trees, typical of the north of England. |
| the Lower Gill Moor | el páramo de Lower Gill | |
| the Green Man Inn | la posada Green Man | A note can give the meaning: «el hombre verde», an old figure of English folk stories, and a common inn name. |
| the Chesterfield road | la carretera de Chesterfield | Chesterfield is a real town in the north of England. |
| gardener | jardinero | |
| tyre | neumático, rueda | British; US *tire*. |
| Dunlop, Palmer | Dunlop, Palmer | Makes of bicycle tyre. *un neumático Dunlop*. |
| the English teacher | el profesor de inglés | A teacher at the school. |
| track | huella, rastro | The mark of a tyre or a foot in the mud. |
| workman | obrero, trabajador | |
| night-shirt | camisa de dormir | A long shirt for sleeping in. |
| coat | chaqueta | Heidegger's coat. Chapter 2 calls it «chaqueta». |
| my dear Watson | mi querido Watson | |
| Mr Reuben Hayes, Mr Hayes | el señor Reuben Hayes, el señor Hayes | The man at the door of the Green Man Inn. His name is on the door. |
| inn | posada | |
| the Hall | la mansión | Holdernesse Hall. |
| pound | libra | Money: Holmes offers *a pound*. |
| stables | las cuadras | Buildings for horses. |
| shoes (of a horse) | herraduras | English says *shoes* for a horse too. |
| nails | clavos | The nails of a horse's shoes. |
| foot (of a horse) | casco | The gloss stays «pie»; a note says that it is the «casco». The whole leg is *leg*, «pata». |
| the rider | el ciclista | Mr Wilder, on a bicycle. |
| kidnapping | secuestro | |
| cheque book | talonario de cheques | British; US *checkbook*. |
| cheque | cheque | British; US *check*. |
| kidnapper | secuestrador | |
| killing | muerte | The Duke avoids the stronger word *murder*. Do not imply that the death was accidental. |
| murder, murderer | asesinato, asesino | |
| Chesterfield station | la estación de Chesterfield | |
| Mrs Hayes | la señora Hayes | British *Mrs*; US *Mrs.*. |
| Australia | Australia | |
| love-child | hijo nacido fuera del matrimonio | The story uses a dated social term. Avoid «bastardo», which adds an insult. |
| horse-shoe | herradura | The book uses a hyphen; modern English usually writes *horseshoe*. |
| cloven cow’s foot | pezuña hendida de vaca | *Cloven* means split in two. The gloss of *foot* stays «pie», with a note about «pezuña». |
| notebook | libreta | Keep the established term. |

### Stress

The book prints some words in italics for stress. The text has no italics, so the reader cannot see it. Where the stress changes the meaning, a note can explain it.

- Ch3: "*I* put the letter into the postbag" (Mr Wilder, not the Duke, did it) and "the boy and the teacher did *not* go by road".
- Ch4: "not *the* bicycle" (not the one we look for), "Or perhaps *to* the school?", "He knows that he *needs* his bicycle", "it is *eight kilometres* before…", "there was *someone with the boy*", "It's *not* possible".
- Ch5: no words in italics.
- Ch6: Holmes stresses «*You*» when he names the kidnapper. The note can explain the emphasis without adding a motive.
- Ch7: no words in italics in the body text.

### Spoilers

This is a mystery. The reader must find things out at the same time as Holmes.

- Use only what the text has told up to the sentence you translate. Do not use what you know of later chapters, or of Conan Doyle's story *The Adventure of the Priory School*.
- Do not hint that a person, a place or a detail will be important.
- A note about a name explains only the language (a title, a spelling), never who the person is in the story.
- Ch4 and later: the cow tracks come back again and again. Treat them as any other words: no note may hint that they are important.
- Ch5: Holmes's three drawings of the tracks, "Old shoes, but new nails" and "it's a very strange cow": translate the words only. No note may explain what made the tracks or why the nails are new. Do not say who the man on the horse is, or who the other man is.
- Ch6: do not explain James Wilder's family relationship before the final sentence. Do not add motives or details from chapter 7. The cheque offer and the Duke's choice of *killing* need language help, not an explanation of the crime.
- Ch7: explain the shoe's shape only when the text reveals it. Keep Holmes's final joke, without calling him greedy or adding a moral judgment.

## Open questions

- (none)
