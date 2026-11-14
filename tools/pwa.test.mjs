import { test } from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const site = new URL("../site/", import.meta.url);
const source = await readFile(new URL("sw.js", site), "utf8");
const appSource = await readFile(new URL("app.js", site), "utf8");
const translationHTML = vm.runInNewContext([
  appSource.match(/^const esc = .+;$/m)[0],
  appSource.match(/^function find\([\s\S]*?^\}/m)[0],
  appSource.match(/^const marked = [\s\S]*?;$/m)[0],
  appSource.match(/^function translationHTML\([\s\S]*?^\}/m)[0],
  "translationHTML",
].join("\n"));
// A legacy sentence without a reading line, and the gloss of the tapped unit.
const sentenceHTML = (sentence, gloss) => translationHTML({ es: sentence }, gloss === undefined ? undefined : { es: gloss });

test("pictures apply an optional paper outline and clear it for ordinary illustrations", () => {
  const setPicture = vm.runInNewContext([
    appSource.match(/^  function setPicture\(el, picture\) \{[\s\S]*?^  \}/m)[0],
    "setPicture",
  ].join("\n"));
  const properties = new Map(), classes = new Map();
  const el = {
    style: { setProperty: (key, value) => properties.set(key, value) },
    classList: { toggle: (key, value) => classes.set(key, value) },
  };
  setPicture(el, { src: "picture.webp", paper: "outline.webp" });
  assert.equal(properties.get("--picture"), 'url("picture.webp")');
  assert.equal(properties.get("--picture-shape"), 'url("outline.webp")');
  assert.equal(classes.get("picture-shaped"), true);
  setPicture(el, { src: "ink.webp" });
  assert.equal(properties.get("--picture"), 'url("ink.webp")');
  assert.equal(properties.get("--picture-shape"), "none");
  assert.equal(classes.get("picture-shaped"), false);
});

test("grammar references use focusable inline buttons so labels can wrap", () => {
  const noteHTML = vm.runInNewContext([
    appSource.match(/^const esc = .+;$/m)[0],
    appSource.match(/^const rich = .+;$/m)[0],
    appSource.match(/^  function noteHTML\(note\) \{[\s\S]*?^  \}/m)[0],
    "noteHTML",
  ].join("\n"), {
    concepts: { inversion: { name: "auxiliar delante del sujeto tras una negación" } },
    icon: () => "<svg></svg>",
  });
  const note = noteHTML("Una explicación ([[inversion]]).");
  assert.match(note.html, /<span role="button" tabindex="0" class="concept-ref" data-n="0">/);
  assert.doesNotMatch(note.html, /<button/);
  assert.deepEqual(Array.from(note.ids), ["inversion"]);
});

test("inline grammar buttons support Enter and Space without scrolling", () => {
  const handlerSource = appSource.match(/on\(\$\("\.pop-note"\), "keydown", (\(e\) => \{[\s\S]*?\n  \})\);/)[1];
  const keydown = vm.runInNewContext(`(${handlerSource})`);
  for (const key of ["Enter", " ", "Escape"]) {
    let clicks = 0, prevented = false;
    keydown({ key, target: { closest: () => ({ click: () => clicks++ }) }, preventDefault: () => { prevented = true; } });
    assert.equal(clicks, key === "Escape" ? 0 : 1);
    assert.equal(prevented, key !== "Escape");
  }
  keydown({ key: "Enter", target: { closest: () => null } });
});

test("grammar controls do not start playback with Enter or Space", () => {
  const noteSource = appSource.match(/on\(\$\("\.pop-note"\), "keydown", (\(e\) => \{[\s\S]*?\n  \})\);/)[1];
  const documentSource = appSource.match(/on\(document, "keydown", (\(e\) => \{[\s\S]*?\n  \})\);/)[1];
  const noteKeydown = vm.runInNewContext(`(${noteSource})`);
  let plays = 0;
  const documentKeydown = vm.runInNewContext(`(${documentSource})`, { toggle: () => plays++ });
  for (const key of ["Enter", " "]) {
    const event = {
      key,
      defaultPrevented: false,
      target: { closest: (selector) => selector === ".concept-ref" ? { click() {} } : null },
      preventDefault() { this.defaultPrevented = true; },
    };
    noteKeydown(event);
    documentKeydown(event);
    assert.equal(plays, 0);
  }
  for (const tag of ["button", "summary"]) {
    documentKeydown({
      key: " ",
      target: { closest: (selector) => selector.split(/,\s*/).includes(tag) ? {} : null },
      preventDefault() {},
    });
    assert.equal(plays, 0);
  }
  documentKeydown({ key: " ", target: { closest: () => null }, preventDefault() {} });
  assert.equal(plays, 1);
});

test("long grammar explanations keep their heading visible", () => {
  const source = appSource.match(/on\(\$\("\.pop-note"\), "click", (\(e\) => \{[\s\S]*?\n  \})\);/)[1];
  for (const [top, bottom, expected] of [[100, 200, 0], [300, 500, 100], [100, 900, 100]]) {
    const footnote = { open: false, getBoundingClientRect: () => ({ top, bottom }) };
    const popBody = { scrollTop: 0, getBoundingClientRect: () => ({ top: 0, bottom: 400 }) };
    const click = vm.runInNewContext(`(${source})`, {
      $: () => ({ children: [footnote] }),
      popBody,
      requestAnimationFrame: (callback) => callback(),
    });
    click({ target: { closest: () => ({ dataset: { n: "0" } }) } });
    assert.equal(footnote.open, true);
    assert.equal(popBody.scrollTop, expected);
  }
});

test("sentence highlights keep the original case, spacing, and punctuation", () => {
  assert.equal(sentenceHTML("Eran perfectamente normales, gracias.", "perfectamente normales"),
    "Eran <mark>perfectamente normales</mark>, gracias.");
  assert.equal(sentenceHTML("¡Muchas  gracias!", "muchas gracias"), "¡<mark>Muchas  gracias</mark>!");
});

test("sentence highlights skip missing and ambiguous translations", () => {
  for (const [sentence, gloss] of [
    ["Se encogió de hombros.", "se encoge de hombros"],
    ["Sí, sí.", "sí"],
    ["a a a", "a a"],
    ["Había un hombre grandote.", "un hombre grande"],
    ["Parecía alterado.", "alterado, nervioso"],
    ["Se marchó.", undefined],
    ["Se marchó.", ""],
  ]) assert.equal(sentenceHTML(sentence, gloss), sentence);
});

test("sentence highlights respect word boundaries and accents", () => {
  for (const [sentence, gloss] of [
    ["Desde allí.", "de"],
    ["Él llegó.", "el"],
    ["Quien-usted-sabe", "usted"],
    ["e\u0301l llegó.", "e"],
  ]) assert.equal(sentenceHTML(sentence, gloss), sentence);
  assert.equal(sentenceHTML("Él llegó.", "él"), "<mark>Él</mark> llegó.");
});

test("sentence highlights treat HTML and regular expression characters as text", () => {
  assert.equal(sentenceHTML("<b>J. K. Rowling</b>", "J. K. Rowling"),
    "&#60;b&#62;<mark>J. K. Rowling</mark>&#60;/b&#62;");
  assert.equal(sentenceHTML("Jx Kx Rowling", "J. K. Rowling"), "Jx Kx Rowling");
  assert.equal(sentenceHTML("<img src=x>", "<img src=x>"),
    "<mark>&#60;img src=x&#62;</mark>");
});
test("reading line highlights mark the gloss in the unit's chunk, or else the whole chunk", () => {
  const entry = { es: "Lo siento, no es posible.", line: [{ t: [0, 1], es: "«Lo siento," }, { t: [2, 3, 4], es: "no es posible»," }] };
  assert.equal(translationHTML(entry, { t: [4], es: "posible" }), "«Lo siento, no es <mark>posible</mark>»,");
  assert.equal(translationHTML(entry, { t: [3], es: "tan, es" }), "«Lo siento, no <mark>es</mark> posible»,");
  assert.equal(translationHTML(entry, { t: [0], es: "estoy" }), "<mark>«Lo siento,</mark> no es posible»,");
  assert.equal(translationHTML(entry, undefined), "«Lo siento, no es posible»,");
});
const scope = "https://example.test/audiobook/";
const prefix = `audiolibros:${scope}:`;
const key = (request) => typeof request === "string" ? request : request.url;

function worker() {
  const handlers = new Map(), stores = new Map();
  let claimed = false, skipped = false;
  const caches = {
    async open(name) {
      if (!stores.has(name)) stores.set(name, new Map());
      const entries = stores.get(name);
      return {
        async match(request) { return entries.get(key(request))?.clone(); },
        async put(request, response) { entries.set(key(request), response.clone()); },
        async addAll(requests) {
          for (const request of requests) {
            const path = new URL(request.url).pathname.slice("/audiobook/".length) || "index.html";
            await this.put(request, new Response(await readFile(new URL(path, site))));
          }
        },
      };
    },
    async keys() { return [...stores.keys()]; },
    async delete(name) { return stores.delete(name); },
  };
  const context = vm.createContext({
    self: {
      registration: { scope },
      clients: { async claim() { claimed = true; } },
      skipWaiting() { skipped = true; },
      addEventListener(type, handler) { handlers.set(type, handler); },
    },
    caches, URL, Request, Response, AbortController, setTimeout, clearTimeout,
    fetch: async () => { throw new TypeError("Offline"); },
  });
  vm.runInContext(source, context);
  async function dispatch(type, request) {
    const pending = [];
    let response;
    handlers.get(type)({ request, waitUntil: (promise) => pending.push(promise), respondWith: (promise) => { response = promise; } });
    const result = await response;
    await Promise.all(pending);
    return result;
  }
  const request = (path, options = {}) => new Request(new URL(path, scope), options);
  return { caches, context, dispatch, handlers, request, stores, get claimed() { return claimed; }, get skipped() { return skipped; } };
}

test("manifest uses the deployment subpath and valid phone icons", async () => {
  const manifest = JSON.parse(await readFile(new URL("manifest.webmanifest", site), "utf8"));
  for (const property of ["id", "scope", "start_url"]) assert.equal(new URL(manifest[property], scope).href, scope);
  assert.equal(manifest.display, "standalone");
  for (const icon of manifest.icons) {
    const png = await readFile(new URL(icon.src, site));
    assert.equal(`${png.readUInt32BE(16)}x${png.readUInt32BE(20)}`, icon.sizes);
  }
  assert.ok(manifest.icons.some((icon) => icon.purpose === "maskable"));
});

test("installation caches all shell files, but no audio", async () => {
  const w = worker();
  await w.dispatch("install");
  const entries = [...w.stores.values()][0];
  for (const file of ["index.html", "app.js", "pwa.js", "library.json", "fonts/literata.woff2", "books/hp1/cover.jpg"])
    assert.ok(entries.has(new URL(file, scope).href), file);
  assert.ok([...entries.keys()].every((url) => !url.endsWith(".mp3")));
  assert.equal(w.claimed, false);
});

test("activation removes only this app's old shell, keeping chapter data", async () => {
  const w = worker();
  await w.dispatch("install");
  await w.caches.open(`${prefix}shell:old`);
  await w.caches.open(`${prefix}data`);
  await w.caches.open("other-app:shell:old");
  await w.dispatch("activate");
  assert.equal(w.claimed, true);
  assert.ok(!w.stores.has(`${prefix}shell:old`));
  assert.ok(w.stores.has(`${prefix}data`));
  assert.ok(w.stores.has("other-app:shell:old"));
});

test("a new version waits until the page asks it to take over", async () => {
  const w = worker();
  await w.dispatch("install");
  w.handlers.get("message")({ data: "other" });
  assert.equal(w.skipped, false);
  w.handlers.get("message")({ data: "activate" });
  assert.equal(w.skipped, true);
});

test("offline navigation and shell resources use one complete app version", async () => {
  const w = worker();
  await w.dispatch("install");
  const page = await w.dispatch("fetch", { ...w.request("./"), url: scope, method: "GET", mode: "navigate", headers: new Headers() });
  assert.match(await page.text(), /<title>Audiolibros<\/title>/);
  const script = await w.dispatch("fetch", w.request("app.js?test=1"));
  assert.match(await script.text(), /updateInstallButton/);
});

test("chapter data uses the network, with an offline fallback", async () => {
  const w = worker();
  w.context.fetch = async () => Response.json({ chapter: 1 });
  const request = w.request("books/hp1/01.json");
  assert.deepEqual(await (await w.dispatch("fetch", request)).json(), { chapter: 1 });
  w.context.fetch = async () => { throw new TypeError("Offline"); };
  assert.deepEqual(await (await w.dispatch("fetch", request)).json(), { chapter: 1 });
  assert.equal((await w.dispatch("fetch", w.request("books/hp1/02.json"))).status, 503);
});

test("the app still loads online after the browser removes its cached shell", async () => {
  const w = worker();
  w.context.fetch = async () => new Response("Fresh app");
  const response = await w.dispatch("fetch", w.request("app.js"));
  assert.equal(await response.text(), "Fresh app");
});

test("server errors do not replace a saved chapter", async () => {
  const w = worker();
  const request = w.request("books/hp1/01.es.json");
  await (await w.caches.open(`${prefix}data`)).put(request, Response.json({ es: "Hola" }));
  w.context.fetch = async () => new Response("Not found", { status: 404 });
  assert.deepEqual(await (await w.dispatch("fetch", request)).json(), { es: "Hola" });
});

test("a full device cache does not break online reading", async () => {
  const w = worker();
  const open = w.caches.open.bind(w.caches);
  w.caches.open = async (name) => ({ ...await open(name), async put() { throw new Error("QuotaExceededError"); } });
  w.context.fetch = async () => Response.json({ fresh: true });
  const response = await w.dispatch("fetch", w.request("books/hp1/01.json"));
  assert.deepEqual(await response.json(), { fresh: true });
});

test("unavailable cache storage does not break online reading", async () => {
  const w = worker();
  w.caches.open = async () => { throw new Error("SecurityError"); };
  w.context.fetch = async () => Response.json({ fresh: true });
  assert.deepEqual(await (await w.dispatch("fetch", w.request("books/hp1/01.json"))).json(), { fresh: true });
});

test("audio, ranges, non-GET requests, and other apps bypass the worker", async () => {
  const w = worker();
  for (const request of [
    w.request("books/hp1/01.mp3"),
    w.request("books/hp1/01.json", { headers: { Range: "bytes=0-99" } }),
    w.request("library.json", { method: "POST" }),
    new Request("https://example.test/another-app/library.json"),
    new Request("https://other.test/audiobook/library.json"),
]) assert.equal(await w.dispatch("fetch", request), undefined);
});

const installSource = (await readFile(new URL("pwa.js", site), "utf8")).replace("export function", "function");
function installUI({ ios = false, installed = false } = {}) {
  const listeners = new Map();
  const button = { hidden: true };
  let dialogOpened = false;
  const context = vm.createContext({
    matchMedia: () => ({ matches: installed, addEventListener() {} }),
    navigator: { userAgent: ios ? "iPhone" : "Chrome", platform: "", maxTouchPoints: 0 },
    document: { getElementById: (id) => id === "install-app" ? button : { showModal() { dialogOpened = true; } } },
    window: { addEventListener: (name, callback) => listeners.set(name, callback) },
  });
  vm.runInContext(installSource, context);
  context.updateInstallButton();
  return { button, listeners, get dialogOpened() { return dialogOpened; } };
}

test("Chrome shows installation only when its native prompt is ready", async () => {
  const ui = installUI();
  assert.equal(ui.button.hidden, true);
  let prompted = false, prevented = false;
  ui.listeners.get("beforeinstallprompt")({
    preventDefault() { prevented = true; },
    async prompt() { prompted = true; },
    userChoice: Promise.resolve({ outcome: "accepted" }),
  });
  assert.equal(prevented, true);
  assert.equal(ui.button.hidden, false);
  await ui.button.onclick();
  assert.equal(prompted, true);
  assert.equal(ui.button.hidden, true);
});

test("iPhone installation opens the Safari instructions", async () => {
  const ui = installUI({ ios: true });
  assert.equal(ui.button.hidden, false);
  await ui.button.onclick();
  assert.equal(ui.dialogOpened, true);
});

test("installed apps do not show an install button", () => {
  assert.equal(installUI({ ios: true, installed: true }).button.hidden, true);
});

test("a cancelled native prompt does not cause an uncaught error", async () => {
  const ui = installUI();
  ui.listeners.get("beforeinstallprompt")({ preventDefault() {}, async prompt() { throw new Error("Cancelled"); } });
  await ui.button.onclick();
  assert.equal(ui.button.hidden, true);
  assert.equal(ui.button.disabled, false);
});
