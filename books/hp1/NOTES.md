# Harry Potter and the Philosopher’s Stone

## Source and audio

- English text: `01/text.md`, imported from `source/book.pdf`.
- Narrator: Jim Dale. Keep the original MP3 at `audio/01-the-boy-who-lived.mp3` as the source.
- Site audio: mono Opus at 24 kbps in WebM. Encode directly from the source, without cuts or other processing.
- Conversion checks at the start, middle, and end found offsets of 0–1 ms. Keep the existing word timings.
- Chapter 1 has 4,675 tokens in 113 text blocks, plus one picture. The current sentence splitter gives 343 sentences.
- The former translation used 352 sentences. The new sentence boundaries keep a question or exclamation with its lower-case reporting clause.
- This change does not change the English tokens or their audio times. Do not run transcription or alignment without a separate reason.
- The text uses British spelling. Do not change it to match a spoken American form.

Chapter 1 conversion:

```
ffmpeg -hide_banner -nostdin -n -i audio/01-the-boy-who-lived.mp3 -map 0:a:0 -vn -ac 1 -ar 48000 -c:a libopus -b:a 24k audio/01-the-boy-who-lived.webm
```

The WebM is 6,350,102 bytes, compared with 30,606,497 bytes for the source MP3. Duration remains about 31 minutes 53 seconds.

### Chapter 2 preparation

- English text: `02/text.md`, from physical PDF pages 21–29. It matches the extracted page text, apart from whitespace and hyphenation.
- Original audio: `audio/stash/02-the-vanishing-glass.mp3`. Keep it unchanged.
- Site audio source: `audio/02-the-vanishing-glass.webm`, encoded directly as mono Opus at 24 kbps and 48 kHz, without cuts.
- Duration: 1334.099592 seconds in the source; 1334.095 seconds in WebM.
- Chapter 2 uses its own initial transcription and alignment. Do not retime chapter 1.
- Initial alignment covered all 3,469 tokens, with no fallback pieces. The rough transcript matched 98.2% of lexical source tokens.
- Removed one false trailing word from the rough transcript, over low-level background noise. This did not change any source alignment anchor.
- Conversion samples at 15, 667, and 1299 seconds have offsets of 0–1 ms and correlations above 0.987.
- Translation preparation: 231 entries and 3,469 tokens across three jobs. No chapter 2 picture is currently assigned.

## Pictures

Read [ILLUSTRATIONS.md](ILLUSTRATIONS.md) before preparing another picture. It contains the prompt, source record, processing commands, theme rules, and checks.

- `pictures/raw/01-1.png` is the original user-supplied generated illustration of Dumbledore beside the cat.
- `pictures/01-1.png` removes the magenta background, pink fringe, and detached bottom strip. It keeps grayscale detail and transparent brush edges.
- `pictureMode: "cutout"` clips the themed ink and paper to the drawing's alpha outline. Duke retains its existing rendering.
- The picture follows the paragraph where Dumbledore sits beside the cat. It has no caption or audio timing.

## Translation

Follow `guides/translation-es.md`. Use the current `line` and `words` format, not the former HP format.

### Reader and workflow

- English level: B1–B2. Use natural Spanish from Spain.
- Follow `guides/translation-workflow.md` for chapter ownership, job handoffs, and review stages. HP has no separate review policy.
- One translator reads the complete chapter and translates its jobs in order. Report each checked job immediately for review.
- Reviewers check content and relevant shared references. The orchestrator checks diffs, integrates changes, and handles assets and browser tests.
- Use the selected Spanish counterpart as starting wording for new translations and assigned adaptations. Follow the guide's English-based checks.
- Preserve the existing names and terms below. Propose changes before using them across the book.

### Spanish counterpart

The user supplied a Spanish EPUB for future drafting. The orchestrator provides its local path and chapter location with each assignment. Keep the file and extracts outside the repository.

- Title: *Harry Potter y la piedra filosofal*.
- Credited translator: Alicia Dellepiane Rawson.
- Internal publisher metadata: ePubLibre. Digital editor: Titivillus.
- Title-page revision: ePub r1.8, dated 15 December 2017. The OPF version field says 1.7.
- The supplied filename identifies Salamandra and 2014. The internal textual credits do not verify that exact printed edition.
- Chapter 1 location: `OEBPS/Text/cap001.xhtml`.
- Chapter 2 location: `OEBPS/Text/cap002.xhtml`, titled «El vidrio que se desvaneció». Its 115 extracted blocks include all chapter body text.

Chapter 1 was completed independently at `2305244`, before comparing it with this EPUB. That comparison made no changes to the chapter.

The user then authorized a special chapter-wide adaptation stage using this EPUB's wording as the baseline. It completed two consecutive fresh passes over all four answers at `a69c838`. The reading lines use suitable counterpart wording; the chunks and popup help remain English-based. The English source and audio timings stayed unchanged.

The counterpart supports most established names and forms of address, but it sometimes changes English details and sentence boundaries. Its chapter title uses «El niño que sobrevivió»; its closing toast uses «el niño que vivió». Keep our approved title below unless the user changes that choice.

### Voice

- The narrator gently mocks the Dursleys’ pride in being normal. Keep the irony quiet; do not explain the joke in the reading line.
- Strange events often pass through Vernon’s point of view. Keep his refusal to accept them.
- Preserve the comic details, unease, and warmer final scene. Do not make every sentence equally formal.
- Keep narrator asides conversational. Do not add explanations of the magic.
- Vernon speaks bluntly and thinks highly of himself. Petunia is sharp and disapproving.
- Dumbledore speaks calmly and politely, with gentle humour. McGonagall is precise, formal, and impatient when worried.
- Hagrid speaks informally, with a rural dialect. Suggest this through simple, spoken Spanish, not a Spanish regional accent or heavy phonetic spelling.
- Explain Hagrid’s nonstandard English in popups. Give the standard form and meaning without calling it careless or stupid.
- The old man is delighted and ceremonious. Dudley’s *Shan’t!* is an emphatic childish refusal.
- Ted and Jim use broadcast speech. Jim makes a playful weather joke.

### Forms of address

- Preserve the former glossary’s choices: Dumbledore and McGonagall use *usted* with each other.
- Hagrid uses *usted* with both. They use *tú* with Hagrid.
- Vernon and Petunia use *tú* with each other and with Dudley.
- The old man and Vernon use *usted* with each other.
- Ted and Jim use *tú* with each other. Use plural *vosotros* when a broadcast addresses its viewers directly.
- Adults address Harry as *tú*.
- The fixed name «Quien-usted-sabe» does not change with the speaker’s form of address.

### Names and terms

These choices come from the former glossary. Names can appear here before the story reveals them; notes must not reveal them early.

| English | Spanish | Use |
|---|---|---|
| Harry Potter and the Philosopher’s Stone | Harry Potter y la piedra filosofal | Book title. |
| The Boy Who Lived | El niño que vivió | Chapter title. |
| Mr, Mrs | señor, señora | Use an article in narration: «el señor Dursley». Omit it in direct address. |
| Professor | profesor, profesora | Match the person’s gender. |
| sir | señor | Respectful direct address. |
| the Dursleys | los Dursley | Keep family surnames unchanged in the plural. |
| the Potters | los Potter | |
| Vernon, Petunia, Dudley, Harry, Lily, James | unchanged | |
| Albus Dumbledore | Albus Dumbledore | |
| Professor McGonagall | profesora McGonagall | |
| Hagrid, Sirius Black, Dedalus Diggle | unchanged | |
| Madam Pomfrey | señora Pomfrey | |
| Jim McGuffin, Ted | unchanged | Ted is the newsreader. |
| Privet Drive | Privet Drive | «El número cuatro de Privet Drive». *Privet* means «aligustre», a common hedge plant. |
| Grunnings | Grunnings | Company name. |
| Godric’s Hollow | Valle de Godric | |
| Britain | Gran Bretaña | |
| Kent, Yorkshire, Dundee, Bristol | unchanged | |
| the London Underground | el metro de Londres | |
| owl | lechuza | Preserve the established book term. Do not replace it with «búho». |
| Muggle | muggle | Lower case in Spanish. Explain only what the text has revealed at that point. |
| You-Know-Who | Quien-usted-sabe | Keep the established spelling. |
| Voldemort | Voldemort | |
| the Put-Outer | el Apagador | Do not use a later book’s name for this device. |
| sherbet lemon | caramelo de limón | A British sweet with a fizzy powder centre; not a lemon sorbet. |
| high chair | trona | |
| bundle of blankets | bulto de mantas | Use «bulto» for the repeated image. |
| Bonfire Night | Noche de las Hogueras | British celebration on 5 November. Explain the reference without adding story events. |
| unDursleyish | nada propio de los Dursley | Invented adjective. Adapt the reading line naturally; explain *un-* + surname + *-ish* in the popup. |

### Language help

- Explain idioms, phrasal verbs, false friends, and useful patterns. Link the relevant dictionary sense and grammar concept.
- Keep the gloss faithful to English person, tense, number, and possessives. The reading line can use natural Spanish constructions.
- Watch *firm*, *large*, *sensible*, *pretend*, and words with ordinary meanings that do not fit this sentence.
- Explain British spellings and vocabulary with their US equivalents when they differ. Do not invent differences.
- Explain coined compounds and dialect forms where the learner needs help. Do not add made-up words to the general dictionary without a reusable meaning.
- Preserve uncertain guesses, hypothetical events, and unfinished speech. Do not turn them into facts.
- Use « » for outer speech and “ ” for speech inside speech. Follow Spanish punctuation, including «¿…?». before a new sentence.
- The English has a stray closing quotation mark before *I have never seen any reason…* in Dumbledore’s speech. Keep that sentence within his speech in Spanish. Do not change the timed English during translation.

### Spoilers

- Do not identify the cat before the transformation and naming in the text.
- Do not explain the Potters’ secret, the celebrations, or *Muggle* using facts that appear later.
- Do not explain why Harry survived, the scar’s later role, or later uses of the Apagador.
- Do not add later information about Sirius Black, Hagrid, or the other characters.
- Explain language and tone, not hidden plot details.
