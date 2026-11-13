import { api, getJson, loadInstruments, instrumentById, avatar, h, lines, store, t, tr, getLang, setLang, insName, insFamily, aliasText, calculator, compoundCalc } from "./common.js";
import { Orchestra } from "./orchestra.js";

const ARROW = '<svg class="arrow" viewBox="0 0 16 16" aria-hidden="true"><path d="M4 12L12 4M5.5 4H12v6.5" fill="none" stroke="currentColor" stroke-width="1.6"/></svg>';
const LOGO = '<svg class="brand-mark" viewBox="9 11 43 43" aria-hidden="true"><path d="M10 22h11v12h17V12h13v41H38V42H21v11H10z" fill="currentColor"/></svg>';

const params = new URLSearchParams(location.search);
const lectureId = params.get("lecture") || "my-user-manual";
const preview = params.has("preview");
const app = document.getElementById("app");

let deck, instruments, room = null; // room: {code, hostKey}
let state = { slideIndex: 0, messages: [], votes: {}, participants: 0, online: 0, instruments: {}, moderate: false, ended: false, reviews: 0, rating: null, submissions: 0 };
let renderedSlide = -1;
let keysBound = false, connected = false;
const orchestra = new Orchestra();

const joinUrl = () => `${location.origin}/j/${room.code}`;
const joinHost = () => `${location.host}/j/`;

function qrSvg(url) {
  try { return window.makeQR ? window.makeQR(url) : ""; } catch { return ""; }
}

// ---------------- Setup (sign in) ----------------
async function showSetup() {
  document.title = "Presenter · Hephzibah Academy";
  const config = await getJson("/api/config").catch(() => ({}));
  const last = store.get("hephzibah-host");
  document.body.className = "";
  app.innerHTML = `
  <header class="site-header"><div class="wrap">
    <a class="brand" href="/">${LOGO}<span class="brand-name"><b>Hephzibah</b><span>ACADEMY</span></span></a>
    <a class="btn ghost small" href="/lectures/${lectureId}">${t("Back to lecture", "강의로 돌아가기")}</a>
  </div></header>
  <main class="setup">
    <p class="eyebrow">${t("Presenter", "발표자")}</p>
    <h1 class="h2">${escape(t(deck.title, deck.ko.title))}</h1>
    <p class="lead" style="font-size:20px;margin-top:14px">${escape(t(deck.track, deck.ko.track))} · ${t("slides", "슬라이드")} ${deck.slides.length} · ~${deck.minutes}${t(" min", "분")}</p>
    <form id="start" style="margin-top:40px">
      ${config.passcodeRequired ? `<label class="field"><span>${t("Presenter passcode", "발표자 비밀번호")}</span><input class="input" name="passcode" type="password" autocomplete="current-password" required></label>` : ""}
      <button class="btn full" type="submit" style="width:100%">${t("Start live session", "실시간 발표 시작")} ${ARROW}</button>
      <p class="error" id="err" role="alert"></p>
    </form>
    ${last && last.lectureId === lectureId ? `<button class="btn ghost" id="resume" style="width:100%;margin-top:4px">${t("Resume room", "이어서 진행")} ${escape(last.code)}</button>` : ""}
    <p class="muted" style="font-size:14px;margin-top:28px">${t("Open this on the projector. Students join from their phones with the code or QR on screen. Keys: ←/→ move · N notes · Q show QR · F fullscreen.", "프로젝터에 띄우세요. 학생들은 화면의 코드나 QR로 휴대폰에서 입장해요. 키: ←/→ 이동 · N 노트 · Q QR 보기 · F 전체 화면.")}</p>
    <button class="lang-btn" id="langSetup" type="button" style="margin-top:12px">${t("한국어", "English")}</button>
  </main>`;
  app.querySelector("#langSetup").onclick = () => { setLang(getLang() === "ko" ? "en" : "ko"); showSetup(); };
  app.querySelector("#start").addEventListener("submit", async (e) => {
    e.preventDefault();
    const btn = e.target.querySelector("button"); btn.disabled = true;
    try {
      const passcode = e.target.passcode ? e.target.passcode.value : undefined;
      const r = await api("/api/rooms", { lectureId, passcode });
      room = { code: r.code, hostKey: r.hostKey, lectureId };
      store.set("hephzibah-host", room);
      history.replaceState(null, "", `/present?lecture=${lectureId}&room=${r.code}`);
      startStage();
    } catch (err) { app.querySelector("#err").textContent = err.message; btn.disabled = false; }
  });
  const resume = app.querySelector("#resume");
  if (resume) resume.addEventListener("click", async () => {
    try { await api(`/api/rooms/${last.code}`); room = last; history.replaceState(null, "", `/present?lecture=${lectureId}&room=${last.code}`); startStage(); }
    catch { store.del("hephzibah-host"); resume.textContent = t("That room has expired — start a new one", "그 방은 끝났어요. 새로 시작해 주세요"); resume.disabled = true; }
  });
}

function escape(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

// ---------------- Stage ----------------
function startStage() {
  document.body.className = "stage-body";
  document.title = `${t(deck.title, deck.ko.title)} · Hephzibah Academy`;
  app.innerHTML = `
  <header class="topbar">
    <a class="brand" href="/lectures/${lectureId}" title="${t("Exit", "나가기")}">${LOGO}<span class="brand-name"><b>Hephzibah</b><span>ACADEMY</span></span></a>
    <div class="joinline">${room ? `${t("Join at", "입장:")} <u>${escape(joinHost())}</u><b>${room.code}</b>` : `<span class="muted">${t("Preview — no audience connected", "미리보기 · 청중 연결 없음")}</span>`}</div>
    <span class="count" id="count">${room ? `<span class="dot"></span><span>0 ${t("joined", "명 입장")}</span>` : ""}</span>
  </header>
  <div class="stage" id="stage"></div>
  <footer class="bottombar">
    <div style="display:flex;align-items:center;gap:16px;flex:1;min-width:0">
      <span class="slide-pos" id="pos"></span><div class="progress"><i id="bar"></i></div>
      <span class="muted hide-sm" id="section" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></span>
    </div>
    <div class="controls">
      ${room ? `<button class="ctl hide-sm" id="mod" aria-pressed="false" title="${t("Review messages before they appear", "화면에 띄우기 전에 검토")}">${t("Review first", "검토 후 표시")}</button>
      <button class="ctl hide-sm" id="queue">${t("Queue", "대기열")}<span class="badge" id="qcount" hidden>0</span></button>
      <button class="ctl hide-sm" id="qr">QR</button>
      <a class="ctl hide-sm" id="export" href="#" download>${t("Export", "내보내기")}</a>` : ""}
      <button class="ctl hide-sm" id="notes">${t("Notes", "노트")}</button>
      <button class="ctl" id="lang">${t("한국어", "English")}</button>
      <button class="ctl" id="prev" aria-label="${t("Previous slide", "이전 슬라이드")}">←</button>
      <button class="ctl" id="next" aria-label="${t("Next slide", "다음 슬라이드")}">→</button>
    </div>
  </footer>
  <aside class="drawer" id="drawer" hidden></aside>
  <div class="overlay" id="qrOverlay" hidden></div>`;

  if (room) {
    document.getElementById("export").href = `/api/rooms/${room.code}/export?key=${encodeURIComponent(room.hostKey)}`;
    document.getElementById("mod").onclick = () => hostOp({ op: "moderate", value: !state.moderate });
    document.getElementById("queue").onclick = () => toggleDrawer("queue");
    document.getElementById("qr").onclick = toggleQr;
  }
  document.getElementById("notes").onclick = () => toggleDrawer("notes");
  document.getElementById("lang").onclick = () => { setLang(getLang() === "ko" ? "en" : "ko"); startStage(); };
  document.getElementById("prev").onclick = () => go(state.slideIndex - 1);
  document.getElementById("next").onclick = () => go(state.slideIndex + 1);
  if (!keysBound) { document.addEventListener("keydown", onKey); keysBound = true; }
  if (room && !connected) { connected = true; connect(); }
  renderedSlide = -1;
  render();
}

function onKey(e) {
  if (e.target.closest("input, textarea")) return;
  if (["ArrowRight", "PageDown", " "].includes(e.key)) { e.preventDefault(); go(state.slideIndex + 1); }
  else if (["ArrowLeft", "PageUp"].includes(e.key)) { e.preventDefault(); go(state.slideIndex - 1); }
  else if (e.key === "n" || e.key === "N") toggleDrawer("notes");
  else if ((e.key === "q" || e.key === "Q") && room) toggleQr();
  else if (e.key === "f" || e.key === "F") document.fullscreenElement ? document.exitFullscreen() : document.documentElement.requestFullscreen?.();
  else if (e.key === "Escape") { document.getElementById("qrOverlay").hidden = true; document.getElementById("drawer").hidden = true; }
}

async function go(i) {
  if (i < 0 || i >= deck.slides.length || i === state.slideIndex) return;
  state.slideIndex = i; // optimistic
  render();
  if (room) hostOp({ op: "slide", index: i });
}

async function hostOp(body) {
  try { await api(`/api/rooms/${room.code}/host`, { key: room.hostKey, ...body }); }
  catch (err) { toast(err.message); }
}

function connect() {
  const es = new EventSource(`/api/rooms/${room.code}/stream?key=${encodeURIComponent(room.hostKey)}`);
  es.onmessage = (ev) => {
    const next = JSON.parse(ev.data);
    const slideChanged = next.slideIndex !== state.slideIndex;
    state = next;
    if (slideChanged) render(); else update();
  };
  es.onerror = () => {
    // EventSource reconnects automatically. If the room is gone (server restart), say so.
    api(`/api/rooms/${room.code}`).catch((err) => { if (err.status === 404) { es.close(); store.del("hephzibah-host"); toast(t("This room has ended (server restarted). Start a new session.", "방이 종료되었어요(서버 재시작). 새로 시작해 주세요.")); } });
  };
}

// ---------------- Rendering ----------------
function render() {
  const slide = tr(deck.slides[state.slideIndex]);
  if (renderedSlide !== state.slideIndex) orchestra.stop();
  renderedSlide = state.slideIndex;
  const stage = document.getElementById("stage");
  stage.replaceChildren(buildSlide(slide));
  document.getElementById("pos").textContent = `${String(state.slideIndex + 1).padStart(2, "0")} / ${deck.slides.length}`;
  document.getElementById("bar").style.width = `${((state.slideIndex + 1) / deck.slides.length) * 100}%`;
  document.getElementById("section").textContent = slide.section;
  const drawer = document.getElementById("drawer");
  if (!drawer.hidden && drawer.dataset.mode === "notes") fillNotes();
  update();
}

function head(slide, compact) {
  return h("div", { class: "content" },
    h("p", { class: "eyebrow", text: slide.eyebrow }),
    h("h1", { class: "title" }, lines(slide.title)),
    slide.subtitle ? h("p", { class: "subtitle", text: slide.subtitle }) : null);
}

function buildSlide(slide) {
  const el = h("section", { class: "slide", "aria-live": "polite", "data-kind": slide.kind });
  const ix = slide.interaction;

  if (slide.kind === "cover" && room) {
    el.style.gridTemplateColumns = "1fr auto"; el.style.gap = "5vw";
    const c = head(slide); c.append(h("div", { class: "accent" }), h("p", { class: "subtitle", style: "font-weight:700;color:var(--ink)", text: slide.body[0] }));
    el.append(c, h("div", { class: "content" }, qrBox()));
    return el;
  }

  if (slide.kind === "video") {
    el.classList.add("video");
    const v = slide.video;
    el.append(h("div", { style: "display:flex;justify-content:space-between;align-items:end;gap:24px;flex-wrap:wrap" },
      h("div", {}, h("p", { class: "eyebrow", style: "margin-bottom:8px", text: slide.eyebrow }), h("h1", { class: "title", style: "font-size:clamp(26px,3vw,48px)", text: slide.title })),
      h("a", { class: "ctl", href: `https://www.youtube.com/watch?v=${v.youtubeId}`, target: "_blank", rel: "noopener", text: t("Open on YouTube ↗", "YouTube에서 열기 ↗") })));
    const frame = h("div", { class: "video-frame" });
    const iframe = h("iframe", { src: `https://www.youtube-nocookie.com/embed/${v.youtubeId}?rel=0&modestbranding=1`, title: v.title,
      allow: "accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen", allowfullscreen: true, referrerpolicy: "strict-origin-when-cross-origin" });
    frame.append(iframe); el.append(frame);
    return el;
  }

  if (slide.kind === "orchestra") {
    el.classList.add("compact");
    const c = head(slide);
    const grid = h("div", { class: "orch", id: "orch" });
    for (const ins of instruments.filter((i) => i.kind !== "bible")) {
      const b = h("button", { class: "inst", type: "button", "data-id": ins.id, onclick: () => playSolo(ins.id, b) },
        avatar(ins.id, 46), h("span", {}, h("b", { text: t(ins.name, ins.ko) }), h("small", { class: "inroom", text: t(ins.family, ins.familyKo) })));
      grid.append(b);
    }
    const together = h("button", { class: "btn", type: "button", onclick: () => playAll(together) }, t("▶ All together", "▶ 함께 연주"));
    const stop = h("button", { class: "btn ghost", type: "button", onclick: () => { orchestra.stop(); markPlaying([]); } }, t("■ Stop", "■ 정지"));
    c.append(grid, h("div", { class: "orch-actions" }, together, stop));
    el.append(c);
    return el;
  }

  const live = ix && (ix.type === "text" || ix.type === "choice" || ix.type === "review");
  if (live && room || (live && ix.type === "choice")) {
    el.classList.add("split-live", "compact");
    const c = head(slide);
    if (ix.type === "text" || ix.type === "review") {
      c.append(h("p", { class: "subtitle", style: "font-size:clamp(14px,1.2vw,18px);color:var(--muted)" }, room ? `${t("Answer on your phone", "휴대폰으로 답해 주세요")} · ${joinHost()}${room.code}` : ""));
      if (ix.type === "review") c.append(h("p", { class: "subtitle", id: "reviewStats", style: "font-weight:700;color:var(--ink)" }));
      const wrap = h("div", { class: "wall-wrap" },
        h("div", { class: "wall-head" }, h("span", { text: ix.channel === "qa" ? t("Your questions", "질문") : ix.type === "review" ? t("What we learned", "우리가 배운 것") : t("Live answers", "실시간 답변") }), h("span", { id: "wallCount" })),
        h("div", { class: "wall", id: "wall", "data-slide": ix.channel === "qa" ? "qa" : slide.id }));
      el.append(c, wrap);
    } else {
      const poll = h("div", { class: "poll", id: "poll" });
      for (const o of ix.options) poll.append(h("div", { class: "opt", "data-value": o.value }, h("span", { text: o.label }), h("span", { class: "num", text: "0" }), h("div", { class: "bar" }, h("i", { style: "width:0" }))));
      el.append(c, h("div", { class: "wall-wrap", style: "justify-content:center" }, h("div", { class: "wall-head" }, h("span", { text: t("Live poll", "실시간 투표") }), h("span", { id: "wallCount" })), poll));
    }
    return el;
  }

  // Static slide kinds
  const c = head(slide);
  if (slide.kind === "reframe-examples") {
    const box = h("div", { class: "reframe" });
    for (const r of slide.body) box.append(h("div", {}, h("span", { class: "from", text: r.trait }), h("span", { text: "→" }), h("span", { text: r.possibility })));
    c.append(box);
  } else if (slide.kind === "photo") {
    el.style.gridTemplateColumns = "1.1fr 1fr"; el.style.gap = "4vw";
    el.append(c, h("div", { class: "content" }, h("div", { class: "photo-slot" }, h("div", {}, h("b", { text: slide.photo.label }), h("p", { style: "max-width:36ch", text: slide.photo.note })))));
    return el;
  } else if (ix && ix.type === "calculator") {
    el.classList.add("compact");
    c.append(calculator(t));
    el.append(c);
    return el;
  } else if (ix && ix.type === "compound") {
    el.classList.add("compact");
    c.append(compoundCalc(t));
    el.append(c);
    return el;
  } else if (ix && ix.type === "estimate") {
    el.classList.add("compact");
    c.append(h("div", { class: "tabs", style: "margin-top:24px" }, ix.categories.map((cat) => h("span", { class: "tag", style: "font-size:clamp(13px,1.1vw,16px)" }, cat.label))));
    c.append(h("ul", { class: "blist" }, slide.body.map((b, i) => h("li", {}, h("span", { text: String(i + 1).padStart(2, "0") }), b))));
  } else if (ix && ix.type === "checklist") {
    el.classList.add("compact");
    c.append(h("ul", { class: "blist", style: "grid-template-columns:1fr" }, slide.body.map((b, i) => h("li", { style: "font-size:clamp(16px,1.5vw,24px);padding:12px 0" }, h("span", { text: String(i + 1).padStart(2, "0") }), b))));
  } else if (ix && ix.type === "private") {
    c.append(h("ul", { class: "blist" }, ix.fields.map((f, i) => h("li", {}, h("span", { text: String(i + 1).padStart(2, "0") }), f.label))));
    c.append(h("p", { class: "subtitle", style: "font-size:clamp(14px,1.2vw,18px);color:var(--muted)", text: t("✎ Write this on your phone. ", "✎ 휴대폰에 적어 보세요. ") + ix.privacy }));
  } else if (Array.isArray(slide.body) && slide.body.length && slide.kind !== "cover" && slide.kind !== "closing") {
    if (slide.body.length === 1) c.append(h("div", { class: "accent" }), h("p", { class: "subtitle", style: "font-weight:700;color:var(--ink)", text: slide.body[0] }));
    else c.append(h("ul", { class: "blist" }, slide.body.map((b, i) => h("li", {}, h("span", { text: String(i + 1).padStart(2, "0") }), b))));
  } else if (slide.body && slide.body.length) {
    c.append(h("div", { class: "accent" }), h("p", { class: "subtitle", style: "font-weight:700;color:var(--ink)", text: slide.body[0] }));
  }
  el.append(c);
  return el;
}

function qrBox(big) {
  const box = h("div", {});
  const q = h("div", { class: "qr-box" });
  const svg = qrSvg(joinUrl());
  if (svg) q.innerHTML = svg; else q.append(h("p", { text: t("Loading QR…", "QR 준비 중…") }));
  box.append(q, h("div", { class: "qr-cap" }, `${joinHost()}`, h("b", { text: room.code })));
  if (!svg) setTimeout(() => { const s = qrSvg(joinUrl()); if (s) q.innerHTML = s; }, 400);
  return box;
}

function toggleQr() {
  const o = document.getElementById("qrOverlay");
  if (!o.hidden) { o.hidden = true; return; }
  o.replaceChildren(h("div", { class: "big" }, qrBox(true),
    h("div", {}, h("p", { class: "eyebrow", text: t("Join the session", "강의 입장") }), h("h2", { class: "display", style: "font-size:clamp(40px,6vw,96px)" }, t("Scan, or go to", "스캔하거나 접속하세요"), h("br"), h("u", { text: joinHost() }), h("br"), room.code),
      h("p", { class: "lead", text: t("Press Q or Esc to close.", "Q 또는 Esc로 닫기") }))));
  o.hidden = false;
  o.onclick = () => (o.hidden = true);
}

// Live parts of the current slide
function update() {
  const slide = tr(deck.slides[state.slideIndex]);
  if (room) {
    document.getElementById("count").innerHTML = `<span class="dot"></span><span>${state.participants} ${t("joined", "명 입장")}</span>`;
    const mod = document.getElementById("mod"); mod.setAttribute("aria-pressed", String(state.moderate));
    const pending = state.messages.filter((m) => m.status === "pending").length;
    const qc = document.getElementById("qcount"); qc.hidden = !pending; qc.textContent = pending;
    const drawer = document.getElementById("drawer");
    if (!drawer.hidden && drawer.dataset.mode === "queue") fillQueue();
  }

  const wall = document.getElementById("wall");
  if (wall) {
    const key = wall.dataset.slide;
    const msgs = state.messages.filter((m) => m.slideId === key && m.status === "shown");
    const have = new Set([...wall.querySelectorAll(".msg")].map((n) => Number(n.dataset.id)));
    const want = new Set(msgs.map((m) => m.id));
    wall.querySelectorAll(".msg").forEach((n) => { if (!want.has(Number(n.dataset.id))) n.remove(); });
    for (const m of msgs) if (!have.has(m.id)) wall.prepend(msgCard(m, true));
    let empty = wall.querySelector(".wall-empty");
    if (!msgs.length && !empty) wall.append(h("p", { class: "wall-empty", text: room ? t("Waiting for the first answer…", "첫 답을 기다리고 있어요…") : t("Answers will appear here during a live session.", "실시간 발표 중에 답이 여기에 나타나요.") }));
    if (msgs.length && empty) empty.remove();
    document.getElementById("wallCount").textContent = msgs.length ? String(msgs.length) : "";
  }

  const poll = document.getElementById("poll");
  if (poll) {
    const tally = state.votes[slide.id] || {};
    const total = Object.values(tally).reduce((a, b) => a + b, 0);
    poll.querySelectorAll(".opt").forEach((o) => {
      const n = tally[o.dataset.value] || 0;
      o.querySelector(".num").textContent = total ? `${n} · ${Math.round((n / total) * 100)}%` : "0";
      o.querySelector(".bar i").style.width = total ? `${(n / total) * 100}%` : "0";
    });
    document.getElementById("wallCount").textContent = total ? `${total}${t(total === 1 ? " vote" : " votes", "표")}` : "";
  }

  const orch = document.getElementById("orch");
  if (orch && room) orch.querySelectorAll(".inst").forEach((b) => {
    const n = state.instruments[b.dataset.id] || 0;
    b.querySelector(".inroom").textContent = n ? t(`${n} in the room`, `${n}명 참여`) : insFamily(b.dataset.id);
  });

  const rs = document.getElementById("reviewStats");
  if (rs) rs.textContent = state.reviews ? t(`${state.reviews} reviews · ★ ${state.rating} · ${state.submissions} reflections submitted`, `리뷰 ${state.reviews}개 · ★ ${state.rating} · 성찰 ${state.submissions}개 제출`) : "";
}

function msgCard(m, canHide) {
  const ins = instrumentById(m.avatarId);
  const card = h("article", { class: "msg", "data-id": m.id },
    h("p", { text: m.text }),
    h("div", { class: "who" }, avatar(m.avatarId, 26), h("span", { text: aliasText(m.alias, m.avatarId) })));
  if (canHide && room) card.append(h("button", { class: "x", type: "button", title: t("Hide from screen", "화면에서 숨기기"), onclick: () => hostOp({ op: "status", id: m.id, status: "hidden" }) }, t("Hide", "숨기기")));
  return card;
}

function markPlaying(ids) {
  document.querySelectorAll(".inst").forEach((b) => b.classList.toggle("playing", ids.includes(b.dataset.id)));
}
function playSolo(id) {
  orchestra.play([id]); markPlaying([id]);
  orchestra.onend = () => markPlaying([]);
}
function playAll() {
  const ids = instruments.map((i) => i.id);
  orchestra.play(ids); markPlaying(ids);
  orchestra.onend = () => markPlaying([]);
}

// ---------------- Drawer ----------------
function toggleDrawer(mode) {
  const d = document.getElementById("drawer");
  if (!d.hidden && d.dataset.mode === mode) { d.hidden = true; return; }
  d.dataset.mode = mode; d.hidden = false;
  mode === "notes" ? fillNotes() : fillQueue();
}
function fillNotes() {
  const slide = tr(deck.slides[state.slideIndex]);
  const d = document.getElementById("drawer");
  d.replaceChildren(h("h3", { text: `${t("Speaker notes", "발표자 노트")} · ${state.slideIndex + 1}` }), h("div", { class: "notes" }, (slide.notes || []).map((n) => h("p", { text: n }))));
}
function fillQueue() {
  const d = document.getElementById("drawer");
  const pending = state.messages.filter((m) => m.status === "pending");
  const hidden = state.messages.filter((m) => m.status === "hidden");
  const qa = state.messages.filter((m) => m.channel === "qa" && m.status === "shown");
  d.replaceChildren(
    h("h3", { text: `${t("Waiting for review", "검토 대기")} (${pending.length})` }),
    pending.length > 1 ? h("button", { class: "ctl", style: "margin-bottom:12px", onclick: () => hostOp({ op: "approveAll" }) }, t("Approve all", "모두 승인")) : null,
    h("div", { class: "pending" }, pending.length ? pending.map((m) => {
      const c = msgCard(m, false);
      c.append(h("div", { class: "row" }, h("button", { class: "ctl", onclick: () => hostOp({ op: "status", id: m.id, status: "shown" }) }, t("Show", "표시")),
        h("button", { class: "ctl", onclick: () => hostOp({ op: "status", id: m.id, status: "hidden" }) }, t("Hide", "숨기기"))));
      return c;
    }) : h("p", { class: "muted", text: state.moderate ? t("Nothing waiting.", "대기 중인 메시지가 없어요.") : t("“Review first” is off — messages appear immediately.", "“검토 후 표시”가 꺼져 있어 메시지가 바로 나타나요.") })),
    h("h3", { style: "margin-top:28px", text: `${t("Audience questions", "청중 질문")} (${qa.length})` }),
    h("div", {}, qa.length ? qa.map((m) => msgCard(m, true)) : h("p", { class: "muted", text: t("Students can ask questions from their phones anytime.", "학생들은 언제든 휴대폰으로 질문할 수 있어요.") })),
    hidden.length ? h("h3", { style: "margin-top:28px", text: `${t("Hidden", "숨김")} (${hidden.length})` }) : null,
    h("div", {}, hidden.map((m) => { const c = msgCard(m, false); c.append(h("button", { class: "ctl", onclick: () => hostOp({ op: "status", id: m.id, status: "shown" }) }, t("Show again", "다시 표시"))); return c; })));
}

function toast(text) {
  const el = h("div", { class: "toast", role: "status", text });
  document.body.append(el); setTimeout(() => el.remove(), 4000);
}

// ---------------- Boot ----------------
(async () => {
  [deck, instruments] = await Promise.all([getJson(`/data/${lectureId}.json`), loadInstruments()]);
  orchestra.init(instruments.filter((i) => i.kind !== "bible").map((i) => i.id));
  if (preview) return startStage();
  const code = params.get("room");
  const saved = store.get("hephzibah-host");
  if (code && saved && saved.code === code) {
    try { await api(`/api/rooms/${code}`); room = saved; return startStage(); } catch { store.del("hephzibah-host"); }
  }
  showSetup();
})();
