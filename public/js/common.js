// Shared helpers for the presenter and audience screens.

export async function api(path, body) {
  const res = await fetch(path, body === undefined ? {} : {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = new Error((data.error && data.error.message) || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return data;
}

export const getJson = (url) => fetch(url).then((r) => r.json());

let instruments = null;
export async function loadInstruments() {
  instruments ||= await getJson("/data/instruments.json");
  return instruments;
}
export const instrumentById = (id) => (instruments || []).find((i) => i.id === id);

// Round "badge" for an instrument: score abbreviation (Vn, Ob, Hn…) tinted by family.
export function avatar(id, size = 44) {
  const ins = instrumentById(id);
  const el = document.createElement("span");
  el.className = "avatar";
  el.dataset.family = ins ? ins.family.toLowerCase() : "";
  el.style.setProperty("--size", size + "px");
  el.textContent = ins ? ins.abbr : "?";
  el.setAttribute("aria-hidden", "true");
  return el;
}

export function h(tag, attrs = {}, ...children) {
  const el = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs)) {
    if (v == null || v === false) continue;
    if (k === "class") el.className = v;
    else if (k.startsWith("on")) el.addEventListener(k.slice(2), v);
    else if (k === "text") el.textContent = v;
    else el.setAttribute(k, v === true ? "" : v);
  }
  for (const c of children.flat()) if (c != null && c !== false) el.append(c instanceof Node ? c : document.createTextNode(String(c)));
  return el;
}

// Multi-line title text ("\n") → spans with <br>, safely.
export function lines(text) {
  const frag = document.createDocumentFragment();
  String(text).split("\n").forEach((line, i) => { if (i) frag.append(document.createElement("br")); frag.append(line); });
  return frag;
}

export const store = {
  get(k, d = null) { try { const v = localStorage.getItem(k); return v == null ? d : JSON.parse(v); } catch { return d; } },
  set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch {} },
  del(k) { try { localStorage.removeItem(k); } catch {} },
};

// Score the 20-question self-reflection. Answers: -1, 0, 1, or null (skipped).
export function scorePersonality(data, answers) {
  const out = {};
  for (const dim of data.dimensions) {
    const items = data.items.filter((it) => it.dimension === dim.id);
    const vals = items.map((it) => answers[it.id]).map((v, i) => (v == null ? null : items[i].reverse ? -v : v)).filter((v) => v != null);
    if (vals.length < 2) { out[dim.id] = null; continue; }
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    out[dim.id] = mean < -0.25 ? "low" : mean > 0.25 ? "high" : "mid";
  }
  return out;
}

// ---------- Language (English / 한국어) ----------
let memLang = null;
export function getLang() {
  if (memLang) return memLang;
  try { return localStorage.getItem("hz-lang") === "ko" ? "ko" : "en"; } catch { return "en"; }
}
export function setLang(v) { memLang = v; try { localStorage.setItem("hz-lang", v); } catch {} document.documentElement.lang = v; }
export const t = (en, ko) => (getLang() === "ko" ? ko : en);

// Slide in the current language (Korean fields live under slide.ko).
export function tr(slide) {
  if (getLang() !== "ko" || !slide.ko) return slide;
  const k = slide.ko;
  const out = { ...slide, ...k };
  delete out.ko;
  if (slide.interaction) {
    const ki = k.interaction || {};
    out.interaction = { ...slide.interaction, ...ki };
    if (slide.interaction.options) out.interaction.options = slide.interaction.options.map((o) => ({ ...o, label: (ki.options && ki.options[o.value]) || o.label }));
    if (slide.interaction.fields) out.interaction.fields = slide.interaction.fields.map((f) => ({ ...f, ...((ki.fields && ki.fields[f.id]) || {}) }));
  }
  return out;
}

// Instrument name / alias in the current language ("Cello 2" → "첼로 2").
export function insName(id) { const i = instrumentById(id); return i ? t(i.name, i.ko) : ""; }
export function insFamily(id) { const i = instrumentById(id); return i ? t(i.family, i.familyKo) : ""; }
export function aliasText(alias, id) {
  const i = instrumentById(id);
  return i && alias ? alias.replace(i.name, t(i.name, i.ko)) : alias || t("Guest", "손님");
}
