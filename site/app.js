import { updateInstallButton } from "./pwa.js";

const STORE_KEY = "audiobook:v1";
const RATES = [0.5, 0.6, 0.75, 0.9, 1, 1.1, 1.25, 1.5, 1.75, 2];
const SIZES = [0.8, 0.9, 1, 1.1, 1.2, 1.35, 1.5, 1.7, 1.9];
const FONTS = { serif: "Clásica", sans: "Moderna" };
// The colours of each theme are in style.css. "auto" follows the system: paper or night.
const THEMES = { auto: "Auto", paper: "Papel", sepia: "Sepia", white: "Blanco", night: "Noche", slate: "Pizarra", black: "Negro" };
const DEFAULTS = { rate: 1, size: 1, font: "serif", theme: "auto", gloss: true };
const PREROLL = 0.05; // seconds: start a little before a word when jumping to it
const LEAD = 2; // "Escuchar desde aquí" starts this many words before the tapped unit

const ICONS = {
  back: "M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z",
  play: "M8 5v14l11-7z",
  pause: "M6 5h4v14H6zm8 0h4v14h-4z",
  more: "M7.41 8.59 12 13.17l4.59-4.58L18 10l-6 6-6-6z",
  save: "M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2zm0 15-5-2.18L7 18V5h10v13z",
  saved: "M17 3H7c-1.1 0-2 .9-2 2v16l7-3 7 3V5c0-1.1-.9-2-2-2z",
  close: "M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z",
  lesson: "M21.42 10.92a1 1 0 0 0-.02-1.84l-8.57-3.9a2 2 0 0 0-1.66 0l-8.57 3.9a1 1 0 0 0 0 1.83l8.57 3.9a2 2 0 0 0 1.66 0zM22 10v6M6 12.5V16a6 3 0 0 0 12 0v-3.5",
};
const LINE_ICONS = new Set(["lesson"]); // drawn with a line, not filled
const icon = (name) =>
  `<svg${LINE_ICONS.has(name) ? ' class="line"' : ""} viewBox="0 0 24 24" aria-hidden="true"><path d="${ICONS[name]}"/></svg>`;
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);

// Where a phrase is in a text, as whole words, ignoring case and spacing: [[index, length]...], overlaps included.
function find(text, phrase) {
  const pattern = phrase.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\s+/gu, "\\s+");
  const wordEnd = /[\p{L}\p{M}\p{N}_'’\-]$/u;
  const wordStart = /^[\p{L}\p{M}\p{N}_'’\-]/u;
  return [...text.matchAll(new RegExp(`(?=(${pattern}))`, "giu"))]
    .filter((m) => !wordEnd.test(text.slice(0, m.index)) && !wordStart.test(text.slice(m.index + m[1].length)))
    .map((m) => [m.index, m[1].length]);
}

const marked = (text, [index, length]) =>
  `${esc(text.slice(0, index))}<mark>${esc(text.slice(index, index + length))}</mark>${esc(text.slice(index + length))}`;

// The sentence translation, with the Spanish of the tapped unit marked. A match that is not the only one is not
// reliable: do not guess. With a reading line: mark the gloss (or one of its meanings) in the chunks that hold the
// unit's tokens; else mark those chunks. Without a reading line (hp1 chapter 1): mark the gloss in the sentence.
function translationHTML(entry, unit) {
  if (!entry.line) {
    const matches = unit?.es.trim() ? find(entry.es, unit.es) : [];
    return matches.length === 1 ? marked(entry.es, matches[0]) : esc(entry.es);
  }
  const ours = (c) => unit?.t.some((k) => c.t.includes(k));
  for (const meaning of (unit?.es ?? "").split(",").filter((m) => m.trim() && !m.trim().startsWith("("))) {
    const matches = entry.line.flatMap((c, n) => (ours(c) ? find(c.es, meaning).map((at) => [n, at]) : []));
    if (matches.length === 1) {
      const [[n, at]] = matches;
      return entry.line.map((c, j) => (j === n ? marked(c.es, at) : esc(c.es))).join(" ");
    }
  }
  return entry.line.map((c) => (ours(c) ? `<mark>${esc(c.es)}</mark>` : esc(c.es))).join(" ");
}

// Text with English in *asterisks*: the English in italics
const rich = (text) => esc(text).replace(/\*(.+?)\*/g, "<i lang=\"en\">$1</i>");
const capital = (text) => text.replace(/\p{L}/u, (x) => x.toUpperCase());

// Two sentences with the words that differ marked: "I need an information." / "I need some information." marks
// "an" in the first with the tag del and "some" in the second with the tag ins. Words match without case and punctuation.
function wordDiff(a, b, del, ins) {
  const x = a.split(" "), y = b.split(" "), key = (w) => w.toLowerCase().replace(/’/g, "'").replace(/[^\p{L}\p{N}']/gu, "");
  const lcs = x.map(() => Array(y.length + 1).fill(0)).concat([Array(y.length + 1).fill(0)]);
  for (let i = x.length - 1; i >= 0; i--)
    for (let j = y.length - 1; j >= 0; j--)
      lcs[i][j] = key(x[i]) === key(y[j]) ? lcs[i + 1][j + 1] + 1 : Math.max(lcs[i + 1][j], lcs[i][j + 1]);
  const keepX = new Set(), keepY = new Set();
  for (let i = 0, j = 0; i < x.length && j < y.length;) {
    if (key(x[i]) === key(y[j])) { keepX.add(i++); keepY.add(j++); }
    else if (lcs[i + 1][j] >= lcs[i][j + 1]) i++;
    else j++;
  }
  // Neighbouring marked words share one mark, so a struck-through phrase has one line.
  const mark = (words, keep, tag) => words.map((w, i) => keep.has(i) ? esc(w)
    : `${keep.has(i - 1) || i === 0 ? `<${tag}>` : ""}${esc(w)}${keep.has(i + 1) || i === words.length - 1 ? `</${tag}>` : ""}`)
    .join(" ");
  return [mark(x, keepX, del), mark(y, keepY, ins)];
}

// A concept's explanation, examples and typical mistakes
const conceptHTML = (c) => `<p>${rich(c.text)}</p>
  <ul>${c.examples.map(([en, es]) => `<li><i lang="en">${esc(en)}</i> <span>${esc(es)}</span></li>`).join("")}</ul>
  ${c.wrong ? `<ul class="wrong" lang="en">${c.wrong.map(([bad, good]) => {
    const [badHTML, goodHTML] = wordDiff(bad, good, "s", "b");
    return `<li><span class="bad">${badHTML}</span> <span class="to">→</span> <i class="good">${goodHTML}</i></li>`;
  }).join("")}</ul>` : ""}`;

// The base form with its irregular forms, each after a small label: "forma base put · pasado put · participio put".
const FORMS = { past: "pasado", participle: "participio", plural: "plural", comparative: "comparativo", superlative: "superlativo" };
const baseHTML = (base, forms = {}) => [["forma base", base], ...Object.entries(forms).map(([k, v]) => [FORMS[k] ?? k, v])]
  .map(([label, form]) => `<span class="form"><span>${label}</span> <b lang="en">${esc(form)}</b></span>`).join(" ");

const clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));

const minutes = (seconds) => `${Math.max(1, Math.round(seconds / 60))} min`;

// Storage: { books: { [id]: { chapter, chapters: { [n]: { time, done } } } }, settings: { rate, size, font, theme }, words: [...] }
// A saved word is one unit at one place: { book, chapter, at: [word indexes in the chapter], k: [token numbers in
// its sentence], sentence (the English sentence), en, base, forms, es, note (the reader's own), saved (ms) }.
// It keeps copies of the texts, so the word list needs no chapter data.

const store = (() => {
  try {
    const saved = JSON.parse(localStorage.getItem(STORE_KEY));
    if (saved?.books) return { books: saved.books, settings: { ...DEFAULTS, ...saved.settings }, words: saved.words ?? [] };
  } catch {}
  return { books: {}, settings: { ...DEFAULTS }, words: [] };
})();
const save = () => localStorage.setItem(STORE_KEY, JSON.stringify(store));
const progress = (bookId) => (store.books[bookId] ??= { chapter: 1, chapters: {} });
const listened = (book) => {
  const p = store.books[book.id]?.chapters ?? {};
  return book.chapters.reduce((sum, c) => sum + (p[c.n]?.done ? c.duration : Math.min(p[c.n]?.time ?? 0, c.duration)), 0);
};
const total = (book) => book.chapters.reduce((sum, c) => sum + c.duration, 0);
const wordKey = (w) => `${w.book}/${w.chapter}/${w.at[0]}`;
const savedAt = (book, chapter, i) => store.words.find((w) => w.book === book && w.chapter === chapter && w.at.includes(i));

const systemDark = matchMedia("(prefers-color-scheme: dark)");
const sheet = matchMedia("not all and (min-width: 68rem)"); // the word panel: under the sentence, else at the side (style.css)

function applySettings() {
  const { theme, font, size } = store.settings, root = document.documentElement;
  root.dataset.theme = theme === "auto" ? (systemDark.matches ? "night" : "paper") : theme;
  root.dataset.font = font;
  root.style.setProperty("--text-scale", size);
  root.toggleAttribute("data-gloss", store.settings.gloss);
  document.querySelector('meta[name="theme-color"]').content = getComputedStyle(root).getPropertyValue("--bg");
}
applySettings();
systemDark.addEventListener("change", applySettings);

const view = document.getElementById("view");
const audio = document.getElementById("audio");

async function fetchJSON(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function loadError(container, message) {
  container.innerHTML = `<p role="alert">${message}</p><button class="button primary">Reintentar</button>`;
  container.querySelector("button").onclick = () => location.reload();
}

const library = await fetchJSON("library.json").catch(() => null);
// The ideas of English grammar that notes link to: { [id]: { name, en, text, examples: [[en, es]...], wrong: [[bad, good]...] } }
let concepts = {};
const conceptsLoaded = fetchJSON("concepts-es.json").then((c) => (concepts = c));
conceptsLoaded.catch(() => {});
// The English dictionary that units link to with base and sense: { [word]: { forms, senses: [{ id, es, ex }...] } }
let dictionary = {};
fetchJSON("dictionary-en.json").then((d) => (dictionary = d), () => {});

// Routing: #/ (library), #/<book> (chapters), #/<book>/<n> (reader), #/<book>/<n>/<word> (reader, open at a word),
// #/words and #/words/<book> (saved words), #/grammar (the concepts)

let leave = () => {};
let wordsFrom = "#/words"; // the word list page that opened the reader, for its back button
const wordsLink = (href) => `<a class="button top-link" href="${href}">${icon("saved")}Mis palabras</a>`;
const grammarLink = `<a class="button top-link" href="#/grammar">${icon("lesson")}Gramática</a>`;

function route() {
  leave();
  leave = () => {};
  const [bookId, n, word] = location.hash.slice(2).split("/");
  const book = library.find((b) => b.id === bookId);
  const chapter = book?.chapters.find((c) => c.n === Number(n));
  window.scrollTo(0, 0);
  if (bookId === "words") showWords(library.find((b) => b.id === n));
  else if (bookId === "grammar") showGrammar();
  else if (chapter) leave = showReader(book, chapter, word ? Number(word) : -1);
  else if (book) showBook(book);
  else showLibrary();
}
if (library) {
  window.addEventListener("hashchange", route);
  route();
} else {
  view.innerHTML = `<header class="top"><h1>Biblioteca</h1></header><div class="page"></div>`;
  loadError(view.querySelector(".page"), "No se pudo cargar la biblioteca. Comprueba tu conexión.");
}

function showLibrary() {
  document.title = "Audiolibros";
  view.innerHTML = `
    <header class="top"><h1>Biblioteca</h1>${wordsLink("#/words")}${grammarLink}</header>
    <div class="page">
      <ul class="books">${library.map((book) => `
        <li><a class="book-card" href="#/${book.id}">
          <img src="${book.cover}" alt="">
          <div>
            <span class="level">${esc(book.level)}</span>
            <h2>${esc(book.title)}</h2>
            <p>${esc(book.author)}</p>
            <p class="muted">Narrado por ${esc(book.narrator)} · ${book.chapters.length} ${book.chapters.length === 1 ? "capítulo" : "capítulos"} · ${minutes(total(book))}</p>
            <div class="meter"><i style="width:${(100 * listened(book)) / total(book)}%"></i></div>
          </div>
        </a></li>`).join("")}
      </ul>
      <div class="app-actions"><button id="install-app" class="button" hidden>Instalar app</button></div>
    </div>`;
  updateInstallButton();
}

function showBook(book) {
  document.title = book.title;
  const p = progress(book.id);
  const current = book.chapters.find((c) => c.n === p.chapter) ?? book.chapters[0];
  const started = listened(book) > 0;
  view.innerHTML = `
    <header class="top">
      <a class="icon" href="#/" aria-label="Biblioteca">${icon("back")}</a>
      <div class="top-title"><span>Biblioteca</span></div>
      ${wordsLink(`#/words/${book.id}`)}
    </header>
    <div class="page">
      <section class="hero">
        <img src="${book.cover}" alt="">
        <div>
          <span class="level">${esc(book.level)}</span>
          <h1>${esc(book.title)}</h1>
          <p>${esc(book.author)}</p>
          <p class="muted">Narrado por ${esc(book.narrator)}</p>
          <a class="button primary" href="#/${book.id}/${current.n}">${icon("play")}${started ? "Continuar" : "Empezar"} · Capítulo ${current.n}</a>
        </div>
      </section>
      <ol class="chapters">${book.chapters.map((c) => {
        const state = p.chapters[c.n];
        const status = state?.done ? `<span class="done">✓ Terminado</span>`
          : state?.time > 5 ? `quedan ${minutes(c.duration - state.time)}` : minutes(c.duration);
        return `<li><a href="#/${book.id}/${c.n}">
          <span class="num">${c.n}</span><span>${esc(c.title)}</span><span class="status">${status}</span>
        </a></li>`;
      }).join("")}
      </ol>
    </div>`;
}

function showWords(book) {
  wordsFrom = location.hash;
  document.title = "Mis palabras";
  const books = library.filter((b) => store.words.some((w) => w.book === b.id));
  view.innerHTML = `
    <header class="top">
      <a class="icon" href="${book ? `#/${book.id}` : "#/"}" aria-label="Volver">${icon("back")}</a>
      <div class="top-title"><small></small><span>Mis palabras</span></div>
    </header>
    <div class="page">
      ${books.length > 1 ? `<nav class="filters">
        <a href="#/words" aria-current="${!book}">Todos</a>
        ${books.map((b) => `<a href="#/words/${b.id}" aria-current="${b === book}">${esc(b.title)}</a>`).join("")}
      </nav>` : ""}
      <input class="search" type="search" placeholder="Buscar en inglés o en español" aria-label="Buscar">
      <ul class="word-list"></ul>
      <p class="empty muted" hidden></p>
      <div class="backup">
        <p class="muted">Tus palabras solo se guardan en este navegador. Haz una copia para no perderlas o para pasarlas a otro dispositivo.</p>
        <button class="button export">Exportar copia</button>
        <label class="button import">Importar copia<input type="file" accept=".json,application/json" hidden></label>
        <output></output>
      </div>
    </div>`;

  const $ = (selector) => view.querySelector(selector);
  const fold = (text) => (text ?? "").normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  const where = (w) => {
    const b = library.find((x) => x.id === w.book), c = b?.chapters.find((x) => x.n === w.chapter);
    return `${books.length > 1 ? `${esc(b?.title ?? w.book)} · ` : ""}Capítulo ${w.chapter}${c ? ` · ${esc(c.title)}` : ""}`;
  };
  const marked = (w) => w.sentence.split(" ").map((t, k) => (w.k.includes(k) ? `<mark>${esc(t)}</mark>` : esc(t))).join(" ");

  function list() {
    const mine = store.words.filter((w) => !book || w.book === book.id);
    const query = fold($(".search").value.trim());
    const shown = mine
      .filter((w) => !query || [w.en, w.base, w.es, w.note, w.sentence].some((x) => fold(x).includes(query)))
      .sort((a, b) => b.saved - a.saved);
    $(".top-title small").textContent = `${mine.length} ${mine.length === 1 ? "guardada" : "guardadas"}`;
    $(".word-list").innerHTML = shown.map((w) => `
      <li><a href="#/${w.book}/${w.chapter}/${w.at[0]}">
        <span class="word-en" lang="en">${esc(w.en)}</span>
        ${w.base ? `<span class="word-base">${baseHTML(w.base, w.forms)}</span>` : ""}
        ${w.es ? `<span class="word-es" lang="es">${esc(w.es)}</span>` : ""}
        ${w.note ? `<span class="word-note">${esc(w.note)}</span>` : ""}
        <span class="word-sentence" lang="en">${marked(w)}</span>
        <small class="word-where">${where(w)}</small>
      </a><button class="icon remove" data-key="${esc(wordKey(w))}" aria-label="Quitar">${icon("close")}</button></li>`).join("");
    $(".empty").hidden = shown.length > 0;
    $(".empty").innerHTML = mine.length
      ? `Ninguna palabra coincide con «${esc($(".search").value.trim())}».`
      : `Aún no has guardado palabras. Mientras lees, toca una palabra y luego el marcador ${icon("save")} de la ventana.`;
  }
  list();

  $(".search").addEventListener("input", list);
  $(".word-list").addEventListener("click", (e) => {
    const b = e.target.closest(".remove");
    if (!b) return;
    const w = store.words.find((x) => wordKey(x) === b.dataset.key);
    if (!confirm(`¿Quitar «${w.en}» de tus palabras?`)) return;
    store.words.splice(store.words.indexOf(w), 1);
    save();
    list();
  });

  // Copies: a JSON file with all the saved words. Importing adds the words that are not in the list yet.
  $(".export").addEventListener("click", () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([JSON.stringify({ words: store.words }, null, 1)], { type: "application/json" }));
    a.download = `mis-palabras-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  });
  $(".import input").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const words = Array.isArray(data) ? data : data?.words;
      if (!Array.isArray(words)) throw new Error();
      const have = new Set(store.words.map(wordKey));
      const added = words.filter((w) => w?.book && w.chapter && Array.isArray(w.at) && Array.isArray(w.k)
        && typeof w.sentence === "string" && typeof w.en === "string" && !have.has(wordKey(w)));
      store.words.push(...added);
      save();
      list();
      $(".backup output").textContent = added.length === 1 ? "1 palabra nueva importada." : `${added.length} palabras nuevas importadas.`;
    } catch {
      $(".backup output").textContent = "Este archivo no es una copia de Mis palabras.";
    }
  });
}

// All the concepts, by name, each folded. The search looks in the names, the text and the examples.
function showGrammar() {
  document.title = "Gramática";
  view.innerHTML = `
    <header class="top">
      <a class="icon" href="#/" aria-label="Biblioteca">${icon("back")}</a>
      <div class="top-title"><small></small><span>Gramática</span></div>
    </header>
    <div class="page">
      <input class="search" type="search" placeholder="Buscar en inglés o en español" aria-label="Buscar">
      <div class="concept-list"></div>
      <p class="empty muted" hidden></p>
    </div>`;
  const $ = (selector) => view.querySelector(selector);
  const page = $(".page");
  const fold = (text) => text.normalize("NFD").replace(/\p{M}/gu, "").toLowerCase();
  conceptsLoaded.then(() => {
    if (!page.isConnected) return;
    const plain = (c) => c.name.replaceAll("*", "");
    const all = Object.values(concepts).sort((a, b) => plain(a).localeCompare(plain(b), "es"));
    $(".top-title small").textContent = `${all.length} temas`;
    $(".concept-list").innerHTML = all.map((c) => `<details class="concept">
        <summary>${icon("lesson")}${rich(capital(c.name))}${fold(c.en) === fold(plain(c)) ? "" : `<span lang="en">${esc(c.en)}</span>`}</summary>
        ${conceptHTML(c)}
      </details>`).join("");
    const cards = [...view.querySelectorAll(".concept")];
    const texts = all.map((c) => fold([c.name, c.en, c.text, ...c.examples.flat(), ...(c.wrong ?? []).flat()].join(" ")));
    $(".search").addEventListener("input", (e) => {
      const query = fold(e.target.value.trim());
      cards.forEach((card, k) => (card.hidden = !texts[k].includes(query)));
      const none = cards.every((card) => card.hidden);
      $(".empty").hidden = !none;
      if (none) $(".empty").textContent = `Ningún tema coincide con «${e.target.value.trim()}».`;
    });
  }, () => {
    if (page.isConnected) loadError(page, "No se pudo cargar la gramática. Comprueba tu conexión.");
  });
}

// target: the index of a word to show (from the word list), or -1. Showing a word does not move the audio.
function showReader(book, chapter, target) {
  document.title = `${chapter.title} · ${book.title}`;
  const p = progress(book.id);
  if (target < 0) {
    p.chapter = chapter.n;
    save();
  }

  view.innerHTML = `
    <header class="top">
      <a class="icon" href="${target < 0 ? `#/${book.id}` : wordsFrom}" aria-label="Volver">${icon("back")}</a>
      <div class="top-title"><small>Capítulo ${chapter.n}</small><span>${esc(chapter.title)}</span></div>
      <span class="remaining"></span>
    </header>
    <p class="playback-error" role="status" hidden></p>
    <article class="text" lang="en"><p class="muted">Cargando…</p></article>
    <div class="pop" role="dialog" aria-label="Ayuda" hidden><div class="pop-body">
      <div class="pop-head">
        <div class="pop-word" lang="en"></div>
        <div class="pop-base"></div>
        <button class="icon pop-save"></button>
        <button class="icon pop-close" aria-label="Cerrar ayuda" title="Cerrar">${icon("close")}</button>
      </div>
      <div class="pop-gloss" lang="es"></div>
      <p class="pop-note" lang="es"></p>
      <div class="pop-concepts" lang="es"></div>
      <div class="pop-also" lang="es"><span><i lang="en"></i> en otros contextos:</span><ul class="ex"></ul></div>
      <label class="pop-mine"><span>Tu nota</span><textarea rows="2" placeholder="Escribe aquí…"></textarea></label>
      <button class="pop-more" aria-expanded="false">${icon("more")}<span>Ver la frase entera</span></button>
      <p class="pop-sentence" lang="es" hidden></p>
      <button class="button primary pop-play">${icon("play")}Escuchar desde aquí</button>
    </div></div>
    <div class="viewer" role="dialog" aria-modal="true" aria-label="Imagen" hidden>
      <div class="viewer-stage"><span class="viewer-ink"></span></div>
      <div class="viewer-caption"><p lang="en"></p><p class="viewer-es" lang="es"></p></div>
      <button class="icon viewer-close" aria-label="Cerrar imagen" title="Cerrar">${icon("close")}</button>
    </div>
    <button class="mark" hidden aria-label="Volver a la lectura"></button>
    <footer class="player">
      <button class="pill" hidden></button>
      <div class="controls">
        <button class="chip rate" aria-label="Velocidad" aria-haspopup="menu" aria-expanded="false"></button>
        <button class="icon play" aria-label="Reproducir">${icon("play")}</button>
        <div class="end">
          <button class="chip gloss" aria-label="Traducción entre líneas" title="Traducción entre líneas" aria-pressed="false"><span class="langs"><span>EN</span><span>ES</span></span></button>
          <button class="chip look" aria-label="Texto y tema" aria-haspopup="dialog" aria-expanded="false">Aa</button>
        </div>
        <div class="panel rates" role="menu" aria-label="Velocidad" hidden>
          ${RATES.map((r) => `<button role="menuitemradio" data-rate="${r}">${r}×</button>`).join("")}
        </div>
        <div class="panel looks" role="dialog" aria-label="Texto y tema" hidden>
          <div class="row">
            <span>Tamaño</span>
            <div class="seg stepper">
              <button data-step="-1" aria-label="Letra más pequeña">A</button><output></output><button data-step="1" aria-label="Letra más grande">A</button>
            </div>
          </div>
          <div class="row">
            <span>Letra</span>
            <div class="seg">${Object.entries(FONTS).map(([id, label]) => `<button data-font="${id}">${label}</button>`).join("")}</div>
          </div>
          <div class="themes">${Object.entries(THEMES).map(([id, label]) => `
            <button data-pick-theme="${id}"><span class="swatch" data-theme="${id}">Aa</span>${label}</button>`).join("")}
          </div>
        </div>
      </div>
    </footer>`;

  const $ = (selector) => view.querySelector(selector);
  const header = $(".top"), article = $(".text"), player = $(".player"), pill = $(".pill"), mark = $(".mark");
  const pop = $(".pop"), popBody = $(".pop-body"), playButton = $(".play"), remaining = $(".remaining");

  const words = []; // { el, s, e, sentence, k (its number in the sentence) }
  const sentences = []; // { el, first (index of its first word) }
  let timed = 0; // the words of the text, which have times. The words of the captions come after them.
  const figures = new Map(); // the button of a picture -> { src, ratio, caption (its sentence numbers) }
  let translation = null; // for each sentence: { es, line: [{ t: [k...], es }] (optional), units: [{ t: [k...], es, base, sense, note }] } or null
  let current = -1; // index of the highlighted word
  let picked = []; // indexes of the words outlined by the open popup
  let popUnit = null; // the unit of the open popup
  let follow = true; // scroll the page with the audio
  let ready = false; // audio is at the saved position, so progress can be saved
  let frame = 0;
  let lastSave = 0;

  const signal = new AbortController();
  const on = (target, type, fn, options = {}) => target.addEventListener(type, fn, { ...options, signal: signal.signal });

  fetchJSON(chapter.data, { signal: signal.signal }).then((data) => {
    if (signal.signal.aborted) return;
    render(data);
    const loaded = new Promise((resolve) => {
      on(audio, "loadedmetadata", resolve, { once: true });
      on(audio, "error", resolve, { once: true });
    });
    on(audio, "loadedmetadata", () => {
      const saved = p.chapters[chapter.n];
      seek(saved && !saved.done ? saved.time : 0, "instant");
      ready = true;
    }, { once: true });
    audio.src = data.audio;
    audio.defaultPlaybackRate = audio.playbackRate = store.settings.rate;
    const translated = data.translation ? fetchJSON(data.translation, { signal: signal.signal })
      .then((t) => { translation = t; addGlosses(); }).catch(() => null) : null;
    // Opened from the word list: show the word and its popup. The audio stays at the saved position.
    if (words[target]) Promise.all([loaded, translated]).then(() => {
      if (signal.signal.aborted) return;
      follow = false;
      reveal(words[target].el, "instant");
      openPop(target);
      updatePill();
    });
  }).catch(() => {
    if (signal.signal.aborted) return;
    article.lang = "es";
    loadError(article, "Este capítulo no está disponible. Comprueba tu conexión.");
  });

  // The words of the captions come after the words of the text, and their sentences after its sentences, as in
  // the translation. So a new picture does not change the numbers of the saved words.
  function render(data) {
    article.textContent = "";
    const captions = [];
    for (const block of data.blocks) {
      if (block.type === "figure") {
        article.append(figureEl(block, captions));
        continue;
      }
      const blockEl = document.createElement({ h: "h2", p: "p", break: "hr" }[block.type]);
      for (const sentence of block.sentences) addSentence(blockEl, sentence);
      article.append(blockEl);
    }
    timed = words.length;
    for (const { el, caption, sentences: numbers } of captions) {
      for (const sentence of caption) {
        numbers.push(sentences.length);
        addSentence(el, sentence.map((text) => [text]));
      }
    }
    const next = book.chapters.find((c) => c.n === chapter.n + 1);
    if (next) article.insertAdjacentHTML("beforeend",
      `<a class="button next-chapter" lang="es" href="#/${book.id}/${next.n}">Capítulo ${next.n} →</a>`);
    article.append(marks);
    layoutMarks();
  }

  function addSentence(parent, sentence) {
    const sentenceEl = document.createElement("span");
    sentenceEl.className = "s";
    sentences.push({ el: sentenceEl, first: words.length });
    for (const [k, [text, s, e]] of sentence.entries()) {
      const wordEl = document.createElement("span");
      wordEl.className = "w";
      wordEl.textContent = text;
      wordEl.dataset.i = words.length;
      words.push({ el: wordEl, s, e, sentence: sentences.length - 1, k });
      sentenceEl.append(wordEl, " ");
    }
    parent.append(sentenceEl);
  }

  // Ink masks use theme colours. An optional outline clips both ink and paper to the drawing's edges.
  function figureEl(block, captions) {
    const figure = document.createElement("figure");
    figure.className = "pic";
    figure.innerHTML = `<button class="pic-open" aria-label="Ampliar la imagen"><span class="pic-ink"></span></button>`;
    const open = figure.firstChild;
    open.style.setProperty("--w", `${block.width}em`);
    open.style.setProperty("--ratio", block.ratio);
    setPicture(open.firstChild, block);
    const info = { src: block.src, ratio: block.ratio, paper: block.paper, caption: [] };
    figures.set(open, info);
    if (block.caption.length) {
      const el = figure.appendChild(document.createElement("figcaption"));
      captions.push({ el, caption: block.caption, sentences: info.caption });
    }
    return figure;
  }

  function setPicture(el, picture) {
    el.style.setProperty("--picture", `url("${picture.src}")`);
    el.style.setProperty("--picture-shape", picture.paper ? `url("${picture.paper}")` : "none");
    el.classList.toggle("picture-shaped", Boolean(picture.paper));
  }

  // Translation between the lines (the gloss setting). Each chunk of the reading line becomes a column, the English
  // over the Spanish, and each sentence starts a line (style.css). Without a reading line (hp1 chapter 1), the popup
  // units are the columns: a unit with a gap, as "looked … up", has its Spanish under its part with the most
  // letters. The Spanish of the first column starts with a capital, as the English does.
  function addGlosses() {
    const letters = (run) => run.reduce((sum, i) => sum + trim(words[i].el.textContent).length, 0);
    translation.forEach((entry, s) => {
      const { first } = sentences[s] ?? {};
      if (!entry || first === undefined) return;
      const capital = /^\P{L}*\p{Lu}/u.test(words[first].el.textContent);
      for (const unit of entry.line ?? entry.units) {
        const at = unit.t.map((k) => first + k).sort((a, b) => a - b);
        const runs = at.reduce((out, i, n) => (n && i === at[n - 1] + 1 ? out.at(-1).push(i) : out.push([i]), out), []);
        const run = runs.reduce((best, r) => (letters(r) > letters(best) ? r : best));
        const column = document.createElement("span");
        column.className = "u";
        words[run[0]].el.before(column);
        for (let node = words[run[0]].el, last = words[run.at(-1)].el; ;) {
          const next = node.nextSibling;
          column.append(node);
          if (node === last) break;
          node = next;
        }
        const gloss = document.createElement("span");
        gloss.className = "g";
        gloss.lang = "es";
        gloss.dataset.i = at[0];
        gloss.textContent = capital && at[0] === first ? unit.es.replace(/\p{L}/u, (c) => c.toUpperCase()) : unit.es;
        column.append(gloss);
      }
    });
  }

  // Saved units: a ring around each run of words on one line, and the note in a bubble beside the text. The
  // bubbles show only on wide screens (style.css). A bubble moves down when the one above it is in the way.
  const marks = document.createElement("div");
  marks.className = "marks";
  function layoutMarks() {
    marks.textContent = "";
    const origin = article.getBoundingClientRect();
    const rings = (at) => at.reduce((out, i, n) => {
      const r = words[i].el.getBoundingClientRect(), last = out.at(-1);
      if (last && at[n - 1] === i - 1 && Math.abs(last.top - r.top) < 2) last.right = r.right;
      else out.push({ top: r.top, bottom: r.bottom, left: r.left, right: r.right });
      return out;
    }, []);
    const saved = store.words
      .filter((w) => w.book === book.id && w.chapter === chapter.n && w.at.every((i) => words[i]))
      .map((w) => ({ w, rings: rings(w.at) }))
      .sort((a, b) => a.rings[0].top - b.rings[0].top);
    let free = -Infinity; // the top of the free space under the last bubble
    for (const { w, rings } of saved) {
      for (const r of rings) {
        const ring = document.createElement("i");
        Object.assign(ring.style, {
          top: `${r.top - origin.top}px`, left: `${r.left - origin.left}px`,
          width: `${r.right - r.left}px`, height: `${r.bottom - r.top}px`,
        });
        marks.append(ring);
      }
      if (!w.note.trim()) continue;
      const bubble = document.createElement("button");
      bubble.className = "bubble";
      bubble.dataset.i = w.at[0];
      bubble.textContent = w.note;
      bubble.style.top = `${Math.max(rings[0].top - origin.top, free + 8)}px`;
      marks.append(bubble);
      free = bubble.offsetTop + bubble.offsetHeight;
    }
  }
  const resized = new ResizeObserver(() => layoutMarks());
  resized.observe(article);
  // A font that arrives late moves the words, but often not the size of the text.
  on(document.fonts, "loadingdone", () => layoutMarks());

  // Time -> word

  // A jump to a word starts PREROLL before it, so a word starts that much earlier here.
  function wordAt(t) {
    let lo = 0, hi = timed - 1, found = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (words[mid].s <= t + PREROLL + 0.01) { found = mid; lo = mid + 1; } else hi = mid - 1;
    }
    return found;
  }

  function highlight(i) {
    if (i === current) return;
    const before = words[current], now = words[i];
    if (before) {
      before.el.classList.remove("on");
      sentences[before.sentence].el.classList.remove("on");
    }
    if (now) {
      now.el.classList.add("on");
      sentences[now.sentence].el.classList.add("on");
    }
    current = i;
    updatePill();
  }

  function sync() {
    const t = audio.currentTime, i = wordAt(t);
    if (i !== current) {
      highlight(i);
      if (follow && words[i]) reveal(words[i].el, "smooth");
    }
    showTime(t);
  }

  function showTime(t) {
    const text = `quedan ${minutes(chapter.duration - t)}`;
    if (remaining.textContent !== text) remaining.textContent = text;
  }

  // Scrolling: keep the current word in the upper part of the space between the header and the player

  function band() {
    const top = header.getBoundingClientRect().bottom;
    const bottom = (sheet.matches && !pop.hidden ? pop : player).getBoundingClientRect().top;
    return { top, bottom, height: bottom - top };
  }

  function reveal(el, behavior) {
    const r = el.getBoundingClientRect(), b = band();
    if (r.top >= b.top + b.height * 0.1 && r.bottom <= b.top + b.height * 0.75) return;
    window.scrollTo({ top: window.scrollY + r.top - b.top - b.height * 0.3, behavior });
  }

  // When the reading position is off screen: a pill above the player, and a mark beside the scrollbar
  // at the place where the scrollbar thumb would show the reading position.
  function updatePill() {
    const el = words[current]?.el;
    let away = false;
    if (el && !follow) {
      const r = el.getBoundingClientRect(), b = band();
      away = r.bottom <= b.top || r.top >= b.bottom;
      if (away) {
        pill.textContent = `${r.top < b.top ? "↑" : "↓"} Volver a la lectura`;
        const y = ((window.scrollY + r.top + r.height / 2) / document.documentElement.scrollHeight) * window.innerHeight;
        mark.style.top = `${clamp(y, 16, window.innerHeight - 16)}px`;
      }
    }
    pill.hidden = mark.hidden = !away;
  }

  function stopFollow() {
    follow = false;
    updatePill();
  }

  function startFollow() {
    follow = true;
    if (words[current]) reveal(words[current].el, "smooth");
    updatePill();
  }

  // Playback

  function playbackError() {
    const message = $(".playback-error");
    message.textContent = navigator.onLine
      ? "No se pudo cargar el audio. Pulsa reproducir para reintentar."
      : "Conéctate para escuchar el audio.";
    message.hidden = false;
  }

  function play() {
    closePop();
    startFollow();
    if (audio.error) {
      // Keep the current position when retrying after a network failure.
      const time = ready ? audio.currentTime : (p.chapters[chapter.n]?.time ?? 0);
      on(audio, "loadedmetadata", () => seek(time, "instant"), { once: true });
      audio.load();
    }
    audio.play().catch((error) => {
      if (!signal.signal.aborted && error.name !== "AbortError") playbackError();
    });
  }

  function seek(t, behavior = "smooth") {
    t = clamp(t, 0, chapter.duration);
    audio.currentTime = t;
    follow = true;
    highlight(wordAt(t));
    showTime(t);
    if (words[current]) reveal(words[current].el, behavior);
    updatePill();
  }

  // After a pause, start again at the word that was playing, or at the last word heard.
  function resume() {
    const word = words[current];
    if (word && audio.currentTime > word.s) seek(word.s - PREROLL);
    play();
  }

  const toggle = () => (audio.paused ? resume() : audio.pause());

  function saveProgress(force) {
    if (!ready) return;
    const now = performance.now();
    if (!force && now - lastSave < 2000) return;
    lastSave = now;
    const t = audio.currentTime;
    p.chapters[chapter.n] = { time: Math.round(t * 10) / 10, done: t >= chapter.duration - 3 };
    save();
  }

  function tick() {
    sync();
    frame = requestAnimationFrame(tick);
  }

  function setPlaying(playing) {
    playButton.innerHTML = icon(playing ? "pause" : "play");
    playButton.setAttribute("aria-label", playing ? "Pausa" : "Reproducir");
    cancelAnimationFrame(frame);
    if (playing) frame = requestAnimationFrame(tick);
    keepScreenOn(playing);
  }

  // Keep the screen on while the audio plays. The browser drops the lock when the page is hidden.
  let wakeLock = null; // a promise of the lock
  function keepScreenOn(keep) {
    if (keep === Boolean(wakeLock)) return;
    if (keep) wakeLock = navigator.wakeLock?.request("screen").catch(() => null) ?? null;
    else { wakeLock.then((lock) => lock?.release()); wakeLock = null; }
  }

  on(audio, "play", () => {
    $(".playback-error").hidden = true;
    setPlaying(true);
    if (p.chapter !== chapter.n) { p.chapter = chapter.n; save(); }
  });
  on(audio, "pause", () => { setPlaying(false); saveProgress(true); });
  on(audio, "error", playbackError);
  on(audio, "seeked", sync);
  on(audio, "timeupdate", () => saveProgress(false));
  on(audio, "ended", () => {
    p.chapters[chapter.n] = { time: chapter.duration, done: true };
    save();
  });

  // Controls

  on(playButton, "click", toggle);
  on(pill, "click", startFollow);
  on(mark, "click", startFollow);

  // Speed menu and text and theme panel

  const panels = [[$(".rate"), $(".rates")], [$(".look"), $(".looks")]];
  function togglePanel(k) {
    panels.forEach(([button, panel], j) => {
      const open = j === k && panel.hidden;
      panel.hidden = !open;
      button.setAttribute("aria-expanded", open);
    });
  }
  const closePanels = () => togglePanel(-1);
  panels.forEach(([button], k) => on(button, "click", () => togglePanel(k)));
  on(document, "click", (e) => {
    if (!e.target.closest(".panel, .rate, .look")) closePanels();
  });

  function showSettings() {
    const { rate, size, font, theme } = store.settings;
    $(".rate").textContent = `${rate}×`;
    for (const b of view.querySelectorAll("[data-rate]")) b.setAttribute("aria-checked", Number(b.dataset.rate) === rate);
    for (const b of view.querySelectorAll("[data-font]")) b.setAttribute("aria-pressed", b.dataset.font === font);
    for (const b of view.querySelectorAll("[data-pick-theme]")) b.setAttribute("aria-pressed", b.dataset.pickTheme === theme);
    $(".gloss").setAttribute("aria-pressed", store.settings.gloss);
    $(".stepper output").textContent = `${Math.round(size * 100)}%`;
    $('[data-step="-1"]').disabled = size <= SIZES[0];
    $('[data-step="1"]').disabled = size >= SIZES.at(-1);
  }
  showSettings();

  function changeSettings(change) {
    // Keep the same words at the same place on the screen when the text size or font changes.
    const anchor = follow && words[current] ? words[current].el : firstVisibleWord();
    const before = anchor?.getBoundingClientRect().top;
    change(store.settings);
    save();
    applySettings();
    showSettings();
    if (anchor) window.scrollTo(0, window.scrollY + anchor.getBoundingClientRect().top - before);
  }

  function firstVisibleWord() {
    const top = band().top;
    let lo = 0, hi = timed - 1, found = -1;
    while (lo <= hi) {
      const mid = (lo + hi) >> 1;
      if (words[mid].el.getBoundingClientRect().bottom > top) { found = mid; hi = mid - 1; } else lo = mid + 1;
    }
    return words[found]?.el;
  }

  on($(".gloss"), "click", () => {
    changeSettings((s) => (s.gloss = !s.gloss));
    if (!pop.hidden) placePop();
  });

  on($(".rates"), "click", (e) => {
    const b = e.target.closest("[data-rate]");
    if (!b) return;
    changeSettings((s) => (s.rate = Number(b.dataset.rate)));
    audio.playbackRate = audio.defaultPlaybackRate = store.settings.rate;
    closePanels();
  });

  on($(".looks"), "click", (e) => {
    const b = e.target.closest("button");
    if (b?.dataset.step) {
      // The nearest size step, so a size saved by an older version still works.
      const at = SIZES.reduce((best, x, k) => (Math.abs(x - store.settings.size) < Math.abs(SIZES[best] - store.settings.size) ? k : best), 0);
      changeSettings((s) => (s.size = SIZES[clamp(at + Number(b.dataset.step), 0, SIZES.length - 1)]));
    } else if (b?.dataset.font) changeSettings((s) => (s.font = b.dataset.font));
    else if (b?.dataset.pickTheme) changeSettings((s) => (s.theme = b.dataset.pickTheme));
  });

  on(document, "keydown", (e) => {
    if (e.target.closest("input, textarea") && e.key !== "Escape") return;
    if (e.key === " " && !e.target.closest("button")) { e.preventDefault(); toggle(); }
    else if (e.key === "Escape" && !viewer.hidden) closeViewer();
    else if (e.key === "Escape") { closePop(); closePanels(); }
    else if (["ArrowUp", "ArrowDown", "PageUp", "PageDown", "Home", "End"].includes(e.key)) stopFollow();
  });

  // The user scrolls the text: stop following the audio until they ask for it again.
  on(window, "wheel", stopFollow, { passive: true });
  on(window, "touchmove", stopFollow, { passive: true });
  on(window, "scroll", updatePill, { passive: true });
  on(window, "resize", () => {
    updatePill();
    if (!pop.hidden) placePop();
  });

  // Word popup

  on($(".pop-close"), "click", closePop);
  on(article, "click", (e) => {
    const el = e.target.closest(".w, .bubble, .g"), picture = e.target.closest(".pic-open");
    if (el) lookUp(Number(el.dataset.i));
    else if (picture) openViewer(picture);
  });
  on(document, "click", (e) => {
    // The path at the time of the click: a click can replace its own target, as the bookmark icon does.
    // The player stays usable with the popup open. Its play button closes the popup.
    if (!pop.hidden && !e.composedPath().includes(pop) && !e.target.closest(".w, .bubble, .g, .player")) closePop();
  });
  // Start LEAD words before the unit, to hear it in context, but not before its sentence.
  on($(".pop-play"), "click", () => {
    const first = Math.min(...picked), start = sentences[words[first].sentence].first;
    closePop();
    seek(words[Math.max(start, first - LEAD)].s - PREROLL);
    play();
  });
  // A footnote opened or closed, or the text changed its size. The observer places the panel before the next paint;
  // the toggle event comes a frame late. Under the sentence, the page also scrolls to make room.
  const popObserver = new ResizeObserver(() => { if (!pop.hidden) placePop(); });
  popObserver.observe(pop);
  popObserver.observe(article);
  on(pop, "toggle", () => { if (sheet.matches) placePop(true); }, { capture: true });
  // A concept link in the note opens or closes its footnote.
  on($(".pop-note"), "click", (e) => {
    const ref = e.target.closest(".concept-ref");
    if (!ref) return;
    const footnote = $(".pop-concepts").children[ref.dataset.n];
    footnote.open = !footnote.open;
    // On a phone, the panel scrolls: show the opened footnote in it. Never scroll the page away from the unit.
    if (footnote.open) requestAnimationFrame(() => {
      const over = footnote.getBoundingClientRect().bottom - popBody.getBoundingClientRect().bottom;
      if (over > 0) popBody.scrollTop += over;
    });
  });
  on($(".pop-note"), "keydown", (e) => {
    const ref = e.target.closest(".concept-ref");
    if (ref && (e.key === "Enter" || e.key === " ")) {
      e.preventDefault();
      ref.click();
    }
  });
  on($(".pop-more"), "click", (e) => {
    const sentence = $(".pop-sentence");
    sentence.hidden = !sentence.hidden;
    e.currentTarget.setAttribute("aria-expanded", !sentence.hidden);
    e.currentTarget.querySelector("span").textContent = sentence.hidden ? "Ver la frase entera" : "Ocultar la frase";
    placePop(true);
  });

  // Save the unit to the word list, or remove it.
  on($(".pop-save"), "click", () => {
    const i = Number(pop.dataset.word), mine = savedAt(book.id, chapter.n, i);
    if (mine) {
      store.words.splice(store.words.indexOf(mine), 1);
    } else {
      const w = {
        book: book.id, chapter: chapter.n, at: [...picked], k: picked.map((j) => words[j].k),
        sentence: words.filter((x) => x.sentence === words[i].sentence).map((x) => x.el.textContent).join(" "),
        en: $(".pop-word").textContent, base: popUnit?.base, forms: dictionary[popUnit?.base]?.forms, es: popUnit?.es, note: "", saved: Date.now(),
      };
      store.words.push(w);
    }
    save();
    showSaved(i);
    placePop();
    layoutMarks();
    if (!mine) $(".pop-mine textarea").focus({ preventScroll: true }); // just saved: ask for a note
  });
  on($(".pop-mine"), "input", (e) => {
    const mine = savedAt(book.id, chapter.n, Number(pop.dataset.word));
    if (mine) { mine.note = e.target.value; save(); layoutMarks(); placePop(); } // the field grows with the note
  });

  function showSaved(i) {
    const mine = savedAt(book.id, chapter.n, i), button = $(".pop-save");
    const label = mine ? "Quitar de mis palabras" : "Guardar en mis palabras";
    button.innerHTML = icon(mine ? "saved" : "save");
    button.setAttribute("aria-pressed", !!mine);
    button.setAttribute("aria-label", label);
    button.title = label;
    $(".pop-mine").hidden = !mine;
    $(".pop-mine textarea").value = mine?.note ?? "";
  }

  const trim = (text) => text.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
  // Notes mark English words as *word*.
  // A note, with each concept link ([[id]]) as the concept's name and a footnote number. A link to a concept that
  // is not in the dictionary goes away, with its brackets. Returns the html and the linked ids, in order.
  function noteHTML(note) {
    const ids = [];
    const html = rich(note).replace(/ ?\(\[\[([a-z0-9-]+)\]\]\)|\[\[([a-z0-9-]+)\]\]/g, (all, inBrackets, bare) => {
      const id = inBrackets ?? bare;
      if (!concepts[id]) return "";
      if (!ids.includes(id)) ids.push(id);
      const n = ids.indexOf(id);
      // Use an inline button role so long labels wrap with the surrounding note.
      const ref = `<span role="button" tabindex="0" class="concept-ref" data-n="${n}">${icon("lesson")}${rich(concepts[id].name)}<sup>${n + 1}</sup></span>`;
      return inBrackets ? ` <span class="concept-group">(${ref})</span>` : ref;
    });
    return { html, ids };
  }

  // The linked concepts as footnotes, folded: the reader opens one when they want it.
  const footnotes = (ids) => ids.map((id, n) => `<details class="concept">
      <summary>${icon("lesson")}<sup>${n + 1}</sup>${rich(capital(concepts[id].name))}</summary>
      ${conceptHTML(concepts[id])}
    </details>`).join("");

  // A tap on a word: pause and show the popup. Play continues from the same place; "Escuchar desde aquí" starts
  // near the word.
  function lookUp(i) {
    openPop(i);
    if (pop.hidden) return;
    audio.pause();
    stopFollow();
  }

  function openPop(i) {
    closePop();
    if (!trim(words[i].el.textContent)) return; // "–", "…": nothing to explain
    const { sentence, k } = words[i], entry = translation?.[sentence];
    sentences[sentence].el.classList.add("look");
    const unit = (popUnit = entry?.units.find((u) => u.t.includes(k)));
    const first = sentences[sentence].first;
    picked = unit ? unit.t.map((t) => first + t) : [i];
    for (const j of picked) words[j].el.classList.add("picked");
    // The words of the unit; "…" marks a gap, as in "looked … up".
    $(".pop-word").textContent = trim(picked
      .map((j, n) => (n && j !== picked[n - 1] + 1 ? "… " : "") + words[j].el.textContent)
      .join(" "));
    const lemma = dictionary[unit?.base];
    const others = lemma?.senses.filter((x) => x.id !== unit.sense) ?? [];
    $(".pop-base").innerHTML = unit?.base ? baseHTML(unit.base, lemma?.forms) : "";
    $(".pop-base").hidden = !unit?.base;
    $(".pop-gloss").textContent = unit?.es ?? "";
    const note = noteHTML(unit?.note ?? "");
    $(".pop-note").innerHTML = note.html;
    $(".pop-also i").textContent = unit?.base ?? "";
    $(".pop-also ul").innerHTML = others.map((x) => `<li><b>${esc(x.es)}</b><span><i lang="en">${esc(x.ex[0])}</i><small>${esc(x.ex[1])}</small></span></li>`).join("");
    $(".pop-also").hidden = !others.length;
    $(".pop-concepts").innerHTML = footnotes(note.ids);
    $(".pop-sentence").innerHTML = entry ? translationHTML(entry, unit) : "";
    $(".pop-sentence").hidden = true;
    // When the unit is the whole sentence, the sentence translation only repeats the gloss.
    const end = sentences[sentence + 1]?.first ?? words.length;
    const whole = words.slice(first, end).every((w, n) => picked.includes(first + n) || !trim(w.el.textContent));
    $(".pop-more").hidden = !entry || whole;
    $(".pop-more").setAttribute("aria-expanded", false);
    $(".pop-more span").textContent = "Ver la frase entera";
    $(".pop-play").hidden = i >= timed; // a caption has no audio
    pop.dataset.word = i;
    showSaved(i);
    pop.hidden = false;
    placePop(true);
  }

  // The card is as tall as its content (style.css). On wide screens, it is in the margin, under the header.
  // On narrower screens, it is in the page under the sentence, so it scrolls with the text. Pinned (pin), the page
  // scrolls up when the card goes under the player, but never so far that the unit goes under the header. The card is
  // never taller than that space.
  // A word with its column (the Spanish under it)
  const unitBox = (j) => (words[j].el.closest(".u") ?? words[j].el).getBoundingClientRect();
  function placePop(pin = false) {
    const gap = 8, top = header.getBoundingClientRect().bottom, bottom = player.getBoundingClientRect().top;
    if (!sheet.matches) {
      pop.style.top = `${top + 12}px`;
      pop.style.maxHeight = `${bottom - top - 24}px`;
      return;
    }
    const unitTop = Math.min(...picked.map((j) => unitBox(j).top));
    const below = sentences[words[pop.dataset.word].sentence].el.getBoundingClientRect().bottom + gap;
    const end = Math.min(bottom, playButton.getBoundingClientRect().top) - gap; // the play button rises
    pop.style.top = `${window.scrollY + below}px`;
    pop.style.maxHeight = `${end - (top + gap) - (below - unitTop)}px`;
    if (!pin) return;
    const shift = Math.min(below + pop.offsetHeight - end, unitTop - top - gap);
    if (shift > 1) window.scrollTo({ top: window.scrollY + shift, behavior: "smooth" });
  }

  function closePop() {
    for (const j of picked) words[j].el.classList.remove("picked");
    view.querySelector(".s.look")?.classList.remove("look");
    picked = [];
    pop.hidden = true;
  }

  // Picture viewer: the picture as large as the screen. Pinch, the wheel or a double tap zooms; a drag moves the
  // zoomed picture. A tap beside the picture, Escape or the back button closes it. The audio goes on.
  const viewer = $(".viewer"), stage = $(".viewer-stage"), ink = $(".viewer-ink");
  let opener = null, ratio = 1, zoom = { s: 1, x: 0, y: 0 };
  const MAX_ZOOM = 6;

  function openViewer(button) {
    const info = figures.get(button);
    closePop();
    opener = button;
    ratio = info.ratio;
    setPicture(ink, info);
    const text = (s) => words.filter((w) => w.sentence === s).map((w) => w.el.textContent).join(" ");
    $(".viewer-caption [lang=en]").textContent = info.caption.map(text).join(" ");
    $(".viewer-es").textContent = store.settings.gloss ? info.caption.map((s) => translation?.[s]?.es ?? "").join(" ").trim() : "";
    $(".viewer-caption").hidden = !info.caption.length;
    viewer.hidden = false;
    fit();
    history.pushState({ viewer: true }, "");
    $(".viewer-close").focus();
  }

  // Close through the history, so the back button and the close button do the same thing.
  const closeViewer = () => (history.state?.viewer ? history.back() : hideViewer());
  function hideViewer() {
    if (viewer.hidden) return;
    viewer.hidden = true;
    opener?.focus({ preventScroll: true });
  }
  on(window, "popstate", hideViewer);
  on($(".viewer-close"), "click", closeViewer);

  // The largest size that fits the stage, then no zoom.
  function fit() {
    const r = stage.getBoundingClientRect(), w = Math.min(r.width, r.height * ratio);
    ink.style.width = `${w}px`;
    ink.style.height = `${w / ratio}px`;
    setZoom(1, 0, 0);
  }
  on(window, "resize", () => { if (!viewer.hidden) fit(); });

  // x and y move the centre of the picture from the centre of the stage. The picture cannot leave the stage.
  function setZoom(s, x, y) {
    s = clamp(s, 1, MAX_ZOOM);
    const r = stage.getBoundingClientRect();
    const mx = Math.max(0, (ink.offsetWidth * s - r.width) / 2), my = Math.max(0, (ink.offsetHeight * s - r.height) / 2);
    zoom = { s, x: clamp(x, -mx, mx), y: clamp(y, -my, my) };
    ink.style.transform = `translate(${zoom.x}px, ${zoom.y}px) scale(${s})`;
    stage.classList.toggle("zoomed", s > 1);
  }

  // Zoom by k, and keep the point under (cx, cy) on the screen where it is.
  function zoomAt(k, cx, cy) {
    const r = stage.getBoundingClientRect(), px = cx - r.left - r.width / 2, py = cy - r.top - r.height / 2;
    k = clamp(zoom.s * k, 1, MAX_ZOOM) / zoom.s;
    setZoom(zoom.s * k, px - (px - zoom.x) * k, py - (py - zoom.y) * k);
  }

  on(stage, "wheel", (e) => {
    e.preventDefault();
    zoomAt(Math.exp(-e.deltaY * 0.002), e.clientX, e.clientY);
  }, { passive: false });

  const pointers = new Map(); // pointer id -> its last { x, y }
  let gesture = null; // { x, y, t, moved }: where and when the first pointer went down
  let lastTap = null;
  const centre = () => {
    const [a, b] = [...pointers.values()];
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2, d: Math.hypot(a.x - b.x, a.y - b.y) };
  };
  on(stage, "pointerdown", (e) => {
    stage.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) gesture = { x: e.clientX, y: e.clientY, t: e.timeStamp, moved: false };
    else gesture.moved = true; // a pinch is not a tap
  });
  on(stage, "pointermove", (e) => {
    const last = pointers.get(e.pointerId);
    if (!last) return;
    const before = pointers.size === 2 ? centre() : null;
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (Math.hypot(e.clientX - gesture.x, e.clientY - gesture.y) > 8) gesture.moved = true;
    if (before) {
      const now = centre();
      setZoom(zoom.s, zoom.x + now.x - before.x, zoom.y + now.y - before.y);
      zoomAt(now.d / before.d, now.x, now.y);
    } else if (zoom.s > 1) {
      setZoom(zoom.s, zoom.x + e.clientX - last.x, zoom.y + e.clientY - last.y);
    }
  });
  const lift = (e) => {
    if (!pointers.delete(e.pointerId) || pointers.size || !gesture) return;
    const tap = !gesture.moved && e.timeStamp - gesture.t < 400 && e.type === "pointerup";
    gesture = null;
    if (!tap) return;
    if (lastTap && e.timeStamp - lastTap.t < 350 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 30) {
      lastTap = null;
      if (zoom.s > 1) setZoom(1, 0, 0);
      else zoomAt(2.5, e.clientX, e.clientY);
      return;
    }
    lastTap = { x: e.clientX, y: e.clientY, t: e.timeStamp };
    const r = ink.getBoundingClientRect();
    const beside = e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom;
    if (beside && zoom.s === 1) closeViewer();
  };
  on(stage, "pointerup", lift);
  on(stage, "pointercancel", lift);

  // Lock screen and media keys

  const media = navigator.mediaSession;
  const actions = {
    play: resume,
    pause: () => audio.pause(),
    seekbackward: () => seek(audio.currentTime - 15),
    seekforward: () => seek(audio.currentTime + 15),
    seekto: (details) => seek(details.seekTime),
  };
  if (media) {
    media.metadata = new MediaMetadata({
      title: `${chapter.n}. ${chapter.title}`,
      artist: `${book.author} · narrado por ${book.narrator}`,
      album: book.title,
      artwork: [{ src: new URL(book.cover, location.href).href }],
    });
    for (const [action, fn] of Object.entries(actions)) {
      try { media.setActionHandler(action, fn); } catch {}
    }
  }

  on(window, "pagehide", () => saveProgress(true));
  on(document, "visibilitychange", () => {
    if (document.hidden) saveProgress(true);
    else { wakeLock = null; keepScreenOn(!audio.paused); }
  });

  return () => {
    saveProgress(true);
    signal.abort();
    resized.disconnect();
    cancelAnimationFrame(frame);
    keepScreenOn(false);
    audio.pause();
    audio.removeAttribute("src");
    audio.load();
    if (media) for (const action of Object.keys(actions)) {
      try { media.setActionHandler(action, null); } catch {}
    }
  };
}
