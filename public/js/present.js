import { api, getJson, loadInstruments, instrumentById, avatar, h, lines, store } from "./common.js";
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
    <a class="btn ghost small" href="/lectures/${lectureId}">Back to lecture</a>
  </div></header>
  <main class="setup">
    <p class="eyebrow">Presenter</p>
    <h1 class="h2">${escape(deck.title)}</h1>
    <p class="lead" style="font-size:20px;margin-top:14px">${escape(deck.track)} · ${deck.slides.length} slides · ~${deck.minutes} min</p>
    <form id="start" style="margin-top:40px">
      ${config.passcodeRequired ? `<label class="field"><span>Presenter passcode</span><input class="input" name="passcode" type="password" autocomplete="current-password" required></label>` : ""}
      <button class="btn full" type="submit" style="width:100%">Start live session ${ARROW}</button>
      <p class="error" id="err" role="alert"></p>
    </form>
    ${last && last.lectureId === lectureId ? `<button class="btn ghost" id="resume" style="width:100%;margin-top:4px">Resume room ${escape(last.code)}</button>` : ""}
    <p class="muted" style="font-size:14px;margin-top:28px">Open this on the projector. Students join from their phones with the code or QR on screen. Keys: ←/→ move · N notes · Q show QR · F fullscreen.</p>
  </main>`;
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
    catch { store.del("hephzibah-host"); resume.textContent = "That room has expired — start a new one"; resume.disabled = true; }
  });
}

function escape(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }

// ---------------- Stage ----------------
function startStage() {
  document.body.className = "stage-body";
  document.title = `${deck.title} · Hephzibah Academy`;
  app.innerHTML = `
  <header class="topbar">
    <a class="brand" href="/lectures/${lectureId}" title="Exit">${LOGO}<span class="brand-name"><b>Hephzibah</b><span>ACADEMY</span></span></a>
    <div class="joinline">${room ? `Join at <u>${escape(joinHost())}</u><b>${room.code}</b>` : `<span class="muted">Preview — no audience connected</span>`}</div>
    <span class="count" id="count">${room ? `<span class="dot"></span><span>0 joined</span>` : ""}</span>
  </header>
  <div class="stage" id="stage"></div>
  <footer class="bottombar">
    <div style="display:flex;align-items:center;gap:16px;flex:1;min-width:0">
      <span class="slide-pos" id="pos"></span><div class="progress"><i id="bar"></i></div>
      <span class="muted hide-sm" id="section" style="white-space:nowrap;overflow:hidden;text-overflow:ellipsis"></span>
    </div>
    <div class="controls">
      ${room ? `<button class="ctl hide-sm" id="mod" aria-pressed="false" title="Review messages before they appear">Review first</button>
      <button class="ctl hide-sm" id="queue">Queue<span class="badge" id="qcount" hidden>0</span></button>
      <button class="ctl hide-sm" id="qr">QR</button>
      <a class="ctl hide-sm" id="export" href="#" download>Export</a>` : ""}
      <button class="ctl hide-sm" id="notes">Notes</button>
      <button class="ctl" id="prev" aria-label="Previous slide">←</button>
      <button class="ctl" id="next" aria-label="Next slide">→</button>
    </div>
  </footer>
  <aside class="drawer" id="drawer" hidden></aside>
  <div class="overlay" id="qrOverlay" hidden></div>`;

  if (room) {
    document.getElementById("export").href = `/api/rooms/${room.code}/export?key=${encodeURIComponent(room.hostKey)}`;
    document.getElementById("mod").onclick = () => hostOp({ op: "moderate", value: !state.moderate });
    document.getElementById("queue").onclick = () => toggleDrawer("queue");
    document.getElementById("qr").onclick = toggleQr;
    connect();
  }
  document.getElementById("notes").onclick = () => toggleDrawer("notes");
  document.getElementById("prev").onclick = () => go(state.slideIndex - 1);
  document.getElementById("next").onclick = () => go(state.slideIndex + 1);
  document.addEventListener("keydown", onKey);
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
    api(`/api/rooms/${room.code}`).catch((err) => { if (err.status === 404) { es.close(); store.del("hephzibah-host"); toast("This room has ended (server restarted). Start a new session."); } });
  };
}

// ---------------- Rendering ----------------
function render() {
  const slide = deck.slides[state.slideIndex];
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
      h("a", { class: "ctl", href: `https://www.youtube.com/watch?v=${v.youtubeId}`, target: "_blank", rel: "noopener", text: "Open on YouTube ↗" })));
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
    for (const ins of instruments) {
      const b = h("button", { class: "inst", type: "button", "data-id": ins.id, onclick: () => playSolo(ins.id, b) },
        avatar(ins.id, 46), h("span", {}, h("b", { text: ins.name }), h("small", { class: "inroom", text: ins.family })));
      grid.append(b);
    }
    const together = h("button", { class: "btn", type: "button", onclick: () => playAll(together) }, "▶ All together");
    const stop = h("button", { class: "btn ghost", type: "button", onclick: () => { orchestra.stop(); markPlaying([]); } }, "■ Stop");
    c.append(grid, h("div", { class: "orch-actions" }, together, stop));
    el.append(c);
    return el;
  }

  const live = ix && (ix.type === "text" || ix.type === "choice" || ix.type === "review");
  if (live && room || (live && ix.type === "choice")) {
    el.classList.add("split-live", "compact");
    const c = head(slide);
    if (ix.type === "text" || ix.type === "review") {
      c.append(h("p", { class: "subtitle", style: "font-size:clamp(14px,1.2vw,18px);color:var(--muted)" }, room ? `Answer on your phone · ${joinHost()}${room.code}` : ""));
      if (ix.type === "review") c.append(h("p", { class: "subtitle", id: "reviewStats", style: "font-weight:700;color:var(--ink)" }));
      const wrap = h("div", { class: "wall-wrap" },
        h("div", { class: "wall-head" }, h("span", { text: ix.channel === "qa" ? "Your questions" : ix.type === "review" ? "What we learned" : "Live answers" }), h("span", { id: "wallCount" })),
        h("div", { class: "wall", id: "wall", "data-slide": ix.channel === "qa" ? "qa" : slide.id }));
      el.append(c, wrap);
    } else {
      const poll = h("div", { class: "poll", id: "poll" });
      for (const o of ix.options) poll.append(h("div", { class: "opt", "data-value": o.value }, h("span", { text: o.label }), h("span", { class: "num", text: "0" }), h("div", { class: "bar" }, h("i", { style: "width:0" }))));
      el.append(c, h("div", { class: "wall-wrap", style: "justify-content:center" }, h("div", { class: "wall-head" }, h("span", { text: "Live poll" }), h("span", { id: "wallCount" })), poll));
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
  } else if (ix && ix.type === "private") {
    c.append(h("ul", { class: "blist" }, ix.fields.map((f, i) => h("li", {}, h("span", { text: String(i + 1).padStart(2, "0") }), f.label))));
    c.append(h("p", { class: "subtitle", style: "font-size:clamp(14px,1.2vw,18px);color:var(--muted)", text: "✎ Write this on your phone. " + ix.privacy }));
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
  if (svg) q.innerHTML = svg; else q.append(h("p", { text: "Loading QR…" }));
  box.append(q, h("div", { class: "qr-cap" }, `${joinHost()}`, h("b", { text: room.code })));
  if (!svg) setTimeout(() => { const s = qrSvg(joinUrl()); if (s) q.innerHTML = s; }, 400);
  return box;
}

function toggleQr() {
  const o = document.getElementById("qrOverlay");
  if (!o.hidden) { o.hidden = true; return; }
  o.replaceChildren(h("div", { class: "big" }, qrBox(true),
    h("div", {}, h("p", { class: "eyebrow", text: "Join the session" }), h("h2", { class: "display", style: "font-size:clamp(40px,6vw,96px)" }, "Scan, or go to", h("br"), h("u", { text: joinHost() }), h("br"), room.code),
      h("p", { class: "lead", text: "Press Q or Esc to close." }))));
  o.hidden = false;
  o.onclick = () => (o.hidden = true);
}

// Live parts of the current slide
function update() {
  const slide = deck.slides[state.slideIndex];
  if (room) {
    document.getElementById("count").innerHTML = `<span class="dot"></span><span>${state.participants} joined</span>`;
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
    if (!msgs.length && !empty) wall.append(h("p", { class: "wall-empty", text: room ? "Waiting for the first answer…" : "Answers will appear here during a live session." }));
    if (msgs.length && empty) empty.remove();
    document.getElementById("wallCount").textContent = msgs.length ? String(msgs.length) : "";
  }

  const poll = document.getElementById("poll");
  if (poll) {
    const t = state.votes[slide.id] || {};
    const total = Object.values(t).reduce((a, b) => a + b, 0);
    poll.querySelectorAll(".opt").forEach((o) => {
      const n = t[o.dataset.value] || 0;
      o.querySelector(".num").textContent = total ? `${n} · ${Math.round((n / total) * 100)}%` : "0";
      o.querySelector(".bar i").style.width = total ? `${(n / total) * 100}%` : "0";
    });
    document.getElementById("wallCount").textContent = total ? `${total} votes` : "";
  }

  const orch = document.getElementById("orch");
  if (orch && room) orch.querySelectorAll(".inst").forEach((b) => {
    const n = state.instruments[b.dataset.id] || 0;
    b.querySelector(".inroom").textContent = n ? `${n} in the room` : instrumentById(b.dataset.id).family;
  });

  const rs = document.getElementById("reviewStats");
  if (rs) rs.textContent = state.reviews ? `${state.reviews} reviews · ★ ${state.rating} · ${state.submissions} reflections submitted` : "";
}

function msgCard(m, canHide) {
  const ins = instrumentById(m.avatarId);
  const card = h("article", { class: "msg", "data-id": m.id },
    h("p", { text: m.text }),
    h("div", { class: "who" }, avatar(m.avatarId, 26), h("span", { text: m.alias || (ins && ins.name) || "Guest" })));
  if (canHide && room) card.append(h("button", { class: "x", type: "button", title: "Hide from screen", onclick: () => hostOp({ op: "status", id: m.id, status: "hidden" }) }, "Hide"));
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
  const slide = deck.slides[state.slideIndex];
  const d = document.getElementById("drawer");
  d.replaceChildren(h("h3", { text: `Speaker notes · ${state.slideIndex + 1}` }), h("div", { class: "notes" }, (slide.notes || []).map((n) => h("p", { text: n }))));
}
function fillQueue() {
  const d = document.getElementById("drawer");
  const pending = state.messages.filter((m) => m.status === "pending");
  const hidden = state.messages.filter((m) => m.status === "hidden");
  const qa = state.messages.filter((m) => m.channel === "qa" && m.status === "shown");
  d.replaceChildren(
    h("h3", { text: `Waiting for review (${pending.length})` }),
    pending.length > 1 ? h("button", { class: "ctl", style: "margin-bottom:12px", onclick: () => hostOp({ op: "approveAll" }) }, "Approve all") : null,
    h("div", { class: "pending" }, pending.length ? pending.map((m) => {
      const c = msgCard(m, false);
      c.append(h("div", { class: "row" }, h("button", { class: "ctl", onclick: () => hostOp({ op: "status", id: m.id, status: "shown" }) }, "Show"),
        h("button", { class: "ctl", onclick: () => hostOp({ op: "status", id: m.id, status: "hidden" }) }, "Hide")));
      return c;
    }) : h("p", { class: "muted", text: state.moderate ? "Nothing waiting." : "“Review first” is off — messages appear immediately." })),
    h("h3", { style: "margin-top:28px", text: `Audience questions (${qa.length})` }),
    h("div", {}, qa.length ? qa.map((m) => msgCard(m, true)) : h("p", { class: "muted", text: "Students can ask questions from their phones anytime." })),
    hidden.length ? h("h3", { style: "margin-top:28px", text: `Hidden (${hidden.length})` }) : null,
    h("div", {}, hidden.map((m) => { const c = msgCard(m, false); c.append(h("button", { class: "ctl", onclick: () => hostOp({ op: "status", id: m.id, status: "shown" }) }, "Show again")); return c; })));
}

function toast(text) {
  const t = h("div", { class: "toast", role: "status", text });
  document.body.append(t); setTimeout(() => t.remove(), 4000);
}

// ---------------- Boot ----------------
(async () => {
  [deck, instruments] = await Promise.all([getJson(`/data/${lectureId}.json`), loadInstruments()]);
  orchestra.init(instruments.map((i) => i.id));
  if (preview) return startStage();
  const code = params.get("room");
  const saved = store.get("hephzibah-host");
  if (code && saved && saved.code === code) {
    try { await api(`/api/rooms/${code}`); room = saved; return startStage(); } catch { store.del("hephzibah-host"); }
  }
  showSetup();
})();
