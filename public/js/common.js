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
  if (!instruments) {
    const [ins, bible] = await Promise.all([getJson("/data/instruments.json"), getJson("/data/bible.json").catch(() => [])]);
    instruments = [...ins, ...(bible || []).map((b) => ({ ...b, kind: "bible", family: "Bible", familyKo: "성경 인물" }))];
  }
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
  if (ins && ins.kind === "bible") {
    el.dataset.family = "bible";
    el.style.backgroundImage = "url(/img/bible-avatars.png)";
    el.style.backgroundPosition = `${(ins.col / 3) * 100}% ${(ins.row / 2) * 100}%`;
  } else el.textContent = ins ? ins.abbr : "?";
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
    if (slide.interaction.categories) out.interaction.categories = slide.interaction.categories.map((c) => ({ ...c, label: (ki.categories && ki.categories[c.id]) || c.label }));
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

// ---------- Credit card payoff ----------
// Simulates month by month. Minimum payment = 1% of balance + that month's interest, at least $25.
export function cardPayoff(balance, aprPct, payment) {
  const r = Math.max(0, aprPct) / 100 / 12;
  let bal = Math.max(0, balance), months = 0, interest = 0;
  while (bal > 0.005 && months < 1200) {
    const i = bal * r;
    const pay = payment == null ? Math.max(25, bal * 0.01 + i) : payment;
    if (pay <= i) return { months: Infinity, interest: Infinity };
    interest += i; bal = bal + i - pay; months++;
  }
  return { months, interest };
}

export function calculator(t) {
  const money = (n) => (isFinite(n) ? "$" + Math.round(n).toLocaleString("en-US") : "—");
  const dur = (m) => !isFinite(m) ? t("Never (payment too small)", "갚을 수 없음 (납부액이 너무 적음)")
    : m >= 24 ? t(`${(m / 12).toFixed(1)} years`, `${(m / 12).toFixed(1)}년`) : t(`${m} months`, `${m}개월`);
  const field = (label, val, step) => {
    const input = h("input", { class: "input", type: "number", inputmode: "decimal", min: "0", step, value: String(val) });
    return [h("label", { class: "field" }, h("span", { text: label }), input), input];
  };
  const [fb, bal] = field(t("Card balance ($)", "카드 잔액 ($)"), 5000, "100");
  const [fa, apr] = field(t("Interest rate (APR %)", "연 이자율 (APR %)"), 24, "0.1");
  const [fp, pay] = field(t("What I can pay each month ($)", "매달 갚을 수 있는 금액 ($)"), 300, "10");
  const out = h("div", { class: "calc-out" });
  const run = () => {
    const b = +bal.value || 0, a = +apr.value || 0, p = +pay.value || 0;
    const mn = cardPayoff(b, a, null), fx = cardPayoff(b, a, p);
    out.replaceChildren(
      h("div", { class: "calc-row" }, h("span", { text: t("Minimum payments only", "최소 납부액만") }), h("b", { text: dur(mn.months) }), h("small", { text: t(`Interest ${money(mn.interest)}`, `이자 ${money(mn.interest)}`) })),
      h("div", { class: "calc-row strong" }, h("span", { text: t(`Paying ${money(p)} a month`, `매달 ${money(p)}씩`) }), h("b", { text: dur(fx.months) }), h("small", { text: t(`Interest ${money(fx.interest)}`, `이자 ${money(fx.interest)}`) })));
  };
  [bal, apr, pay].forEach((i) => i.addEventListener("input", run));
  run();
  return h("div", { class: "calc" }, h("div", { class: "calc-in" }, fb, fa, fp), out,
    h("p", { class: "calc-note", text: t("Minimum payment assumed: 1% of the balance plus interest, at least $25. Your card may differ.", "최소 납부액 가정: 잔액의 1% + 이자, 최소 $25. 카드사마다 다를 수 있어요.") }));
}

// ---------- Compound growth (retirement) ----------
export function futureValue(monthly, annualPct, years) {
  const r = annualPct / 100 / 12, n = Math.max(0, Math.round(years * 12));
  return r === 0 ? monthly * n : monthly * ((Math.pow(1 + r, n) - 1) / r);
}

export function compoundCalc(t) {
  const money = (n) => "$" + Math.round(n).toLocaleString("en-US");
  const field = (label, val, step) => {
    const input = h("input", { class: "input", type: "number", inputmode: "decimal", min: "0", step, value: String(val) });
    return [h("label", { class: "field" }, h("span", { text: label }), input), input];
  };
  const [f1, monthly] = field(t("Save each month ($)", "매달 저축 ($)"), 300, "50");
  const [f2, start] = field(t("Start age", "시작 나이"), 25, "1");
  const [f3, retire] = field(t("Retire at", "은퇴 나이"), 65, "1");
  const [f4, rate] = field(t("Yearly return (%)", "연 수익률 (%)"), 6, "0.5");
  const out = h("div", { class: "calc-out" });
  const run = () => {
    const m = +monthly.value || 0, s = +start.value || 0, rt = +retire.value || 0, r = +rate.value || 0;
    const yrs = Math.max(0, rt - s), late = Math.max(0, yrs - 10);
    const fv = futureValue(m, r, yrs), fvLate = futureValue(m, r, late);
    out.replaceChildren(
      h("div", { class: "calc-row strong" }, h("span", { text: t(`Start at ${s} · ${yrs} years`, `${s}세 시작 · ${yrs}년`) }), h("b", { text: money(fv) }),
        h("small", { text: t(`You put in ${money(m * yrs * 12)}; growth adds ${money(fv - m * yrs * 12)}`, `넣은 돈 ${money(m * yrs * 12)} · 불어난 돈 ${money(fv - m * yrs * 12)}`) })),
      h("div", { class: "calc-row" }, h("span", { text: t(`Start 10 years later (${s + 10}) · ${late} years`, `10년 늦게 시작 (${s + 10}세) · ${late}년`) }), h("b", { text: money(fvLate) }),
        h("small", { text: t(`You put in ${money(m * late * 12)}`, `넣은 돈 ${money(m * late * 12)}`) })));
  };
  [monthly, start, retire, rate].forEach((i) => i.addEventListener("input", run));
  run();
  return h("div", { class: "calc" }, h("div", { class: "calc-in", style: "grid-template-columns:repeat(4,minmax(0,1fr))" }, f1, f2, f3, f4), out,
    h("p", { class: "calc-note", text: t("Example only: assumes the same monthly amount and a steady yearly return, before taxes and inflation.", "예시일 뿐이에요: 매달 같은 금액, 일정한 수익률을 가정하며 세금과 인플레이션은 빼고 계산했어요.") }));
}
