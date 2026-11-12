import { api, getJson, loadInstruments, instrumentById, avatar, h, lines, store, scorePersonality } from "./common.js";

const app = document.getElementById("app");
const params = new URLSearchParams(location.search);
let code = (params.get("code") || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
let deck, personality, me, room = null, es = null;
let shownSlide = null;

const key = () => `hephzibah-join-${code}`;
const save = () => store.set(key(), me);

function toast(text) {
  const t = h("div", { class: "toast", role: "status", text });
  document.body.append(t); setTimeout(() => t.remove(), 3500);
}

// ---------------- Enter code ----------------
function showCodeForm(error = "") {
  app.replaceChildren(
    h("main", { class: "phone-main", style: "padding-top:10vh" },
      h("p", { class: "eyebrow", text: "Hephzibah Academy" }),
      h("h1", { class: "phone-title", style: "font-size:40px" }, "Join the lecture"),
      h("p", { class: "phone-sub", text: "Enter the code on the big screen. No sign-up, no real name — you’ll join as an orchestra instrument." }),
      (() => {
        const f = h("form", {},
          h("label", { class: "field" }, h("span", { text: "Room code" }),
            h("input", { class: "input", name: "code", value: code, autocomplete: "off", autocapitalize: "characters", maxlength: "8", required: true, style: "font-size:28px;letter-spacing:.3em;text-transform:uppercase;font-weight:800;text-align:center" })),
          h("button", { class: "btn full", type: "submit", style: "width:100%" }, "Join"),
          h("p", { class: "error", role: "alert", text: error }));
        f.onsubmit = (e) => { e.preventDefault(); code = f.code.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); history.replaceState(null, "", `/join?code=${code}`); join(); };
        return f;
      })()));
}

// ---------------- Join & instrument reveal ----------------
async function join(reroll = false) {
  try {
    room = await api(`/api/rooms/${code}`);
    deck = await getJson(`/data/${room.lectureId}.json`);
    me = store.get(key()) || { answers: {}, quizIndex: 0, sent: {}, votes: {}, worksheet: {} };
    const r = await api(`/api/rooms/${code}/join`, { token: me.token, reroll });
    Object.assign(me, { token: r.token, alias: r.alias, avatarId: r.avatarId });
    save();
    if (!me.confirmed) return showReveal();
    startLive();
  } catch (err) {
    if (err.status === 401 || err.status === 404) store.del(key());
    showCodeForm(err.message);
  }
}

function showReveal() {
  const ins = instrumentById(me.avatarId);
  app.replaceChildren(h("main", { class: "phone-main" },
    h("div", { class: "reveal" },
      h("p", { class: "eyebrow", text: "In today’s orchestra, you are the" }),
      avatar(me.avatarId, 120),
      h("h1", { text: me.alias }),
      h("p", { class: "muted", text: ins ? ins.family : "" }),
      h("p", { class: "phone-sub", style: "margin-top:18px", text: "This is the only name shown on the big screen." })),
    h("div", { class: "stack" },
      h("button", { class: "btn", type: "button", onclick: () => { me.confirmed = true; save(); startLive(); } }, "That’s me — let’s go"),
      h("button", { class: "btn ghost", type: "button", onclick: () => join(true) }, "Try another instrument"))));
}

// ---------------- Live ----------------
function startLive() {
  app.replaceChildren(
    h("header", { class: "phone-head" },
      h("span", { class: "me" }, avatar(me.avatarId, 34), h("span", { id: "alias", text: me.alias })),
      h("span", { class: "code", text: code })),
    h("main", { class: "phone-main", id: "main" }),
    quizShell());
  connect();
}

function connect() {
  es && es.close();
  es = new EventSource(`/api/rooms/${code}/stream?token=${encodeURIComponent(me.token)}`);
  es.onmessage = (ev) => {
    room = JSON.parse(ev.data);
    const k = `${room.slideId}|${room.ended}`;
    if (k !== shownSlide) { shownSlide = k; render(); }
  };
  es.onerror = () => {
    api(`/api/rooms/${code}`).catch((err) => { if (err.status === 404) { es.close(); renderEnded(true); } });
  };
}

const currentSlide = () => deck.slides[room.slideIndex];

function render() {
  const main = document.getElementById("main");
  if (!main) return;
  const slide = currentSlide();
  const ix = slide.interaction;
  const reviewIdx = deck.slides.findIndex((s) => s.kind === "review");
  main.replaceChildren();

  if (room.ended && !(ix && ix.type === "review")) return renderEnded(false);

  if (slide.kind !== "review") {
    main.append(h("p", { class: "eyebrow", text: `${room.slideIndex + 1} / ${deck.slides.length} · ${slide.eyebrow}` }),
      h("h1", { class: "phone-title" }, lines(slide.title)),
      slide.subtitle ? h("p", { class: "phone-sub", text: slide.subtitle }) : null);
  }

  if (ix && ix.type === "choice") main.append(choicePanel(slide));
  else if (ix && ix.type === "text") main.append(textPanel(slide));
  else if (ix && ix.type === "private") main.append(worksheetPanel(slide));
  else if (ix && ix.type === "review") main.append(reviewFlow(slide));
  else if (slide.kind === "orchestra") main.append(h("div", { class: "panel" }, h("h3", {}, `Listen for the ${me.alias.replace(/ \d+$/, "")}!`),
    h("p", { text: "The presenter will play each instrument alone — then all together. Your instrument has its own part." })));
  else if (slide.kind === "video") main.append(h("div", { class: "panel" }, h("h3", { text: "Watch the big screen" }),
    h("p", { text: "Listen to how one oboe carries the melody — and how every other instrument holds it up." })));
  else main.append(h("div", { class: "panel" }, h("p", { style: "margin:0", text: "Follow along on the big screen. Questions will pop up here." })));

  if (slide.kind !== "review") {
    if (!me.quizDone && room.slideIndex < reviewIdx) main.append(quizInvite());
    if (!(ix && ix.channel === "qa")) main.append(askPanel());
  }
}

function renderEnded(gone) {
  const main = document.getElementById("main");
  main.replaceChildren(h("p", { class: "eyebrow", text: "Thank you" }), h("h1", { class: "phone-title", text: "This session has ended." }),
    h("p", { class: "phone-sub", text: gone ? "The room is closed." : "Thanks for taking part!" }));
  if (me.worksheet && Object.values(me.worksheet).some(Boolean)) main.append(h("button", { class: "btn ghost", onclick: downloadRecord }, "Download my notes"));
}

// ---- Poll
function choicePanel(slide) {
  const ix = slide.interaction;
  const box = h("div", { class: "stack" });
  const paint = () => box.querySelectorAll(".choice").forEach((b) => b.setAttribute("aria-pressed", String(me.votes[slide.id] === b.dataset.value)));
  for (const o of ix.options) {
    box.append(h("button", { class: "choice", type: "button", "data-value": o.value, onclick: async () => {
      const prev = me.votes[slide.id];
      me.votes[slide.id] = o.value; paint();
      try { await api(`/api/rooms/${code}/vote`, { token: me.token, slideId: slide.id, value: o.value }); save(); }
      catch (err) { me.votes[slide.id] = prev; paint(); toast(err.message); }
    } }, o.label));
  }
  paint();
  return h("div", {}, box, h("p", { class: "muted", style: "font-size:14px;margin-top:12px", text: "Only totals are shown on screen. You can change your answer." }));
}

// ---- Free text to the wall
function textPanel(slide) {
  const ix = slide.interaction;
  const channel = ix.channel === "qa" ? "qa" : "slide";
  const listKey = channel === "qa" ? "qa" : slide.id;
  const ta = h("textarea", { class: "input", maxlength: String(ix.maxLength || 180), placeholder: ix.placeholder || "", rows: "3", "aria-label": ix.prompt });
  const left = h("span", { class: "muted", style: "font-size:13px" });
  const upd = () => (left.textContent = `${ta.value.length}/${ix.maxLength || 180}`);
  ta.oninput = upd; upd();
  const list = h("ul", { class: "sent" });
  const paint = () => list.replaceChildren(...(me.sent[listKey] || []).map((s) => h("li", {}, s.text, h("small", { text: s.status === "pending" ? "Sent · waiting for the presenter to show it" : "Sent · on the screen" }))));
  paint();
  const btn = h("button", { class: "btn", type: "submit" }, "Send");
  const form = h("form", { class: "panel" },
    h("h3", { text: ix.prompt }),
    h("p", { text: channel === "qa" ? "Your question appears with your instrument name, not your real name." : "Your answer appears on the big screen with your instrument name — never your real name." }),
    ta, h("div", { style: "display:flex;justify-content:space-between;align-items:center;margin-top:10px" }, left, btn), list);
  form.onsubmit = async (e) => {
    e.preventDefault();
    const text = ta.value.trim(); if (!text) return;
    btn.disabled = true;
    try {
      const r = await api(`/api/rooms/${code}/message`, { token: me.token, slideId: slide.id, channel, text });
      (me.sent[listKey] ||= []).push({ text, status: r.status }); save();
      ta.value = ""; upd(); paint();
    } catch (err) { toast(err.message); }
    btn.disabled = false;
  };
  return form;
}

// ---- Ask the speaker anytime
function askPanel() {
  const d = h("details", { class: "panel" }, h("summary", { style: "font-weight:700;cursor:pointer" }, "Ask the speaker a question"));
  const ta = h("textarea", { class: "input", maxlength: "200", rows: "2", placeholder: "Your question…", style: "margin-top:12px" });
  const b = h("button", { class: "btn small", type: "button", style: "margin-top:10px", onclick: async () => {
    const text = ta.value.trim(); if (!text) return;
    try { await api(`/api/rooms/${code}/message`, { token: me.token, slideId: "qa", channel: "qa", text }); ta.value = ""; toast("Sent! The speaker will see it."); }
    catch (err) { toast(err.message); }
  } }, "Send question");
  d.append(ta, b);
  return d;
}

// ---- Private worksheet
function worksheetPanel(slide) {
  const ix = slide.interaction;
  const box = h("div", { class: "panel" }, h("h3", { text: ix.prompt }), h("p", { text: "🔒 " + ix.privacy }));
  for (const f of ix.fields) {
    const ta = h("textarea", { class: "input", rows: "3", maxlength: "300", placeholder: f.placeholder });
    ta.value = me.worksheet[f.id] || "";
    ta.oninput = () => { me.worksheet[f.id] = ta.value; save(); };
    box.append(h("label", { class: "field" }, h("span", { text: f.label }), ta));
  }
  box.append(h("button", { class: "btn ghost small", type: "button", onclick: downloadRecord }, "Download my page"));
  return box;
}

function downloadRecord() {
  const ws = deck.slides.find((s) => s.interaction && s.interaction.type === "private");
  const out = [`My User Manual · Page One`, `Hephzibah Academy · ${new Date().toLocaleDateString()}`, ""];
  for (const f of ws.interaction.fields) out.push(f.label, me.worksheet[f.id] || "—", "");
  if (me.reflection) out.push("How I’ll use my strengths", me.reflection.useStrength || "—", "", "How I’ll work with my weaknesses", me.reflection.useWeakness || "—", "");
  const blob = new Blob([out.join("\n")], { type: "text/plain" });
  const a = h("a", { href: URL.createObjectURL(blob), download: "my-user-manual.txt" });
  document.body.append(a); a.click(); a.remove();
}

// ---------------- 20 questions (swipe) ----------------
function quizInvite() {
  const answered = Object.values(me.answers).filter((v) => v != null).length;
  return h("div", { class: "panel", style: "border-color:var(--ink)" },
    h("h3", { text: personality.title }),
    h("p", { text: answered ? `You’ve answered ${answered} of 20. Your results unlock at the end of the lecture.` : "Swipe through 20 quick questions about yourself (about 5 minutes). Your results unlock at the end of the lecture." }),
    h("button", { class: "btn small", type: "button", onclick: openQuiz }, answered ? "Continue" : "Start"));
}

function quizShell() {
  return h("div", { class: "quiz", id: "quiz", hidden: true, role: "dialog", "aria-modal": "true", "aria-label": personality.title });
}

function openQuiz() {
  const q = document.getElementById("quiz");
  q.hidden = false;
  if (me.quizIndex >= personality.items.length) me.quizIndex = 0;
  if (!me.quizIntroSeen) return quizIntro();
  drawCard();
}

function closeQuiz() { document.getElementById("quiz").hidden = true; render(); }

function quizIntro() {
  const q = document.getElementById("quiz");
  q.replaceChildren(
    h("div", { class: "quiz-top" }, h("span", { text: personality.title }), h("button", { type: "button", onclick: closeQuiz }, "Close")),
    h("div", { class: "quiz-body" }, h("div", { style: "max-width:460px" },
      h("h2", { class: "phone-title", text: personality.subtitle }),
      h("ul", { style: "padding-left:20px;color:var(--ink-2);line-height:1.6" }, personality.instructions.map((t) => h("li", { text: t }))),
      h("p", { class: "muted", style: "font-size:14px", text: "Swipe right for “That’s me”, left for “Not really”, or use the buttons." }),
      h("p", { class: "muted", style: "font-size:13px", text: personality.note }),
      h("button", { class: "btn", type: "button", style: "width:100%;margin-top:12px", onclick: () => { me.quizIntroSeen = true; save(); drawCard(); } }, "Begin"))));
}

function drawCard() {
  const items = personality.items;
  const i = me.quizIndex;
  if (i >= items.length) return finishQuiz();
  const item = items[i];
  const q = document.getElementById("quiz");
  const cur = me.answers[item.id];
  const card = h("div", { class: "qcard", tabindex: "0" },
    h("span", { class: "stamp no", text: "NOT REALLY" }), h("span", { class: "stamp yes", text: "THAT’S ME" }),
    h("div", { class: "qn", text: `${String(i + 1).padStart(2, "0")} / ${items.length}` }),
    h("div", { class: "qt", text: item.text }),
    h("div", { class: "hint" }, h("span", { text: "← Not really" }), h("span", { text: "That’s me →" })));
  q.replaceChildren(
    h("div", { class: "quiz-top" }, h("span", { text: personality.title }), h("button", { type: "button", onclick: closeQuiz }, "Save & close")),
    h("div", { class: "quiz-progress" }, h("i", { style: `width:${(i / items.length) * 100}%` })),
    h("div", { class: "quiz-body" }, card),
    h("div", { class: "quiz-actions" }, personality.choices.map((c) => h("button", { type: "button", class: cur === c.value ? "sel" : "", onclick: () => answer(c.value) }, c.label))),
    h("div", { class: "quiz-sub" },
      h("button", { type: "button", disabled: i === 0, onclick: () => { me.quizIndex = Math.max(0, i - 1); save(); drawCard(); } }, "← Previous"),
      h("button", { type: "button", onclick: () => answer(null) }, "Skip this one")));

  // Swipe gesture
  let x0 = null, dx = 0;
  const yes = card.querySelector(".stamp.yes"), no = card.querySelector(".stamp.no");
  card.addEventListener("pointerdown", (e) => { x0 = e.clientX; dx = 0; card.setPointerCapture(e.pointerId); card.style.transition = "none"; });
  card.addEventListener("pointermove", (e) => {
    if (x0 == null) return;
    dx = e.clientX - x0;
    card.style.transform = `translateX(${dx}px) rotate(${dx / 18}deg)`;
    yes.style.opacity = Math.max(0, Math.min(1, dx / 90)); no.style.opacity = Math.max(0, Math.min(1, -dx / 90));
  });
  const end = () => {
    if (x0 == null) return; x0 = null;
    card.style.transition = "transform .25s ease";
    if (Math.abs(dx) > 90) { card.style.transform = `translateX(${dx > 0 ? 600 : -600}px) rotate(${dx / 10}deg)`; setTimeout(() => answer(dx > 0 ? 1 : -1), 180); }
    else { card.style.transform = ""; yes.style.opacity = 0; no.style.opacity = 0; }
  };
  card.addEventListener("pointerup", end); card.addEventListener("pointercancel", end);
  card.addEventListener("keydown", (e) => {
    if (e.key === "ArrowRight") answer(1); else if (e.key === "ArrowLeft") answer(-1); else if (e.key === "ArrowDown") answer(0);
  });
  card.focus({ preventScroll: true });
}

function answer(v) {
  const item = personality.items[me.quizIndex];
  me.answers[item.id] = v;
  me.quizIndex++;
  save(); drawCard();
}

function finishQuiz() {
  me.quizDone = true; save();
  const q = document.getElementById("quiz");
  q.replaceChildren(
    h("div", { class: "quiz-top" }, h("span", { text: personality.title }), h("span")),
    h("div", { class: "quiz-body" }, h("div", { style: "max-width:460px;text-align:center" },
      avatar(me.avatarId, 84), h("h2", { class: "phone-title", style: "margin-top:20px", text: "All done!" }),
      h("p", { class: "phone-sub", text: "Your results will unlock at the end of the lecture, after you share what you learned." }),
      h("div", { class: "stack" },
        h("button", { class: "btn", type: "button", onclick: closeQuiz }, "Back to the lecture"),
        h("button", { class: "btn ghost", type: "button", onclick: () => { me.quizIndex = 0; save(); drawCard(); } }, "Review my answers")))));
}

// ---------------- End: learned → review → results → reflections → email ----------------
function reviewFlow(slide) {
  const box = h("div", {});
  const step = !me.reviewed ? 1 : !me.quizDone ? 2 : !me.submitted ? 3 : 4;
  box.append(h("div", { class: "steps-dots" }, [1, 2, 3, 4].map((n) => h("i", { class: n <= step ? "on" : "" }))));

  if (step === 1) {
    let rating = me.rating || 0;
    const learned = h("textarea", { class: "input", rows: "3", maxlength: "200", placeholder: slide.interaction.placeholder });
    learned.value = me.learned || "";
    const review = h("textarea", { class: "input", rows: "3", maxlength: "600", placeholder: "What was helpful? What could be better? (optional)" });
    const stars = h("div", { class: "stars", role: "radiogroup", "aria-label": "Rating" });
    const paintStars = () => stars.querySelectorAll("button").forEach((b, i) => { b.classList.toggle("on", i < rating); b.setAttribute("aria-checked", String(i + 1 === rating)); });
    for (let i = 1; i <= 5; i++) stars.append(h("button", { type: "button", role: "radio", "aria-label": `${i} star${i > 1 ? "s" : ""}`, onclick: () => { rating = i; paintStars(); } }, "★"));
    paintStars();
    const btn = h("button", { class: "btn", type: "submit", style: "width:100%" }, "Submit & see my results");
    const form = h("form", {},
      h("p", { class: "eyebrow", text: slide.eyebrow }),
      h("h1", { class: "phone-title" }, lines(slide.title)),
      h("p", { class: "phone-sub", text: "Share one thing you learned — it will appear on the big screen with your instrument name." }),
      h("label", { class: "field" }, h("span", { text: "What I learned today" }), learned),
      h("div", { class: "field" }, h("span", { text: "Review the lecture" }), stars),
      h("label", { class: "field" }, h("span", { text: "Comments for the speaker" }), review),
      btn);
    form.onsubmit = async (e) => {
      e.preventDefault();
      if (!learned.value.trim()) return toast("Share one thing you learned first.");
      if (!rating) return toast("Tap the stars to rate the lecture.");
      btn.disabled = true;
      try {
        await api(`/api/rooms/${code}/review`, { token: me.token, learned: learned.value, rating, review: review.value });
        Object.assign(me, { reviewed: true, learned: learned.value, rating }); save(); render(); scrollTo(0, 0);
      } catch (err) { toast(err.message); btn.disabled = false; }
    };
    box.append(form);
    return box;
  }

  if (step === 2) {
    box.append(h("p", { class: "eyebrow", text: "Thank you for your review" }),
      h("h1", { class: "phone-title", text: "One more thing to unlock your results" }),
      h("p", { class: "phone-sub", text: "Answer the 20 quick questions about yourself — then your results appear here." }),
      h("button", { class: "btn", type: "button", style: "width:100%", onclick: openQuiz }, "Start the 20 questions"));
    return box;
  }

  // Results
  const results = scorePersonality(personality, me.answers);
  const resultsBox = h("div", { class: "panel" });
  for (const dim of personality.dimensions) {
    const r = results[dim.id];
    const c = r && dim[r];
    const pos = { low: 12, mid: 50, high: 88 }[r];
    resultsBox.append(h("div", { class: "result" },
      h("div", { class: "dim", text: dim.name }),
      c ? h("h4", { text: c.title }) : h("h4", { text: "Still getting to know this" }),
      c ? h("p", { text: c.summary }) : h("p", { text: "You answered fewer than two questions here — that’s okay." }),
      h("div", { class: "scale-bar" }, pos != null ? h("i", { style: `left:${pos}%` }) : null),
      h("div", { class: "scale" }, h("span", { text: dim.leftLabel }), h("span", { text: dim.rightLabel, style: "text-align:right" })),
      c ? h("dl", {},
        h("dt", { text: "Strength" }), h("dd", { text: c.strength }),
        h("dt", { text: "Where you might get stuck" }), h("dd", { text: c.challenge }),
        h("dt", { text: "Grow it" }), h("dd", { text: c.grow }),
        h("dt", { text: "Try this" }), h("dd", { text: c.practice })) : null));
  }

  box.append(h("p", { class: "eyebrow", text: "Your results" }),
    h("h1", { class: "phone-title", text: "Your user manual, so far" }),
    h("p", { class: "phone-sub", text: "No answer is better than another. Keep what fits you — leave what doesn’t." }),
    resultsBox,
    h("p", { class: "muted", style: "font-size:13px;margin-top:10px", text: personality.note }));

  if (step === 4) {
    box.append(h("div", { class: "panel", style: "border-color:var(--ink)" },
      h("h3", { text: "Submitted — thank you!" }),
      h("p", { text: me.emailGiven ? "We’ll email you job matches based on your strengths later." : "Your reflections were saved." }),
      h("button", { class: "btn ghost small", type: "button", onclick: downloadRecord }, "Download my notes")));
    return box;
  }

  // Reflections + email
  const useStrength = h("textarea", { class: "input", rows: "3", maxlength: "600", placeholder: "e.g. I notice how people feel — I could help new students feel welcome." });
  const useWeakness = h("textarea", { class: "input", rows: "3", maxlength: "600", placeholder: "e.g. I decide slowly — I could use that to double-check important choices, and ask a friend to help me start." });
  const email = h("input", { class: "input", type: "email", autocomplete: "email", placeholder: "you@example.com", maxlength: "200" });
  const consent = h("input", { type: "checkbox" });
  const btn = h("button", { class: "btn", type: "submit", style: "width:100%" }, "Submit");
  const form = h("form", { class: "panel" },
    h("h3", { text: "Put it to use" }),
    h("p", { text: "Looking at your results, how could you use them?" }),
    h("label", { class: "field" }, h("span", { text: "How I could use my strengths" }), useStrength),
    h("label", { class: "field" }, h("span", { text: "How I could use — or work with — my weaknesses" }), useWeakness),
    h("label", { class: "field" }, h("span", { text: "Email for job matches (optional)" }), email),
    h("label", { class: "check" }, consent, h("span", { text: "Yes, email me job matches based on my results and reflections. (If you’re under 18, check with a parent or guardian first.)" })),
    btn);
  form.onsubmit = async (e) => {
    e.preventDefault();
    btn.disabled = true;
    try {
      await api(`/api/rooms/${code}/submit`, { token: me.token, results, useStrength: useStrength.value, useWeakness: useWeakness.value,
        email: email.value.trim(), consent: consent.checked });
      Object.assign(me, { submitted: true, emailGiven: Boolean(email.value.trim()), reflection: { useStrength: useStrength.value, useWeakness: useWeakness.value } });
      save(); render();
    } catch (err) { toast(err.message); btn.disabled = false; }
  };
  box.append(form);
  return box;
}

// ---------------- Boot ----------------
(async () => {
  [personality] = await Promise.all([getJson("/data/personality.json"), loadInstruments()]);
  if (!code) return showCodeForm();
  join();
})();
