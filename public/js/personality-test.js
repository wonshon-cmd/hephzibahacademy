// Standalone "My User Manual" personality test: 20 questions, results on the spot.
// Answers stay in this browser (localStorage); nothing is sent to a server.
(function () {
  const root = document.getElementById("pt");
  const KEY = "hz-personality-test";
  let data = null;
  let st = load() || { i: 0, answers: {}, started: false };

  const lang = () => (window.hzLang && window.hzLang()) || "en";
  const t = (en, ko) => (lang() === "ko" ? ko : en);
  function load() { try { return JSON.parse(localStorage.getItem(KEY)); } catch { return null; } }
  function save() { try { localStorage.setItem(KEY, JSON.stringify(st)); } catch {} }
  function el(tag, attrs, ...kids) {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs || {})) {
      if (v == null || v === false) continue;
      if (k === "class") n.className = v; else if (k === "text") n.textContent = v;
      else if (k.startsWith("on")) n.addEventListener(k.slice(2), v); else n.setAttribute(k, v);
    }
    for (const c of kids.flat()) if (c != null && c !== false) n.append(c instanceof Node ? c : document.createTextNode(String(c)));
    return n;
  }

  // Data in the current language
  function P() {
    if (lang() !== "ko") return data;
    const k = data.ko;
    return { ...data, title: k.title, subtitle: k.subtitle, instructions: k.instructions, note: k.note,
      choices: data.choices.map((c, i) => ({ ...c, label: k.choices[i] })),
      items: data.items.map((it) => ({ ...it, text: it.ko })),
      dimensions: data.dimensions.map((d) => ({ ...d, ...d.ko, low: { ...d.low, ...d.low.ko }, mid: { ...d.mid, ...d.mid.ko }, high: { ...d.high, ...d.high.ko } })) };
  }
  function score() {
    const out = {};
    for (const dim of data.dimensions) {
      const items = data.items.filter((it) => it.dimension === dim.id);
      const vals = items.map((it) => st.answers[it.id]).map((v, i) => (v == null ? null : items[i].reverse ? -v : v)).filter((v) => v != null);
      if (vals.length < 2) { out[dim.id] = null; continue; }
      const m = vals.reduce((a, b) => a + b, 0) / vals.length;
      out[dim.id] = m < -0.25 ? "low" : m > 0.25 ? "high" : "mid";
    }
    return out;
  }

  function render() {
    if (!data) return;
    const p = P();
    root.replaceChildren();
    if (!st.started) return intro(p);
    if (st.i >= p.items.length) return results(p);
    card(p);
  }

  function intro(p) {
    root.append(
      el("ul", { class: "pt-list" }, p.instructions.map((s) => el("li", { text: s }))),
      el("p", { class: "pt-note", text: p.note }),
      el("button", { class: "btn", type: "button", onclick: () => { st.started = true; save(); render(); } }, t("Start the 20 questions", "질문 20개 시작하기")));
  }

  function card(p) {
    const item = p.items[st.i], cur = st.answers[item.id];
    const c = el("div", { class: "qcard", tabindex: "0" },
      el("span", { class: "stamp no", text: t("NOT REALLY", "아니에요") }), el("span", { class: "stamp yes", text: t("THAT’S ME", "그래요") }),
      el("div", { class: "qn", text: `${String(st.i + 1).padStart(2, "0")} / ${p.items.length}` }),
      el("div", { class: "qt", text: item.text }),
      el("div", { class: "hint" }, el("span", { text: t("← Not really", "← 아니에요") }), el("span", { text: t("That’s me →", "그래요 →") })));
    root.append(
      el("div", { class: "pt-progress" }, el("i", { style: `width:${(st.i / p.items.length) * 100}%` })),
      el("div", { class: "pt-stage" }, c),
      el("div", { class: "quiz-actions" }, p.choices.map((ch) => el("button", { type: "button", class: cur === ch.value ? "sel" : "", onclick: () => answer(ch.value) }, ch.label))),
      el("div", { class: "quiz-sub" },
        el("button", { type: "button", disabled: st.i === 0, onclick: () => { st.i = Math.max(0, st.i - 1); save(); render(); } }, t("← Previous", "← 이전 질문")),
        el("button", { type: "button", onclick: () => answer(null) }, t("Skip this one", "이 질문은 넘길게요"))));
    // swipe
    let x0 = null, dx = 0;
    const yes = c.querySelector(".stamp.yes"), no = c.querySelector(".stamp.no");
    c.addEventListener("pointerdown", (e) => { x0 = e.clientX; dx = 0; c.setPointerCapture(e.pointerId); c.style.transition = "none"; });
    c.addEventListener("pointermove", (e) => { if (x0 == null) return; dx = e.clientX - x0; c.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`; yes.style.opacity = Math.max(0, Math.min(1, dx / 90)); no.style.opacity = Math.max(0, Math.min(1, -dx / 90)); });
    const end = () => { if (x0 == null) return; x0 = null; c.style.transition = "transform .25s ease";
      if (Math.abs(dx) > 90) { c.style.transform = `translateX(${dx > 0 ? 600 : -600}px) rotate(${dx / 10}deg)`; setTimeout(() => answer(dx > 0 ? 1 : -1), 180); }
      else { c.style.transform = ""; yes.style.opacity = 0; no.style.opacity = 0; } };
    c.addEventListener("pointerup", end); c.addEventListener("pointercancel", end);
    c.addEventListener("keydown", (e) => { if (e.key === "ArrowRight") answer(1); else if (e.key === "ArrowLeft") answer(-1); else if (e.key === "ArrowDown") answer(0); });
    c.focus({ preventScroll: true });
  }

  function answer(v) { st.answers[P().items[st.i].id] = v; st.i++; save(); render(); }

  function results(p) {
    const r = score();
    const box = el("div", { class: "pt-results" });
    for (const dim of p.dimensions) {
      const lvl = r[dim.id], c = lvl && dim[lvl], pos = { low: 12, mid: 50, high: 88 }[lvl];
      box.append(el("div", { class: "result" },
        el("div", { class: "dim", text: dim.name }),
        el("h4", { text: c ? c.title : t("Still getting to know this", "조금 더 알아가는 중") }),
        el("p", { text: c ? c.summary : t("You answered fewer than two questions here — that’s okay.", "이 영역은 답이 적어요. 괜찮아요.") }),
        el("div", { class: "scale-bar" }, pos != null ? el("i", { style: `left:${pos}%` }) : null),
        el("div", { class: "scale" }, el("span", { text: dim.leftLabel }), el("span", { text: dim.rightLabel })),
        c ? el("dl", {},
          el("dt", { text: t("Strength", "강점") }), el("dd", { text: c.strength }),
          el("dt", { text: t("Where you might get stuck", "막힐 수 있는 때") }), el("dd", { text: c.challenge }),
          el("dt", { text: t("Grow it", "강점을 키우는 방법") }), el("dd", { text: c.grow }),
          el("dt", { text: t("Try this", "도움이 되는 작은 연습") }), el("dd", { text: c.practice })) : null));
    }
    root.append(
      el("h2", { class: "h3", text: t("Your user manual, so far", "지금까지의 나의 사용설명서") }),
      el("p", { class: "pt-note", text: t("No answer is better than another. Keep what fits you — leave what doesn’t.", "더 좋은 답은 없어요. 나와 맞는 것은 가져가고, 맞지 않는 것은 두고 가요.") }),
      box,
      el("p", { class: "pt-note", text: p.note }),
      el("div", { class: "pt-actions" },
        el("button", { class: "btn ghost", type: "button", onclick: () => { st.i = 0; save(); render(); } }, t("Review my answers", "내 답 다시 보기")),
        el("button", { class: "btn ghost", type: "button", onclick: () => { st = { i: 0, answers: {}, started: true }; save(); render(); } }, t("Start over", "처음부터 다시"))));
  }

  document.addEventListener("hz-langchange", render);
  const inline = window.__PERSONALITY;
  (inline ? Promise.resolve(inline) : fetch("/data/personality.json").then((r) => r.json())).then((d) => { data = d; render(); });
})();
