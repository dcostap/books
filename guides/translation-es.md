# Guide: Spanish help for English books

This guide applies to every book and every chapter. Each book has its own notes in `books/<id>/NOTES.md`, section "Translation": the reader's level, names and terms, *tú* or *usted*, and what is special to that book. If the two disagree, the book notes win for that book.

Read `guides/translation-workflow.md` for roles, file ownership, handoffs, commits, and review stages. This guide defines the language checks within that workflow.

## The reader

- A Spanish speaker from Spain. Their English level is in the book notes (for example A2 or B2).
- They read the original English book **to learn English** first, and for pleasure second. They listen to the narration at the same time.
- The Spanish line under the English is on by default. They read it when the English is hard, and to check what they understood.
- They tap a word when they want to know exactly what it means, or when they are curious. They read the popup in a few seconds, and then they go back to the story.

## Two kinds of help

Each sentence gets two things. They have different jobs, so they follow different rules.

1. **The reading line** (`line`): a natural Spanish translation of the sentence, shown under the English in pieces. Its job is to give the meaning, in good Spanish.
2. **The popup** (`words`): help for each word that the reader taps. Its job is to teach the English word: what it means here, its dictionary form, its other common meanings, and anything interesting to know.

"Ver la frase entera" in the popup shows the reading line as one sentence.

## Spanish

Spain's Spanish (*vosotros*, *coche*, *ordenador*, *gafas*), plain but not simplified. Use the word a good modern Spanish translator of a young-adult novel would use.

- If a word sounds like an essay, a legal text or a dictionary, choose a more common word.
- If a word sounds like a children's book or like slang, choose a richer word. Slang only when a character speaks that way.

| Too formal or bookish | Better | Too plain or childish | Better |
|---|---|---|---|
| un martes anodino | un martes gris | muy, muy cansado | agotado |
| fornido | grandote, corpulento | hizo un ruido | gritó, chilló (what it was) |
| se dirigió a la puerta | fue a la puerta | una cosa de metal | una pieza de metal |
| aguardar | esperar | se puso muy contento | se alegró muchísimo |
| hallarse | estar | era malo | era cruel (if that is the meaning) |
| proferir | decir, soltar | dijo otra vez | repitió |

## The reading line

### First translate, then cut

1. Translate the sentence as a good translator would: natural Spanish, the same meaning and tone. **Do not look at the layout while you do this.** Do not follow the English word order when Spanish says it differently.
2. Then cut your sentence into chunks. Put each chunk under the English words that it translates.
3. Where the two languages do not break at the same place, make the chunk bigger. A chunk can be a whole clause, or the whole sentence.

**Never change the Spanish to make it fit.** A wide column or an uneven layout is fine. Spanish that sounds translated is not.

**The test:** read your chunks from left to right. If they do not give the sentence that you wrote in step 1, merge chunks until they do.

### Examples

"The Dursleys knew that the Potters had a small son, too, but they had never even seen him."

| Good | Bad |
|---|---|
| The Dursleys knew = Los Dursley sabían · that the Potters had a small son, too, = que los Potter también tenían un hijo pequeño, · but they had never even seen him. = pero ni siquiera lo habían visto nunca. | too, = también · but they = pero ellos · had never even seen = nunca habían siquiera visto · him. = lo |

The bad line reads "también pero ellos nunca habían siquiera visto lo". That is not Spanish.

"There was a tabby cat standing on the corner." → *There was* = *Había* · *a tabby cat* = *un gato atigrado* · *standing* = *de pie* · *on the corner.* = *en la esquina.* Not *a* = *un* · *tabby* = *atigrado* · *cat* = *gato*: in Spanish, the adjective comes after the noun.

"What could he have been thinking of?" → one chunk: *¿En qué estaría pensando?*

### Chunk rules

- A chunk covers English tokens that are next to each other. The chunks follow the English order. Every word token is in exactly one chunk. Tokens without letters or digits ("–", "…") can stay out.
- Make each chunk as small as the Spanish order allows: usually a phrase of 2 to 6 English words. Do not cut single words just to make small chunks.
- Each chunk has its Spanish exactly as it is in your sentence: with its capital letter, its punctuation, « » and ¿ ¡. The app joins the chunks with spaces.
- A word that Spanish leaves out (a subject pronoun, "do" in a question) goes in the chunk of its neighbour: "he said" = *dijo*.

### Sentence style

- Keep the meaning and the tone. A joke stays a joke. Irony stays irony.
- Write your own translation. Do not copy a published Spanish edition. Use its names and terms (see the book notes).
- Show quoted speech with « », and use the Spanish rules for punctuation. Put « where the English sentence opens a quote (‘), and » where it closes one (’). A quote can go over several sentences: then the first sentence has only «, and the last has only ». Example: "‘We have much to be thankful for." → *«Tenemos mucho que agradecer.*
- Keep the same *tú* or *usted* between two characters in all the book. The book notes say which one.

## The popup

### Units

The reader taps a word, and the popup shows the unit of that word.

1. **A unit is one main word, with its small words.** Each noun, verb, adjective, adverb and pronoun is its own unit. The small words that only go with it join it, so the reader does not have to tap tiny words:
   - articles and possessives: "the garden" → *el jardín*, "her coat" → *su abrigo*. They join their noun also across an adjective: in "a large man", the units are "a … man" (*un hombre*) and "large" (*corpulento*). Not "a large" = *un corpulento*.
   - a simple preposition before its noun: "of a firm" → *de una empresa*, "in London" → *en Londres*
   - but a preposition that the verb needs joins the verb, not the noun: *look at*, *listen to*, *wait for*, *think of*. "looked at him" is "looked at" (*miró*) · "him" (*lo, a él*). A learner must learn *look at* as one thing.
   - auxiliaries and "not" next to their verb: "was tired" → *estaba cansado*, "didn't say" → *no dijo*, "had seen" → *había visto*
   - the "to" of an infinitive: "to ask" → *preguntar*
2. **Other words stay apart.** Do not put two main words in one unit: "a tall, thin boy" is "a … boy" · "tall" · "thin", so the reader learns which word means *flaco*.
3. **A group of main words only when they have one meaning together:** an idiom, a phrasal verb, a fixed expression, or a name of more than one word.
   - "put up with" → *aguantar*
   - "out of the blue" → *de repente, sin avisar*
   - "got to his feet" → *se levantó*
   - "Baker Street" → *Baker Street*
   - a short fixed phrase of spoken English, when its words do not give its meaning: "What is it?" → *¿qué pasa?*, "Here you are" → *aquí tienes*, "Come in" → *pase, adelante*
   - A unit can have gaps: in "she looked the word up", the unit is "looked … up" (tokens 1 and 4). "the word" is another unit.
4. Every word token is in exactly one unit.

### Gloss

The gloss (`es`) is the meaning **at this place in the story**. It is not a dictionary entry.

- Give one meaning, or two or three if they help, the best first, with commas: "noticed" → *se fijó en, vio*. Every meaning must fit this place. "dull" for a day → *gris, triste*, not *aburrido, sin punta, torpe*.
- Use the form that fits the sentence: "staring" → *mirando fijamente*, not *mirar fijamente*.
- **The gloss is the meaning of the English word, not a free word from your line.** Your line can say it more freely, and that is good Spanish. But a learner takes the gloss as what the word means. In "they put their heads in their hands", the line says *hundían la cabeza entre las manos*. The gloss of "put" is *ponían*, not *hundían*: else the learner thinks that *put* means *hundir*. When your line uses a freer word, say it in a note: *Aquí, «hundían» suena más natural en español.*
- **The same for the form of the word:** the gloss keeps the English number, possessive, person and tense. "their heads" → *sus cabezas*, not *la cabeza*, even if the line says *hundían la cabeza*. If the two languages say it differently, a note can explain the English side: *En inglés, las partes del cuerpo llevan posesivo: *their heads*, *his eyes* ([[body-possessive]]).* Do not explain the Spanish: the reader knows it.
- The gloss translates all the words of the unit: "of a firm" → *de una empresa*. A pronoun gets its meaning here: "him" → *lo, a él*. If a word has nothing to say in Spanish, write what it does, in brackets: "it" in "it was raining" → *(no se traduce)*.
- Lower case, except names. Short: 1 to 5 words, usually.
- For a name, the gloss is the name as the book notes give it. Usually it does not change.

### Dictionary link

`guides/dictionary-en.json` is an English–Spanish dictionary for all books. A unit links to an entry with `base` (the word of the entry) and `sense` (the id of one of its senses). The app then shows the base form, the irregular forms, and the other senses under "En otros contextos". Do not write forms or other meanings in the unit: the dictionary has them.

- Link every unit whose main word has an entry: "came" → `"base": "come", "sense": "move"`. Names, numbers and small words (articles, pronouns, simple prepositions) have no entry.
- A unit with an article, a possessive or a preposition links its main word: "a … ticket" → `ticket`, "into the room" → `room`. A phrasal verb or an idiom links the phrase: "looked at" → `look at`.
- Choose the sense that fits this place. The gloss fits the line (*venían*); the sense gives the general meaning (*venir*).
- No link for a phrase that is not a dictionary entry: "What is it".
- **A missing word or sense:** link it anyway, with a new `base`, or a new `sense` id (lower case, in English, words joined with -). The check lists them. Include each proposal in the job handoff: the word, sense ID, Spanish meaning, example pair, and affected sentences. Do not edit `guides/dictionary-en.json`. The orchestrator integrates accepted proposals or assigns a link correction. Reviewers check the relevant shared entries in every pass.

### Notes

A note tells the reader something that the gloss cannot. It is the friendly part of the app: like a friend who knows English well and sits next to the reader. Most units have no note. A good note is a small pleasure to read.

The dictionary and concept links do not replace notes. The dictionary gives the other meanings, and a link explains a general idea. A note tells what is special at this place: a pattern that Spanish does not have (*would* for a habit), a verb with its preposition (*look at*), a British word (*ill*, US *sick*).

Write a note when a reader at this level would probably miss or misread something, or when there is something nice to learn:

- **Idioms and phrasal verbs** whose meaning does not come from their words.
- **False friends,** basic words too: "large" (not «largo»), "sensible", "actually", "embarrassed".
- **British life and culture:** food, school, money, manners, places.
- **Wordplay, invented words, names with a meaning, and words with an interesting origin.**
- **Register:** very informal, old-fashioned, rude, or children's words.
- **Grammar that changes the meaning:** emphatic "did", "hardly any", "would" for a habit.
- **Irony and tone,** when the reader could take the words at face value.
- **British and American English:** every British spelling or word that is different in the US, with the US form. "colour" (US *color*), "grey" (US *gray*), "flat" (US *apartment*). Look for them in every sentence: they are easy to miss. Write one only if you are sure of it.
- **Useful patterns** that a learner can use again: "proud to say" (*proud to* + infinitive).
- **Words that are easy to confuse:** a Spanish word that looks the same, or an English word that looks or sounds the same. "firm" → *Ojo: no es «firma» (eso es *signature*).*
- **Spoken English:** question tags, short answers, *'d* as *would* or *had*, dropped words, dialect.
- **At A1–A2, also basic things that confuse beginners:** contractions ("couldn't" = *could not*), the *'s* of possession, "some" and "any", word order in questions, a noun used as an adjective ("a train ticket" = *un billete de tren*: the last noun is the thing). Explain one point at a time.

Do not write a note when:

- The reader knows the word at this level, or the gloss says everything. A false friend is an exception: it always gets a note.
- The word looks like a Spanish word and means the same: "director", "mysterious".
- Spanish says it the same way: "talked and talked" = *hablaban y hablaban*. The reader understands it without help.
- The note only explains the Spanish, not the English.

Content and style:

- Explain the language, not the plot.
- **Each note stands alone.** The reader taps words in any order, and may never see the other notes. Never refer to another note: no «como antes», «como con *their heads*», «ver arriba». The same idea gets a note again wherever the reader needs it.
- **No spoilers.** Never tell the reader anything that the story has not told them yet: names, identities, future events, who did what. In a mystery, also do not hint that a person or a detail is important.
- One or two ideas in each note, the most useful first. Then add why, if it helps: the literal meaning, the origin, how it sounds to a British reader.
- Do not repeat the base form or the gloss.
- Spanish from Spain. Speak to the reader as *tú*. Friendly and light. A little wit is welcome, but never at the cost of clarity. Never talk down to the reader.
- 1 or 2 short sentences, at most about 200 characters. At A1–A2, use easy Spanish and keep it short.
- **Every English word inside Spanish text goes in asterisks:** *scrawny*, *look at*, *-ed*. This is for notes, and concept names and texts. The app shows these words in italics, with a colour, so the reader sees at once which words are English. Put Spanish words in « ». Plain text only: no emojis, no lists.
- Name the grammar: when a note explains an idea of grammar, say it in plain words, and then link the idea (see "Concept links").

| Unit | Base | Gloss | Note |
|---|---|---|---|
| scrawny | | escuálido, flacucho | Despectivo: delgado y con poca fuerza. Más feo que *thin*. |
| put up with | | aguantar, soportar | Aguantar algo molesto sin quejarse. |
| a fortnight | | quince días | Muy británico: dos semanas. Viene de *fourteen nights*. |
| did warn | warn | sí que avisé | El *did* enfático insiste: «¡pero si te avisé!». |
| eventually | | al final | Falso amigo: no es «eventualmente», sino «al final, con el tiempo». |
| of a firm | | de una empresa | Ojo: no es «firma» (eso es *signature*). Como adjetivo, *firm* es «firme». |
| couldn't | | no podían | Es *could not*. En inglés hablado y en los libros, casi siempre se junta así. |
| the colour | | el color | Ortografía británica; en EE. UU., *color*. |

| some water | | un poco de agua | Con algo que no se cuenta ([[uncountable]]), como *water*, *some* indica una cantidad sin precisar. |

Bad notes:

- *«Garden» significa «jardín».* This repeats the gloss.
- *Este es un ejemplo de lenguaje figurado que el autor emplea para caracterizar al personaje.* This is a lesson, and it is long and vague.
- *Este personaje volverá a aparecer más adelante.* This tells the plot.
- «Con algo que no se cuenta, some indica una cantidad.» "Algo que no se cuenta" is vague alone: link the idea, so the reader can learn it.

### Concept links

`guides/concepts-es.json` explains ideas of English grammar for all books: uncountable nouns, contractions, phrasal verbs and more. Each entry has a short explanation and examples. A note links to an entry with its id in double square brackets: `[[uncountable]]`. The app shows the entry's name in the note (*sustantivos incontables*), and the full entry as a footnote under the note.

- Read the file before you start. Link the entry in each note that uses its idea.
- The usual form: explain in plain words, then the link in brackets. "Con algo que no se cuenta ([[uncountable]]), …" shows *Con algo que no se cuenta (sustantivos incontables¹), …*.
- The note must make sense without its link: the app removes a link to an entry that does not exist.
- **A new idea:** if no entry fits, and the idea will help readers again in other places, link it with a new id (lower case, words joined with -, in English: `[[present-perfect]]`). Include each proposal in the job handoff, with its name, explanation, examples, and affected sentences. Do not edit `guides/concepts-es.json`. The orchestrator integrates accepted proposals or assigns a link correction. Reviewers check the explanation and its use in every relevant pass.

## Answer format

The answer to a job is one UTF-8 JSON file, with the name that the job file gives (for example `books/duke/01/es/01.json`):

```json
{
  "sentences": [
    {
      "id": 5,
      "line": [
        { "t": [0, 1, 2], "es": "Cuando venían visitas" },
        { "t": [3, 4, 5, 6, 7, 8, 9], "es": "a ver a Sherlock Holmes en Baker Street," }
      ],
      "words": [
        { "t": [0], "es": "cuando" },
        { "t": [1], "es": "visitas, visitantes", "base": "visitor", "sense": "guest" },
        { "t": [2], "es": "venían", "base": "come", "sense": "move" },
        { "t": [3, 4], "es": "a ver", "base": "see", "sense": "visit" },
        { "t": [5, 6], "es": "Sherlock Holmes" },
        { "t": [7, 8, 9], "es": "en Baker Street", "base": "street", "sense": "road", "note": "La calle de Londres donde vive Holmes, en el número 221B." }
      ]
    }
  ]
}
```

- `id`: the sentence number from the job file (`s5` → `5`). Give every sentence of the job, in order.
- The example is the start of "When visitors came to see Sherlock Holmes in Baker Street, they often did surprising things." A real answer covers every token.
- `line`: the chunks of the reading line, in order. `t` has the token numbers of the chunk.
- `words`: the popup units. `t` has the token numbers of the unit, in ascending order. `base`, `sense` and `note` are optional: leave the key out if the unit does not need it. `sense` needs `base`.
- The token numbers are in the job file: each token has its number in [brackets].

## Translator: how to do a job

1. Read this guide, the workflow, the book notes, and the full chapter for context. One translator owns the chapter's translation and completes its jobs in order. Read the current `books/<id>/<nn>/es/jobs/NN.md` before writing its answer. Edit only the files currently assigned to you.
2. For each sentence: first write the reading line (translate, then cut). Then write the popup units. Each gloss gives the meaning of the English word at this place. Where your line says it more freely, add a note (see "Gloss").
3. Run the check command from the job file, for example `python tools/translation.py check books/duke 1 1`. Fix every error, and run it again until it prints `OK`.
4. Run `python tools/translation.py show books/duke 1 1` and read your work as a reader would. Check:
   - Read only the Spanish of each line. Is it natural Spanish from Spain, plain but not poor? Would you change a word if you wrote it for a book?
   - Read each line chunk by chunk, from left to right. Is it exactly your sentence?
   - Does every gloss fit this place? Are all the meanings you give correct here?
   - Is every gloss the meaning of the English word, and not a free word from your line? Tap test: would a learner who reads only the gloss learn a wrong meaning of the word?
   - Does every unit whose word has a dictionary entry link it, with the sense that fits this place?
   - Is every British spelling or word noted?
   - Does each note help a reader at this level? Is it friendly and short? Is something missing that the reader would trip on?
   - Does each note about grammar link its idea?
   - No spoilers? *Tú* and *usted* as the book notes say?
5. If you changed something, run the check again until it prints `OK`.

Change only your current answer file. Propose shared changes instead of editing shared files.

After each job passes its checks and self-review, immediately report it as ready for review. Do not wait for the chapter to finish. Include:

- the `OK` line from the check
- the names or terms that are not in the book notes, and the Spanish form you chose for each
- the new concept ids that you linked, each with a Spanish name and one line about it
- the new dictionary words and senses that you linked, each with its sense id, Spanish meaning and English example
- anything you were not sure about, in a few short lines
- any error that you think is in the English text (a typo or a missing word). Do not change the text.

Stop editing that job after handoff. Continue with the next assigned job while its reviewer works. Report later consistency concerns rather than changing handed-over files. The orchestrator controls ownership and commits the baseline before reviewer edits.

## Reviewer

A reviewer gets the guides, book notes, committed baseline, previous findings, exact scope, and editable paths. Review the assigned content, not only earlier diffs. Check every point of step 4 for every sentence in scope.

Fix clear errors directly in owned answer files. Do not edit shared files, English source, or another agent's files. Propose shared corrections with affected sentence IDs and reasons. Raise uncertain interpretations or lasting book choices for the orchestrator. Do not rewrite acceptable Spanish merely to suit a preference.

Each job has at least two consecutive passes by separate fresh reviewers. The complete chapter then has its own stage with at least two passes. Additional user-approved stages follow the same rule. See `guides/translation-workflow.md` for handoffs, diff checks, and when a stage is complete.

Look for what is missing, not only for what is wrong: a correct gloss can hide a missing note. For every English word, ask: would a reader at this level trip here without a note?

Check the shared references used in your scope, including their forms, other displayed senses, examples, and grammar explanations. Flag existing errors as well as errors in new proposals. Do not reread unrelated dictionary entries.

Within the assigned stage, also check consistency across the relevant jobs or chapters:

- The same expression has the same gloss and dictionary link, unless the meaning changes.
- Glosses that copy a free word from the line instead of the meaning of the English word.
- Units whose word has a dictionary entry but no link, or a link to the wrong sense.
- Names and terms follow the book notes.
- Notes about the same idea of grammar link the same concept.

Run the check for each edited job until it prints `OK`. Report missing dictionary or concept links even if structural validation passes. Identify the scope you actually read; do not claim coverage from truncated output.

Report the baseline, changed files, substantive corrections, shared proposals checked, validation results, and unresolved issues. Release file ownership to the orchestrator, who checks the diff and commits accepted corrections. Suggest guide or book-note changes for recurring problems; do not apply them yourself.
