import { api, getJson, loadInstruments, instrumentById, avatar, h, lines, store, scorePersonality, t, tr, getLang, setLang, insFamily, aliasText, calculator } from "./common.js";

const app = document.getElementById("app");
const params = new URLSearchParams(location.search);
let code = (params.get("code") || "").toUpperCase().replace(/[^A-Z0-9]/g, "");
let deck, personality, me, room = null, es = null;
let shownSlide = null;

const key = () => `hephzibah-join-${code}`;
const save = () => store.set(key(), me);

function toast(text) {
  const el = h("div", { class: "toast", role: "status", text });
  document.body.append(el); setTimeout(() => el.remove(), 3500);
}

// ---------------- Enter code ----------------
function showCodeForm(error = "") {
  app.replaceChildren(
    h("main", { class: "phone-main", style: "padding-top:10vh" },
      h("p", { class: "eyebrow", text: "Hephzibah Academy" }),
      h("h1", { class: "phone-title", style: "font-size:40px" }, t("Join the lecture", "강의 입장")),
      h("p", { class: "phone-sub", text: t("Enter the code on the big screen. No sign-up, no real name — you’ll join with a pseudonym.", "큰 화면의 코드를 입력하세요. 가입도 실명도 필요 없어요. 가명으로 참여해요.") }),
      langButton(() => showCodeForm(error)),
      (() => {
        const f = h("form", {},
          h("label", { class: "field" }, h("span", { text: t("Room code", "방 코드") }),
            h("input", { class: "input", name: "code", value: code, autocomplete: "off", autocapitalize: "characters", maxlength: "8", required: true, style: "font-size:28px;letter-spacing:.3em;text-transform:uppercase;font-weight:800;text-align:center" })),
          h("button", { class: "btn full", type: "submit", style: "width:100%" }, t("Join", "입장")),
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
    if (deck.consent && !me.consented) return showConsent();
    startLive();
  } catch (err) {
    if (err.status === 401 || err.status === 404) store.del(key());
    showCodeForm(err.message);
  }
}

function showConsent() {
  const research = h("input", { type: "checkbox", id: "c-research" }), contact = h("input", { type: "checkbox", id: "c-contact" });
  const btn = h("button", { class: "btn", type: "button", style: "width:100%", onclick: async () => {
    btn.disabled = true;
    try { await api(`/api/rooms/${code}/consent`, { token: me.token, research: research.checked, contact: contact.checked }); } catch {}
    me.consented = true; save(); startLive();
  } }, t("Continue", "계속하기"));
  app.replaceChildren(h("main", { class: "phone-main" },
    h("p", { class: "eyebrow", text: t("Before we start", "시작하기 전에") }),
    h("h1", { class: "phone-title", text: t("How your answers are used", "정보 이용 안내") }),
    h("div", { class: "panel" }, h("ul", { style: "margin:0;padding-left:18px;line-height:1.7;color:var(--ink-2)" },
      h("li", { text: t("Income, assets and debt are asked as ranges. You can skip any question.", "소득·자산·부채는 범위로 묻고, 어떤 질문이든 건너뛸 수 있어요.") }),
      h("li", { text: t("Only totals appear on the big screen. Your own numbers are never shown.", "큰 화면에는 집계만 나와요. 개인의 숫자는 보이지 않아요.") }),
      h("li", { text: t("Spending checks, the calculator and your notes stay on this phone.", "지출 비교, 계산기, 메모는 이 휴대폰에만 남아요.") }))),
    h("div", { class: "panel" },
      h("p", { style: "margin:0 0 12px;font-weight:700;color:var(--ink)", text: t("Optional", "선택 동의") }),
      h("label", { class: "check" }, research, h("span", { text: t("My anonymous answers may be used for research.", "익명 응답을 연구에 활용하는 데 동의해요.") })),
      h("label", { class: "check" }, contact, h("span", { text: t("I’m open to being contacted about counseling later.", "향후 상담 연락을 받는 데 동의해요.") }))),
    h("div", { style: "margin-top:18px" }, btn)));
}

function showReveal() {
  const ins = instrumentById(me.avatarId);
  app.replaceChildren(h("main", { class: "phone-main" },
    h("div", { class: "reveal" },
      h("p", { class: "eyebrow", text: deck.pseudonyms === "bible" ? t("Today your name is", "오늘 당신의 이름은") : t("In today’s orchestra, you are the", "오늘 오케스트라에서 당신은") }),
      avatar(me.avatarId, 120),
      h("h1", { text: aliasText(me.alias, me.avatarId) }),
      h("p", { class: "muted", text: insFamily(me.avatarId) }),
      h("p", { class: "phone-sub", style: "margin-top:18px", text: t("This is the only name shown on the big screen.", "큰 화면에는 이 이름만 나와요.") }), langButton(showReveal)),
    h("div", { class: "stack" },
      h("button", { class: "btn", type: "button", onclick: () => { me.confirmed = true; save(); deck.consent && !me.consented ? showConsent() : startLive(); } }, t("That’s me — let’s go", "좋아요, 시작할게요")),
      h("button", { class: "btn ghost", type: "button", onclick: () => join(true) }, deck.pseudonyms === "bible" ? t("Try another name", "다른 이름 뽑기") : t("Try another instrument", "다른 악기 뽑기")))));
}

// ---------------- Live ----------------
function startLive() {
  app.replaceChildren(
    h("header", { class: "phone-head" },
      h("span", { class: "me" }, avatar(me.avatarId, 34), h("span", { id: "alias", text: aliasText(me.alias, me.avatarId) })),
      h("span", { style: "display:flex;gap:10px;align-items:center" }, langButton(() => { document.getElementById("alias").textContent = aliasText(me.alias, me.avatarId); render(); }, true), h("span", { class: "code", text: code }))),
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
  const slide = tr(currentSlide());
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
  else if (ix && ix.type === "estimate") main.append(estimatePanel(slide));
  else if (ix && ix.type === "calculator") main.append(h("div", { class: "panel" }, h("h3", { text: ix.prompt }), h("p", { text: t("Try your own numbers. Nothing is sent anywhere.", "내 숫자로 계산해 보세요. 어디에도 전송되지 않아요.") }), calculator(t)));
  else if (ix && ix.type === "checklist") main.append(checklistPanel(slide));
  else if (ix && ix.type === "review") main.append(reviewFlow(slide));
  else if (slide.kind === "orchestra") main.append(h("div", { class: "panel" }, h("h3", {}, t(`Listen for the ${aliasText(me.alias, me.avatarId).replace(/ \d+$/, "")}!`, `${aliasText(me.alias, me.avatarId).replace(/ \d+$/, "")} 소리를 들어 보세요!`)),
    h("p", { text: t("The presenter will play each instrument alone — then all together. Your instrument has its own part.", "악기를 하나씩 들려준 다음 함께 연주해요. 내 악기에도 나만의 파트가 있어요.") })));
  else if (slide.kind === "video") main.append(h("div", { class: "panel" }, h("h3", { text: t("Watch the big screen", "큰 화면을 보세요") }),
    h("p", { text: t("Listen to how one oboe carries the melody — and how every other instrument holds it up.", "오보에 하나가 멜로디를 이끌고, 다른 모든 악기가 그것을 받쳐 주는 소리를 들어 보세요.") })));
  else main.append(h("div", { class: "panel" }, h("p", { style: "margin:0", text: t("Follow along on the big screen. Questions will pop up here.", "큰 화면을 따라오세요. 질문이 나오면 여기에 떠요.") })));

  if (slide.kind !== "review") {
    if (deck.id === "my-user-manual" && !me.quizDone && room.slideIndex < reviewIdx) main.append(quizInvite());
    if (!(ix && ix.channel === "qa")) main.append(askPanel());
  }
}

function renderEnded(gone) {
  const main = document.getElementById("main");
  main.replaceChildren(h("p", { class: "eyebrow", text: t("Thank you", "감사합니다") }), h("h1", { class: "phone-title", text: t("This session has ended.", "강의가 끝났어요.") }),
    h("p", { class: "phone-sub", text: gone ? t("The room is closed.", "방이 닫혔어요.") : t("Thanks for taking part!", "함께해 줘서 고마워요!") }));
  if (me.worksheet && Object.values(me.worksheet).some(Boolean)) main.append(h("button", { class: "btn ghost", onclick: downloadRecord }, t("Download my notes", "내 기록 내려받기")));
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
  return h("div", {}, box, h("p", { class: "muted", style: "font-size:14px;margin-top:12px", text: t("Only totals are shown on screen. You can change your answer.", "화면에는 합계만 보여요. 답을 바꿔도 괜찮아요.") }));
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
  const paint = () => list.replaceChildren(...(me.sent[listKey] || []).map((s) => h("li", {}, s.text, h("small", { text: s.status === "pending" ? t("Sent · waiting for the presenter to show it", "보냄 · 발표자가 띄우기를 기다리는 중") : t("Sent · on the screen", "보냄 · 화면에 표시됨") }))));
  paint();
  const btn = h("button", { class: "btn", type: "submit" }, t("Send", "보내기"));
  const form = h("form", { class: "panel" },
    h("h3", { text: ix.prompt }),
    h("p", { text: channel === "qa" ? t("Your question appears with your instrument name, not your real name.", "질문은 실명이 아닌 악기 이름으로 보여요.") : t("Your answer appears on the big screen with your instrument name — never your real name.", "답은 실명이 아닌 악기 이름으로 큰 화면에 나와요.") }),
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
  const d = h("details", { class: "panel" }, h("summary", { style: "font-weight:700;cursor:pointer" }, t("Ask the speaker a question", "발표자에게 질문하기")));
  const ta = h("textarea", { class: "input", maxlength: "200", rows: "2", placeholder: t("Your question…", "질문을 적어 주세요…"), style: "margin-top:12px" });
  const b = h("button", { class: "btn small", type: "button", style: "margin-top:10px", onclick: async () => {
    const text = ta.value.trim(); if (!text) return;
    try { await api(`/api/rooms/${code}/message`, { token: me.token, slideId: "qa", channel: "qa", text }); ta.value = ""; toast(t("Sent! The speaker will see it.", "보냈어요! 발표자가 볼 수 있어요.")); }
    catch (err) { toast(err.message); }
  } }, t("Send question", "질문 보내기"));
  d.append(ta, b);
  return d;
}

// ---- Guess vs. actual (private)
function estimatePanel(slide) {
  const ix = slide.interaction;
  me.estimate ||= {};
  const money = (n) => "$" + Math.round(n).toLocaleString("en-US");
  const rows = ix.categories.map((cat) => {
    const v = (me.estimate[cat.id] ||= {});
    const g = h("input", { class: "input", type: "number", inputmode: "decimal", min: "0", placeholder: t("Guess", "예상"), value: v.guess ?? "" });
    const a = h("input", { class: "input", type: "number", inputmode: "decimal", min: "0", placeholder: t("Actual", "실제"), value: v.actual ?? "" });
    const d = h("span", { class: "est-diff" });
    const upd = () => {
      v.guess = g.value; v.actual = a.value; save();
      d.textContent = g.value !== "" && a.value !== "" ? (a.value - g.value >= 0 ? "+" : "−") + money(Math.abs(a.value - g.value)) : "";
      total();
    };
    g.oninput = upd; a.oninput = upd;
    return [h("div", { class: "est-row" }, h("b", { text: cat.label }), g, a), d, upd];
  });
  const sum = h("p", { class: "muted", style: "margin:12px 0 0;font-size:15px" });
  function total() {
    let gs = 0, as = 0, ok = false;
    for (const cat of ix.categories) { const v = me.estimate[cat.id] || {}; if (v.guess !== "" && v.guess != null && v.actual !== "" && v.actual != null) { gs += +v.guess; as += +v.actual; ok = true; } }
    sum.textContent = ok ? t(`Guessed ${money(gs)} · actual ${money(as)} · difference ${money(Math.abs(as - gs))}`, `예상 ${money(gs)} · 실제 ${money(as)} · 차이 ${money(Math.abs(as - gs))}`) : "";
  }
  const box = h("div", { class: "panel" }, h("h3", { text: ix.prompt }),
    h("p", { text: t("Guess first, then check your bank or card app for the last 30 days. Only you can see this.", "먼저 예상하고, 은행·카드 앱에서 지난 30일 내역을 확인해 보세요. 나만 볼 수 있어요.") }),
    h("div", { class: "est" }, h("div", { class: "est-row head" }, h("span"), h("span", { text: t("Guess", "예상") }), h("span", { text: t("Actual", "실제") })),
      rows.flatMap(([row, d]) => [row, d])), sum);
  rows.forEach(([, , upd]) => upd());
  return box;
}

// ---- Home tasks (private checklist)
function checklistPanel(slide) {
  me.checks ||= {};
  const list = h("ul", { class: "checks" }, slide.body.map((item, i) => {
    const cb = h("input", { type: "checkbox" }); cb.checked = !!me.checks[slide.id + i];
    cb.onchange = () => { me.checks[slide.id + i] = cb.checked; save(); };
    return h("li", {}, h("label", {}, cb, h("span", { text: item })));
  }));
  return h("div", { class: "panel" }, h("h3", { text: slide.interaction.prompt }), list);
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
  box.append(h("button", { class: "btn ghost small", type: "button", onclick: downloadRecord }, t("Download my page", "내 페이지 내려받기")));
  return box;
}

function downloadRecord() {
  const ws = tr(deck.slides.find((s) => s.interaction && s.interaction.type === "private"));
  const out = [deck.id === "my-user-manual" ? t("My User Manual · Page One", "나의 사용설명서 · 첫 페이지") : ws.interaction.prompt, `Hephzibah Academy · ${new Date().toLocaleDateString()}`, ""];
  for (const f of ws.interaction.fields) out.push(f.label, me.worksheet[f.id] || "—", "");
  if (me.reflection) out.push(t("How I’ll use my strengths", "내 강점을 이렇게 쓸게요"), me.reflection.useStrength || "—", "", t("How I’ll work with my weaknesses", "내 약점을 이렇게 다룰게요"), me.reflection.useWeakness || "—", "");
  const blob = new Blob([out.join("\n")], { type: "text/plain" });
  const a = h("a", { href: URL.createObjectURL(blob), download: "my-user-manual.txt" });
  document.body.append(a); a.click(); a.remove();
}

// ---------------- 20 questions (swipe) ----------------
// Personality data in the current language
const P = () => {
  if (getLang() !== "ko") return personality;
  const k = personality.ko;
  return { ...personality, title: k.title, subtitle: k.subtitle, instructions: k.instructions, note: k.note,
    choices: personality.choices.map((c, i) => ({ ...c, label: k.choices[i] })),
    items: personality.items.map((it) => ({ ...it, text: it.ko })),
    dimensions: personality.dimensions.map((d) => ({ ...d, ...d.ko, low: { ...d.low, ...d.low.ko }, mid: { ...d.mid, ...d.mid.ko }, high: { ...d.high, ...d.high.ko } })) };
};

function langButton(rerender, small) {
  return h("button", { class: "lang-btn", type: "button", style: small ? "padding:4px 10px;font-size:12px" : "margin:4px 0 18px",
    onclick: () => { setLang(getLang() === "ko" ? "en" : "ko"); rerender(); const q = document.getElementById("quiz"); if (q && !q.hidden) (me && me.quizIndex < 20 ? drawCard() : null); } },
    t("한국어", "English"));
}

function quizInvite() {
  const answered = Object.values(me.answers).filter((v) => v != null).length;
  return h("div", { class: "panel", style: "border-color:var(--ink)" },
    h("h3", { text: P().title }),
    h("p", { text: answered ? t(`You’ve answered ${answered} of 20. Your results unlock at the end of the lecture.`, `20개 중 ${answered}개에 답했어요. 결과는 강의 끝에 열려요.`) : t("Swipe through 20 quick questions about yourself (about 5 minutes). Your results unlock at the end of the lecture.", "나에 대한 짧은 질문 20개를 넘겨 보세요(약 5분). 결과는 강의 끝에 열려요.") }),
    h("button", { class: "btn small", type: "button", onclick: openQuiz }, answered ? t("Continue", "이어 하기") : t("Start", "시작")));
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
  const personality = P();
  const q = document.getElementById("quiz");
  q.replaceChildren(
    h("div", { class: "quiz-top" }, h("span", { text: personality.title }), h("button", { type: "button", onclick: closeQuiz }, t("Close", "닫기"))),
    h("div", { class: "quiz-body" }, h("div", { style: "max-width:460px" },
      h("h2", { class: "phone-title", text: personality.subtitle }),
      h("ul", { style: "padding-left:20px;color:var(--ink-2);line-height:1.6" }, personality.instructions.map((line) => h("li", { text: line }))),
      h("p", { class: "muted", style: "font-size:14px", text: t("Swipe right for “That’s me”, left for “Not really”, or use the buttons.", "오른쪽으로 넘기면 “그래요”, 왼쪽은 “아니에요”. 버튼을 눌러도 돼요.") }),
      h("p", { class: "muted", style: "font-size:13px", text: personality.note }),
      h("button", { class: "btn", type: "button", style: "width:100%;margin-top:12px", onclick: () => { me.quizIntroSeen = true; save(); drawCard(); } }, t("Begin", "시작하기")))));
}

function drawCard() {
  const personality = P();
  const items = personality.items;
  const i = me.quizIndex;
  if (i >= items.length) return finishQuiz();
  const item = items[i];
  const q = document.getElementById("quiz");
  const cur = me.answers[item.id];
  const card = h("div", { class: "qcard", tabindex: "0" },
    h("span", { class: "stamp no", text: t("NOT REALLY", "아니에요") }), h("span", { class: "stamp yes", text: t("THAT’S ME", "그래요") }),
    h("div", { class: "qn", text: `${String(i + 1).padStart(2, "0")} / ${items.length}` }),
    h("div", { class: "qt", text: item.text }),
    h("div", { class: "hint" }, h("span", { text: t("← Not really", "← 아니에요") }), h("span", { text: t("That’s me →", "그래요 →") })));
  q.replaceChildren(
    h("div", { class: "quiz-top" }, h("span", { text: personality.title }), h("button", { type: "button", onclick: closeQuiz }, t("Save & close", "저장하고 닫기"))),
    h("div", { class: "quiz-progress" }, h("i", { style: `width:${(i / items.length) * 100}%` })),
    h("div", { class: "quiz-body" }, card),
    h("div", { class: "quiz-actions" }, personality.choices.map((c) => h("button", { type: "button", class: cur === c.value ? "sel" : "", onclick: () => answer(c.value) }, c.label))),
    h("div", { class: "quiz-sub" },
      h("button", { type: "button", disabled: i === 0, onclick: () => { me.quizIndex = Math.max(0, i - 1); save(); drawCard(); } }, t("← Previous", "← 이전 질문")),
      h("button", { type: "button", onclick: () => answer(null) }, t("Skip this one", "이 질문은 넘길게요"))));

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
  const personality = P();
  me.quizDone = true; save();
  const q = document.getElementById("quiz");
  q.replaceChildren(
    h("div", { class: "quiz-top" }, h("span", { text: personality.title }), h("span")),
    h("div", { class: "quiz-body" }, h("div", { style: "max-width:460px;text-align:center" },
      avatar(me.avatarId, 84), h("h2", { class: "phone-title", style: "margin-top:20px", text: t("All done!", "다 했어요!") }),
      h("p", { class: "phone-sub", text: t("Your results will unlock at the end of the lecture, after you share what you learned.", "강의 끝에 배운 것을 나누면 결과가 열려요.") }),
      h("div", { class: "stack" },
        h("button", { class: "btn", type: "button", onclick: closeQuiz }, t("Back to the lecture", "강의로 돌아가기")),
        h("button", { class: "btn ghost", type: "button", onclick: () => { me.quizIndex = 0; save(); drawCard(); } }, t("Review my answers", "내 답 다시 보기"))))));
}

// ---------------- End: learned → review → results → reflections → email ----------------
function reviewFlow(slide) {
  const personality = P();
  const box = h("div", {});
  const step = !me.reviewed ? 1 : !me.quizDone ? 2 : !me.submitted ? 3 : 4;
  box.append(h("div", { class: "steps-dots" }, [1, 2, 3, 4].map((n) => h("i", { class: n <= step ? "on" : "" }))));

  if (step === 1) {
    let rating = me.rating || 0;
    const learned = h("textarea", { class: "input", rows: "3", maxlength: "200", placeholder: slide.interaction.placeholder });
    learned.value = me.learned || "";
    const review = h("textarea", { class: "input", rows: "3", maxlength: "600", placeholder: t("What was helpful? What could be better? (optional)", "무엇이 도움이 됐나요? 더 좋아질 점은? (선택)") });
    const stars = h("div", { class: "stars", role: "radiogroup", "aria-label": t("Rating", "평점") });
    const paintStars = () => stars.querySelectorAll("button").forEach((b, i) => { b.classList.toggle("on", i < rating); b.setAttribute("aria-checked", String(i + 1 === rating)); });
    for (let i = 1; i <= 5; i++) stars.append(h("button", { type: "button", role: "radio", "aria-label": `${i} star${i > 1 ? "s" : ""}`, onclick: () => { rating = i; paintStars(); } }, "★"));
    paintStars();
    const btn = h("button", { class: "btn", type: "submit", style: "width:100%" }, t("Submit & see my results", "제출하고 내 결과 보기"));
    const form = h("form", {},
      h("p", { class: "eyebrow", text: slide.eyebrow }),
      h("h1", { class: "phone-title" }, lines(slide.title)),
      h("p", { class: "phone-sub", text: t("Share one thing you learned — it will appear on the big screen with your instrument name.", "배운 것 하나를 나눠 주세요. 악기 이름과 함께 큰 화면에 나와요.") }),
      h("label", { class: "field" }, h("span", { text: t("What I learned today", "오늘 배운 것") }), learned),
      h("div", { class: "field" }, h("span", { text: t("Review the lecture", "강의 평가") }), stars),
      h("label", { class: "field" }, h("span", { text: t("Comments for the speaker", "발표자에게 한마디") }), review),
      btn);
    form.onsubmit = async (e) => {
      e.preventDefault();
      if (!learned.value.trim()) return toast(t("Share one thing you learned first.", "배운 것 하나를 먼저 적어 주세요."));
      if (!rating) return toast(t("Tap the stars to rate the lecture.", "별을 눌러 강의를 평가해 주세요."));
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
    box.append(h("p", { class: "eyebrow", text: t("Thank you for your review", "평가해 줘서 고마워요") }),
      h("h1", { class: "phone-title", text: t("One more thing to unlock your results", "결과를 보려면 하나만 더") }),
      h("p", { class: "phone-sub", text: t("Answer the 20 quick questions about yourself — then your results appear here.", "나에 대한 질문 20개에 답하면 여기에 결과가 나와요.") }),
      h("button", { class: "btn", type: "button", style: "width:100%", onclick: openQuiz }, t("Start the 20 questions", "질문 20개 시작하기")));
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
      c ? h("h4", { text: c.title }) : h("h4", { text: t("Still getting to know this", "조금 더 알아가는 중") }),
      c ? h("p", { text: c.summary }) : h("p", { text: t("You answered fewer than two questions here — that’s okay.", "이 영역은 답이 적어요. 괜찮아요.") }),
      h("div", { class: "scale-bar" }, pos != null ? h("i", { style: `left:${pos}%` }) : null),
      h("div", { class: "scale" }, h("span", { text: dim.leftLabel }), h("span", { text: dim.rightLabel, style: "text-align:right" })),
      c ? h("dl", {},
        h("dt", { text: t("Strength", "강점") }), h("dd", { text: c.strength }),
        h("dt", { text: t("Where you might get stuck", "막힐 수 있는 때") }), h("dd", { text: c.challenge }),
        h("dt", { text: t("Grow it", "강점을 키우는 방법") }), h("dd", { text: c.grow }),
        h("dt", { text: t("Try this", "도움이 되는 작은 연습") }), h("dd", { text: c.practice })) : null));
  }

  box.append(h("p", { class: "eyebrow", text: t("Your results", "내 결과") }),
    h("h1", { class: "phone-title", text: t("Your user manual, so far", "지금까지의 나의 사용설명서") }),
    h("p", { class: "phone-sub", text: t("No answer is better than another. Keep what fits you — leave what doesn’t.", "더 좋은 답은 없어요. 나와 맞는 것은 가져가고, 맞지 않는 것은 두고 가요.") }),
    resultsBox,
    h("p", { class: "muted", style: "font-size:13px;margin-top:10px", text: personality.note }));

  if (step === 4) {
    box.append(h("div", { class: "panel", style: "border-color:var(--ink)" },
      h("h3", { text: t("Submitted — thank you!", "제출했어요. 고마워요!") }),
      h("p", { text: me.emailGiven ? t("We’ll email you job matches based on your strengths later.", "나중에 강점에 맞는 직업 추천을 이메일로 보내 드릴게요.") : t("Your reflections were saved.", "내 성찰이 저장됐어요.") }),
      h("button", { class: "btn ghost small", type: "button", onclick: downloadRecord }, t("Download my notes", "내 기록 내려받기"))));
    return box;
  }

  // Reflections + email
  const useStrength = h("textarea", { class: "input", rows: "3", maxlength: "600", placeholder: t("e.g. I notice how people feel — I could help new students feel welcome.", "예: 사람들의 마음을 잘 살펴요. 새로 온 친구가 편하게 느끼도록 도울 수 있어요.") });
  const useWeakness = h("textarea", { class: "input", rows: "3", maxlength: "600", placeholder: t("e.g. I decide slowly — I could use that to double-check important choices, and ask a friend to help me start.", "예: 결정이 느려요. 중요한 선택을 한 번 더 살펴보고, 시작할 때는 친구에게 도움을 부탁할 수 있어요.") });
  const email = h("input", { class: "input", type: "email", autocomplete: "email", placeholder: "you@example.com", maxlength: "200" });
  const consent = h("input", { type: "checkbox" });
  const btn = h("button", { class: "btn", type: "submit", style: "width:100%" }, t("Submit", "제출하기"));
  const form = h("form", { class: "panel" },
    h("h3", { text: t("Put it to use", "이렇게 써 볼게요") }),
    h("p", { text: t("Looking at your results, how could you use them?", "내 결과를 보고, 어떻게 써 볼 수 있을까요?") }),
    h("label", { class: "field" }, h("span", { text: t("How I could use my strengths", "내 강점을 이렇게 쓸 수 있어요") }), useStrength),
    h("label", { class: "field" }, h("span", { text: t("How I could use — or work with — my weaknesses", "내 약점을 이렇게 쓰거나 다룰 수 있어요") }), useWeakness),
    h("label", { class: "field" }, h("span", { text: t("Email for job matches (optional)", "직업 추천 받을 이메일 (선택)") }), email),
    h("label", { class: "check" }, consent, h("span", { text: t("Yes, email me job matches based on my results and reflections. (If you’re under 18, check with a parent or guardian first.)", "네, 내 결과와 성찰을 바탕으로 직업 추천을 이메일로 받을게요. (18세 미만이면 먼저 부모님께 확인해 주세요.)") })),
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
