# Guide: entries of the English dictionary

`guides/dictionary-en.json` is a small English–Spanish dictionary for all books. The popup uses it: a unit links to an entry and to one of its senses (`"base": "ticket", "sense": "travel"`). The popup then shows the irregular forms of the word, and its other senses under "En otros contextos".

The reader is a Spanish speaker from Spain who learns English (A2 to B2). An entry must help them in a few seconds: the common senses, in plain Spanish, with a short example.

## An entry

```json
"ticket": {
  "senses": [
    { "id": "travel", "es": "billete", "ex": ["a train ticket", "un billete de tren"] },
    { "id": "show", "es": "entrada", "ex": ["two tickets for the concert", "dos entradas para el concierto"] },
    { "id": "fine", "es": "multa", "ex": ["a parking ticket", "una multa de aparcamiento"] }
  ]
},
"come": {
  "forms": { "past": "came", "participle": "come" },
  "senses": [
    { "id": "move", "es": "venir", "ex": ["Come here!", "¡Ven aquí!"] },
    { "id": "arrive", "es": "llegar", "ex": ["The day came at last.", "Por fin llegó el día."] },
    { "id": "from", "es": "ser de", "ex": ["I come from Spain.", "Soy de España."] }
  ]
}
```

- **Key:** the word as a dictionary gives it: the infinitive without "to", the singular, the plain adjective. Lower case, except names. A phrasal verb or an idiom is its own entry: `"look at"`, `"find out"`, `"get to one's feet"`, `"all right"`.
- **`forms`** (optional): only irregular forms. Keys: `past` and `participle` (verbs), `plural` (nouns), `comparative` and `superlative` (adjectives). **Copy them from the raw data.** Do not write them from memory. The raw data also has archaic and dialect forms (*gat*, *getten*): take the standard British form, and add the US form in brackets when it is different: `"participle": "got (US gotten)"`. A phrasal verb has the forms of its verb: `"find out": {"forms": {"past": "found out", "participle": "found out"}}`.
- **`senses`:** the common senses, the most common first.
  - `id`: a short English word for the sense, lower case, with - between words: `travel`, `show`, `fine`, `from`. Units link to it, so **never change or remove an id that a unit links to** (search `books/*/*/es/*.json` for `"base": "WORD"`). You can add senses and change their order.
  - `es`: the Spanish meaning, 1 to 3 words, Spain's Spanish (*billete*, not *boleto*; *coger*, *móvil*, *ordenador*). Two meanings with a comma only if they are really one sense: *mirar, ver*.
  - `ex`: a pair: a short, natural English example of this sense (2 to 7 words), and its Spanish translation. Write your own; do not copy a sentence from a book. Use common words. The Spanish is natural Spanish from Spain, and it uses the sense's `es` where it fits.

## Which senses

The raw data (Wiktionary) has many senses. Keep few:

- **1 to 4 senses** for most words. Up to 6 for very common words with many uses: *get, take, make, go, put, run, set, have*.
- **Keep** a sense if a learner at A2–B2 will meet it in books, films or daily life.
- **Drop** senses that are rare, dated, archaic, obsolete, dialect, technical, or vulgar. Drop slang unless it is very common.
- **Merge** senses that are the same in Spanish: Wiktionary has separate senses for a ticket to a show and to a game; both are *entrada*.
- A word that is also another part of speech can have senses of both, when both are common: *firm* → *empresa* (`company`) and *firme* (`solid`).
- A sense that only exists in a phrase belongs to the phrase's entry, not to the word: "look at" is an entry; *look* does not get a sense *mirar a* for it.

## How to make entries for a job

1. Run `python tools/dictionary.py words books/<id> <n> <job>`. It lists the base words and the phrases of the job that have no entry yet. A form can belong to more than one word ("came" is *come*; "found" is *find* and *found*): it shows them with " / ". Make the entry for the right one, from the sentence.
2. For each word or phrase that needs one, run `python tools/dictionary.py raw WORD`, and write the entry from it.
   - Skip names, numbers, and small words that need no entry: articles, pronouns, simple prepositions and conjunctions (*the, he, of, and*).
   - Phrases: only phrasal verbs and idioms whose meaning does not come from their words ("look at", "all right", "put up with"). Not free groups like "train ticket".
3. Run `python tools/dictionary.py check` until it prints `OK`.

Change only `guides/dictionary-en.json`, and only by adding entries and senses.

When you finish, reply with the list of entries you added, and anything you were not sure about.
