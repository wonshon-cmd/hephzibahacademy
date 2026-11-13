// Builds a standalone, offline slide deck (one HTML file) for a lecture.
// It reuses the live presenter code in preview mode — no server, no audience.
//
//   node tools/build-slides.mjs [lectureId] [output.html]
//   node tools/build-slides.mjs my-user-manual dist/my-user-manual-slides.html

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const PUB = path.join(ROOT, "public");
const lectureId = process.argv[2] || "my-user-manual";
const out = path.resolve(process.argv[3] || path.join(ROOT, "dist", `${lectureId}-slides.html`));
const read = (p) => fs.readFileSync(path.join(PUB, p), "utf8");

const deck = JSON.parse(read(`data/${lectureId}.json`));
// Private photos ("src": "private:…") are embedded only for the encrypted static decks
// (INCLUDE_PRIVATE=1 with ADMIN_PASSCODE). Otherwise the slide shows its placeholder instead.
{
  const { decryptPrivate } = await import("./private-assets.mjs");
  const include = process.env.INCLUDE_PRIVATE === "1" && process.env.ADMIN_PASSCODE;
  const fix = (ph) => {
    if (!ph || !String(ph.src || "").startsWith("private:")) return;
    const name = ph.src.slice(8);
    if (include) ph.src = `data:image/${name.endsWith(".png") ? "png" : name.endsWith(".webp") ? "webp" : "jpeg"};base64,` + decryptPrivate(name, process.env.ADMIN_PASSCODE).toString("base64");
    else delete ph.src;
  };
  for (const s of deck.slides) { fix(s.photo); fix(s.ko && s.ko.photo); }
}
const instruments = JSON.parse(read("data/instruments.json"));
const bible = JSON.parse(read("data/bible.json"));
const DATA = { [`/data/${lectureId}.json`]: deck, "/data/instruments.json": instruments, "/data/bible.json": bible, "/api/config": {} };

function must(src, a, b) {
  if (!src.includes(a)) throw new Error(`build-slides: expected text not found: ${a.slice(0, 60)}`);
  return src.replace(a, b);
}

let common = read("js/common.js");
common = must(common, "export const getJson = (url) => fetch(url).then((r) => r.json());", "const getJson = (url) => Promise.resolve(__DATA[url]);");
common = common.replace(/^export /gm, "");

let orchestra = read("js/orchestra.js").replace(/^export /gm, "");
// Offline: no server to list recordings, so always use the built-in synthesizer.
orchestra = must(orchestra, 'const files = await fetch("/api/audio").then((r) => r.json());', "const files = [];");

let present = read("js/present.js");
present = present.replace(/^import .*$/gm, "");
// Offline: the deck is embedded, so there is no locked fetch to handle.
present = must(present, "  const deckRes = await fetch(`/data/${lectureId}.json`);\n  if (deckRes.status === 403) return showLock();\n  [deck, instruments] = await Promise.all([deckRes.json(), loadInstruments()]);",
  "  [deck, instruments] = await Promise.all([getJson(`/data/${lectureId}.json`), loadInstruments()]);");
// common.js also has a module-level `instruments`; rename the presenter's copy to avoid a clash.
present = present.replace(/\binstruments\b/g, "__pins");
present = must(present, 'const preview = params.has("preview");', "const preview = true;");
// DEMO=1: a pretend class joins and answers on each slide (for introducing the lecture).
const DEMO = process.env.DEMO === "1";
if (DEMO) present = must(present, 'const demo = params.has("demo");', "const demo = true;");
present = must(present, 'const lectureId = params.get("lecture") || "my-user-manual";', `const lectureId = ${JSON.stringify(lectureId)};`);
present = must(present, '`<span class="muted">${t("Preview — no audience connected", "미리보기 · 청중 연결 없음")}</span>`',
  '`<span class="muted">${t("Arrow keys to move · N for notes · F for fullscreen", "화살표로 이동 · N 노트 · F 전체 화면")}</span>`');
present = must(present, 'href="/lectures/${lectureId}" title="${t("Exit", "나가기")}"', 'href="#" title="Hephzibah Academy"');

const css = read("css/site.css") + "\n" + read("css/live.css");
const title = `${deck.title} · Hephzibah Academy`;
const favicon = "data:image/svg+xml," + encodeURIComponent(read("favicon.svg").trim());

const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${title}</title>
<link rel="icon" href="${favicon}">
<link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&family=Noto+Sans+KR:wght@400;500;700;800&display=swap" rel="stylesheet">
<style>
${css}
</style>
</head>
<body>
<div id="app"></div>
${DEMO ? `<script>${read("js/qr.js")}</script>` : ""}
<script type="module">
const __DATA = ${JSON.stringify(DATA)};
${common}
${orchestra}
${present}
</script>
</body>
</html>
`;

fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, html);
console.log(`Wrote ${path.relative(process.cwd(), out)} (${(html.length / 1024).toFixed(0)} KB, ${deck.slides.length} slides)`);
