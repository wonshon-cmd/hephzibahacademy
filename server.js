// Hephzibah Academy — website + live lecture server.
// Zero dependencies: Node's http module, static files, JSON API, and
// Server-Sent Events (SSE) for real-time updates between the presenter
// screen and audience phones.
//
// Live rooms are kept in memory. Restarting the server ends all rooms.

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const PUBLIC = path.join(ROOT, "public");
const PORT = Number(process.env.PORT) || 3000;
const HOST_PASSCODE = process.env.HOST_PASSCODE || "";
// Admin password unlocks protected lectures ("protected": true in the lecture JSON).
// If ADMIN_PASSCODE is not set, protected lectures stay locked for everyone.
const ADMIN_PASSCODE = process.env.ADMIN_PASSCODE || "";
const ADMIN_SECRET = crypto.randomBytes(32);
function adminCookie() {
  const exp = Date.now() + 12 * 60 * 60 * 1000;
  const sig = crypto.createHmac("sha256", ADMIN_SECRET).update("admin:" + exp).digest("base64url");
  return `${exp}.${sig}`;
}
function isAdmin(req) {
  const m = /(?:^|;\s*)hz_admin=([^;]+)/.exec(req.headers.cookie || "");
  if (!m) return false;
  const [exp, sig] = m[1].split(".");
  if (!exp || !sig || Number(exp) < Date.now()) return false;
  const want = crypto.createHmac("sha256", ADMIN_SECRET).update("admin:" + exp).digest("base64url");
  return safeEqual(sig, want);
}
const ROOM_TTL_MS = 12 * 60 * 60 * 1000;
const MAX_ROOMS = 200;
const MAX_PARTICIPANTS = 500;
const MAX_MESSAGES = 3000;

// ---------- Lecture data ----------
const LECTURES = {};
for (const file of fs.readdirSync(path.join(PUBLIC, "data"))) {
  if (!file.endsWith(".json")) continue;
  const deck = JSON.parse(fs.readFileSync(path.join(PUBLIC, "data", file), "utf8"));
  if (Array.isArray(deck.slides)) LECTURES[deck.id] = deck;
}

const INSTRUMENTS = JSON.parse(fs.readFileSync(path.join(PUBLIC, "data", "instruments.json"), "utf8"));
const BIBLE = JSON.parse(fs.readFileSync(path.join(PUBLIC, "data", "bible.json"), "utf8"));
// Each lecture chooses its pseudonym set ("pseudonyms": "bible" in its JSON); default is orchestra instruments.
const avatarPool = (room) => (LECTURES[room.lectureId].pseudonyms === "bible" ? BIBLE : INSTRUMENTS);
const PERSONALITY = JSON.parse(fs.readFileSync(path.join(PUBLIC, "data", "personality.json"), "utf8"));
const DIM_IDS = PERSONALITY.dimensions.map((d) => d.id);

// Student submissions (review + reflections + optional email) are appended to a
// JSON Lines file so they survive restarts. Set DATA_DIR to a persistent disk.
const DATA_DIR = path.resolve(process.env.DATA_DIR || path.join(ROOT, "data"));
fs.mkdirSync(DATA_DIR, { recursive: true });
const SUBMISSIONS_FILE = path.join(DATA_DIR, "submissions.jsonl");
const MENTORS_FILE = path.join(DATA_DIR, "mentors.jsonl");
const APPLICATIONS_FILE = path.join(DATA_DIR, "applications.jsonl");
const COHORT_FILE = path.join(DATA_DIR, "cohort.jsonl");

// ---------- Email (verification codes) ----------
// Uses Resend's HTTP API when RESEND_API_KEY is set (https://resend.com).
// Without it, codes are printed to the server log so you can test locally.
const RESEND_API_KEY = process.env.RESEND_API_KEY || "";
const MAIL_FROM = process.env.MAIL_FROM || "Beulah Venture <onboarding@resend.dev>";
async function sendEmail(to, subject, text) {
  if (!RESEND_API_KEY) {
    console.log(`[email not configured] to=${to} subject="${subject}"\n${text}`);
    return { delivered: false };
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { authorization: `Bearer ${RESEND_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({ from: MAIL_FROM, to: [to], subject, text }),
  });
  if (!r.ok) { console.error("Email send failed", r.status, await r.text().catch(() => "")); throw httpError(502, "We couldn’t send the email. Please try again in a minute."); }
  return { delivered: true };
}

// Pending email verifications and verified application sessions (in memory).
const verifications = new Map(); // email -> {name, codeHash, expires, tries, sentAt}
const appSessions = new Map();   // token -> {name, email, expires}
const hash = (v) => crypto.createHash("sha256").update(String(v)).digest("hex");
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
function saveSubmission(record) {
  fs.appendFile(SUBMISSIONS_FILE, JSON.stringify(record) + "\n", (err) => { if (err) console.error("Could not save submission", err); });
}

// ---------- Rooms ----------
/** @type {Map<string, any>} */
const rooms = new Map();
const CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function newCode() {
  for (let tries = 0; tries < 50; tries++) {
    let code = "";
    for (let i = 0; i < 5; i++) code += CODE_ALPHABET[crypto.randomInt(CODE_ALPHABET.length)];
    if (!rooms.has(code)) return code;
  }
  throw new Error("Could not allocate room code");
}

const token = () => crypto.randomBytes(18).toString("base64url");
const safeEqual = (a, b) => {
  const x = Buffer.from(String(a)), y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

function createRoom(lectureId) {
  const now = Date.now();
  for (const [code, r] of rooms) if (now - r.touched > ROOM_TTL_MS) closeRoom(code);
  if (rooms.size >= MAX_ROOMS) throw httpError(503, "Too many live rooms right now.");
  const room = {
    code: newCode(),
    hostKey: token(),
    lectureId,
    slideIndex: 0,
    moderate: false,
    ended: false,
    created: now,
    touched: now,
    participants: new Map(), // token -> participant
    participantsById: new Map(),
    messages: [],            // {id, pid, slideId, channel, text, status, at}
    votes: new Map(),        // slideId -> Map(pid -> value)
    reviews: [],             // {pid, rating, review, learned}
    submitted: new Set(),    // pids that sent final reflections
    hostClients: new Set(),
    audienceClients: new Set(),
    seq: 0,
  };
  rooms.set(room.code, room);
  return room;
}

function closeRoom(code) {
  const room = rooms.get(code);
  if (!room) return;
  for (const res of [...room.hostClients, ...room.audienceClients]) { try { res.end(); } catch {} }
  rooms.delete(code);
}

function getRoom(code) {
  const room = rooms.get(String(code || "").toUpperCase());
  if (!room) throw httpError(404, "That room code wasn’t found. Check the code on the screen.");
  room.touched = Date.now();
  return room;
}

function requireHost(room, key) {
  if (!key || !safeEqual(key, room.hostKey)) throw httpError(403, "Presenter key is not valid for this room.");
}

function requireParticipant(room, tok) {
  const p = tok && room.participants.get(tok);
  if (!p) throw httpError(401, "Please join the room again.");
  p.seen = Date.now();
  return p;
}

function pickAlias(room, avoidId) {
  const used = new Set([...room.participants.values()].map((p) => p.avatarId));
  const all = avatarPool(room);
  let pool = all.filter((a) => a.id !== avoidId && !used.has(a.id));
  if (!pool.length) pool = all.filter((a) => a.id !== avoidId);
  return pool[crypto.randomInt(pool.length)];
}

function aliasLabel(room, avatar) {
  // Many students may share one of the 12 characters; add a number to keep them distinct.
  const n = [...room.participants.values()].filter((p) => p.avatarId === avatar.id).length;
  return n === 0 ? avatar.name : `${avatar.name} ${n + 1}`;
}

const slideOf = (room) => LECTURES[room.lectureId].slides[room.slideIndex];

function publicMessage(room, m) {
  const p = room.participantsById.get(m.pid);
  return { id: m.id, slideId: m.slideId, channel: m.channel, text: m.text, status: m.status, at: m.at,
    alias: p ? p.alias : "Guest", avatarId: p ? p.avatarId : null };
}

function tally(room, slideId) {
  const out = {};
  const v = room.votes.get(slideId);
  if (v) for (const value of v.values()) out[value] = (out[value] || 0) + 1;
  return out;
}

function onlineCount(room) {
  const cutoff = Date.now() - 45_000;
  let n = 0;
  for (const p of room.participants.values()) if (p.seen > cutoff) n++;
  return n;
}

function instrumentCounts(room) {
  const out = {};
  for (const p of room.participants.values()) out[p.avatarId] = (out[p.avatarId] || 0) + 1;
  return out;
}

function hostSnapshot(room) {
  const slide = slideOf(room);
  return {
    code: room.code, lectureId: room.lectureId, slideIndex: room.slideIndex, slideId: slide.id,
    moderate: room.moderate, ended: room.ended,
    participants: room.participants.size, online: onlineCount(room),
    instruments: instrumentCounts(room),
    reviews: room.reviews.length,
    rating: room.reviews.length ? Math.round((room.reviews.reduce((a, r) => a + r.rating, 0) / room.reviews.length) * 10) / 10 : null,
    submissions: room.submitted.size,
    votes: Object.fromEntries([...room.votes.keys()].map((id) => [id, tally(room, id)])),
    messages: room.messages.map((m) => publicMessage(room, m)),
  };
}

function audienceSnapshot(room) {
  const slide = slideOf(room);
  return { code: room.code, lectureId: room.lectureId, slideIndex: room.slideIndex, slideId: slide.id, ended: room.ended };
}

function sse(res, data) { res.write(`data: ${JSON.stringify(data)}\n\n`); }

// Coalesce bursts of changes into one broadcast per tick.
function broadcast(room, { audience = false } = {}) {
  room.pendingAudience ||= audience;
  if (room.broadcastQueued) return;
  room.broadcastQueued = true;
  setTimeout(() => {
    room.broadcastQueued = false;
    const h = hostSnapshot(room);
    for (const res of room.hostClients) sse(res, h);
    if (room.pendingAudience) {
      room.pendingAudience = false;
      const a = audienceSnapshot(room);
      for (const res of room.audienceClients) sse(res, a);
    }
  }, 60);
}

// ---------- Helpers ----------
function httpError(status, message) { const e = new Error(message); e.status = status; return e; }

function sendJson(res, status, body) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" });
  res.end(JSON.stringify(body));
}

async function readJson(req) {
  let size = 0; const chunks = [];
  for await (const c of req) { size += c.length; if (size > 16_384) throw httpError(413, "Request too large."); chunks.push(c); }
  if (!chunks.length) return {};
  try { return JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch { throw httpError(400, "Invalid JSON."); }
}

function cleanText(s, max) {
  return String(s ?? "").replace(/[\u0000-\u0008\u000b-\u001f\u007f​-‏‪-‮]/g, "")
    .replace(/\s+/g, " ").trim().slice(0, max);
}

function sameOrigin(req) {
  // Basic CSRF guard for state-changing requests from browsers.
  const origin = req.headers.origin;
  if (!origin) return true;
  try { return new URL(origin).host === req.headers.host; } catch { return false; }
}

// ---------- API ----------
async function api(req, res, url) {
  const parts = url.pathname.split("/").filter(Boolean); // ["api", ...]
  const method = req.method;
  if (method !== "GET" && !sameOrigin(req)) throw httpError(403, "Cross-origin request blocked.");

  // Optional instrument recordings in public/audio (e.g. oboe.mp3)
  if (parts[1] === "audio" && method === "GET") {
    let files = [];
    try { files = fs.readdirSync(path.join(PUBLIC, "audio")).filter((f) => /^[a-z]+\.(mp3|m4a|ogg|wav)$/.test(f)); } catch {}
    return sendJson(res, 200, files);
  }

  if (parts[1] === "config" && method === "GET") {
    return sendJson(res, 200, { passcodeRequired: Boolean(HOST_PASSCODE) });
  }

  // ----- Beulah Venture applications (First Track) -----
  // 1) POST /api/apply/start {name, email, lang} -> emails a 6-digit code
  if (parts[1] === "apply" && parts[2] === "start" && method === "POST") {
    const body = await readJson(req);
    const name = cleanText(body.name, 120);
    const email = cleanText(body.email, 200).toLowerCase();
    if (!name) throw httpError(400, "Please add your name.");
    if (!EMAIL_RE.test(email)) throw httpError(400, "Please add a valid email.");
    const now = Date.now();
    const prev = verifications.get(email);
    if (prev && now - prev.sentAt < 60_000) throw httpError(429, "We just sent a code. Please wait a minute before asking again.");
    if (verifications.size > 5000) for (const [k, v] of verifications) if (v.expires < now) verifications.delete(k);
    const code = String(crypto.randomInt(100000, 1000000));
    verifications.set(email, { name, codeHash: hash(code + email), expires: now + 15 * 60_000, tries: 0, sentAt: now });
    const ko = body.lang === "ko";
    const sent = await sendEmail(email,
      ko ? `쁄라 벤처 인증 코드: ${code}` : `Your Beulah Venture code: ${code}`,
      ko ? `${name}님, 안녕하세요.\n\n인증 코드는 ${code} 입니다. 15분 동안 유효해요.\n\n쁄라 벤처 · 헵시바 아카데미`
         : `Hi ${name},\n\nYour verification code is ${code}. It expires in 15 minutes.\n\nBeulah Venture · Hephzibah Academy`);
    return sendJson(res, 200, { ok: true, delivered: sent.delivered });
  }

  // 2) POST /api/apply/verify {email, code} -> application token
  if (parts[1] === "apply" && parts[2] === "verify" && method === "POST") {
    const body = await readJson(req);
    const email = cleanText(body.email, 200).toLowerCase();
    const v = verifications.get(email);
    if (!v || v.expires < Date.now()) throw httpError(400, "That code has expired. Please request a new one.");
    if (++v.tries > 5) { verifications.delete(email); throw httpError(429, "Too many tries. Please request a new code."); }
    if (!safeEqual(hash(String(body.code || "").trim() + email), v.codeHash)) throw httpError(400, "That code isn’t right. Please check your email and try again.");
    verifications.delete(email);
    const tok = token();
    appSessions.set(tok, { name: v.name, email, expires: Date.now() + 24 * 60 * 60_000 });
    return sendJson(res, 200, { token: tok, name: v.name, email });
  }

  // 3) POST /api/apply/submit {token, ...answers}
  if (parts[1] === "apply" && parts[2] === "submit" && method === "POST") {
    const body = await readJson(req);
    const sess = appSessions.get(body.token);
    if (!sess || sess.expires < Date.now()) throw httpError(401, "Your session expired. Please verify your email again.");
    if (body.venture101 !== true) throw httpError(400, "This track is for Venture 101 graduates.");
    const F = { company: 160, oneLiner: 200, problem: 1500, customers: 1500, stage: 40, traction: 1500, values: 1500, team: 1500, ask: 600, website: 300, cohort: 120 };
    const answers = {};
    for (const [k, max] of Object.entries(F)) answers[k] = cleanText(body[k], max);
    for (const k of ["company", "oneLiner", "problem", "customers", "values"]) if (!answers[k]) throw httpError(400, "Please fill in the required fields.");
    const record = { at: new Date().toISOString(), track: "First Track 2027", name: sess.name, email: sess.email, emailVerified: true, venture101: true, ...answers };
    fs.appendFile(APPLICATIONS_FILE, JSON.stringify(record) + "\n", (err) => { if (err) console.error("Could not save application", err); });
    appSessions.delete(body.token);
    sendEmail(sess.email, body.lang === "ko" ? "쁄라 벤처 지원이 접수되었어요" : "We received your Beulah Venture application",
      body.lang === "ko" ? `${sess.name}님, 지원해 주셔서 감사해요.\n\n2주 안에 답장드릴게요.\n\n쁄라 벤처 · First Track 2027`
                         : `Thank you, ${sess.name}.\n\nWe’ll reply within 2 weeks.\n\nBeulah Venture · First Track 2027`).catch(() => {});
    return sendJson(res, 201, { ok: true });
  }

  // GET /api/applications.csv?passcode=HOST_PASSCODE
  if (parts[1] === "applications.csv" && method === "GET") {
    if (!HOST_PASSCODE || !safeEqual(url.searchParams.get("passcode") || "", HOST_PASSCODE)) throw httpError(403, "Passcode required.");
    let text = ""; try { text = fs.readFileSync(APPLICATIONS_FILE, "utf8"); } catch {}
    const cols = ["at", "track", "name", "email", "company", "oneLiner", "stage", "problem", "customers", "traction", "values", "team", "ask", "website", "cohort"];
    const esc = (v) => { let t = String(v ?? ""); if (/^[=+\-@\t\r]/.test(t)) t = "'" + t; return `"${t.replace(/"/g, '""')}"`; };
    const rows = [cols.join(",")];
    for (const line of text.split("\n")) { if (!line) continue; try { const r = JSON.parse(line); rows.push(cols.map((c) => esc(r[c])).join(",")); } catch {} }
    res.writeHead(200, { "content-type": "text/csv; charset=utf-8", "cache-control": "no-store", "content-disposition": 'attachment; filename="beulah-applications.csv"' });
    return res.end("\ufeff" + rows.join("\r\n"));
  }

  // POST /api/cohort — sign up for a cohort (live session + class + mentoring, check-in after each)
  if (parts[1] === "cohort" && parts.length === 2 && method === "POST") {
    const body = await readJson(req);
    const TRACKS = ["my-user-manual", "startup", "finance"];
    const ROLES = ["student", "parent", "adult"];
    const name = cleanText(body.name, 120);
    const email = cleanText(body.email, 200).toLowerCase();
    const track = TRACKS.includes(body.track) ? body.track : "";
    const role = ROLES.includes(body.role) ? body.role : "";
    const grade = cleanText(body.grade, 60);
    const church = cleanText(body.church, 160);
    const hope = cleanText(body.hope, 1000);
    if (!name) throw httpError(400, "Please add your name.");
    if (!EMAIL_RE.test(email)) throw httpError(400, "Please add a valid email.");
    if (!track) throw httpError(400, "Please choose a track.");
    fs.appendFile(COHORT_FILE, JSON.stringify({ at: new Date().toISOString(), name, email, track, role, grade, church, hope, guardianOk: body.guardianOk === true }) + "\n",
      (err) => { if (err) console.error("Could not save cohort sign-up", err); });
    return sendJson(res, 201, { ok: true });
  }

  // GET /api/cohort.csv?passcode=HOST_PASSCODE
  if (parts[1] === "cohort.csv" && method === "GET") {
    if (!HOST_PASSCODE || !safeEqual(url.searchParams.get("passcode") || "", HOST_PASSCODE)) throw httpError(403, "Passcode required.");
    let text = ""; try { text = fs.readFileSync(COHORT_FILE, "utf8"); } catch {}
    const cols = ["at", "name", "email", "track", "role", "grade", "church", "hope", "guardianOk"];
    const esc = (v) => { let t = String(v ?? ""); if (/^[=+\-@\t\r]/.test(t)) t = "'" + t; return `"${t.replace(/"/g, '""')}"`; };
    const rows = [cols.join(",")];
    for (const line of text.split("\n")) { if (!line) continue; try { const r = JSON.parse(line); rows.push(cols.map((c) => esc(r[c])).join(",")); } catch {} }
    res.writeHead(200, { "content-type": "text/csv; charset=utf-8", "cache-control": "no-store", "content-disposition": 'attachment; filename="hephzibah-cohort.csv"' });
    return res.end("\ufeff" + rows.join("\r\n"));
  }

  // POST /api/mentors — adult volunteer / donor sign-up
  if (parts[1] === "mentors" && parts.length === 2 && method === "POST") {
    const body = await readJson(req);
    const WAYS = ["fund", "career", "teach", "feedback", "invest"];
    const name = cleanText(body.name, 120);
    const email = cleanText(body.email, 200).toLowerCase();
    const field = cleanText(body.field, 200);
    const note = cleanText(body.note, 1000);
    const ways = Array.isArray(body.ways) ? [...new Set(body.ways.filter((w) => WAYS.includes(w)))] : [];
    if (!name) throw httpError(400, "Please add your name.");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw httpError(400, "Please add a valid email.");
    if (!ways.length) throw httpError(400, "Choose at least one way to help.");
    fs.appendFile(MENTORS_FILE, JSON.stringify({ at: new Date().toISOString(), name, email, field, ways, note }) + "\n",
      (err) => { if (err) console.error("Could not save mentor sign-up", err); });
    return sendJson(res, 201, { ok: true });
  }

  // GET /api/mentors.csv?passcode=HOST_PASSCODE — download sign-ups
  if (parts[1] === "mentors.csv" && method === "GET") {
    if (!HOST_PASSCODE || !safeEqual(url.searchParams.get("passcode") || "", HOST_PASSCODE)) throw httpError(403, "Passcode required.");
    let text = ""; try { text = fs.readFileSync(MENTORS_FILE, "utf8"); } catch {}
    const cols = ["at", "name", "email", "field", "ways", "note"];
    const esc = (v) => { let t = Array.isArray(v) ? v.join(" ") : String(v ?? ""); if (/^[=+\-@\t\r]/.test(t)) t = "'" + t; return `"${t.replace(/"/g, '""')}"`; };
    const rows = [cols.join(",")];
    for (const line of text.split("\n")) { if (!line) continue; try { const r = JSON.parse(line); rows.push(cols.map((c) => esc(r[c])).join(",")); } catch {} }
    res.writeHead(200, { "content-type": "text/csv; charset=utf-8", "cache-control": "no-store", "content-disposition": 'attachment; filename="hephzibah-mentors.csv"' });
    return res.end("\ufeff" + rows.join("\r\n"));
  }

  // Admin: POST /api/admin/login {passcode} · GET /api/admin/status · POST /api/admin/logout
  if (parts[1] === "admin") {
    if (parts[2] === "status" && method === "GET") return sendJson(res, 200, { admin: isAdmin(req) });
    if (parts[2] === "login" && method === "POST") {
      const body = await readJson(req);
      await new Promise((r) => setTimeout(r, 400)); // slow down guessing
      if (!ADMIN_PASSCODE || !safeEqual(String(body.passcode || ""), ADMIN_PASSCODE)) throw httpError(403, "Incorrect admin password.");
      const secure = (req.headers["x-forwarded-proto"] || "").includes("https") ? "; Secure" : "";
      res.setHeader("set-cookie", `hz_admin=${adminCookie()}; Path=/; HttpOnly; SameSite=Lax; Max-Age=43200${secure}`);
      return sendJson(res, 200, { ok: true });
    }
    if (parts[2] === "logout" && method === "POST") {
      res.setHeader("set-cookie", "hz_admin=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0");
      return sendJson(res, 200, { ok: true });
    }
  }

  // POST /api/rooms  {lectureId, passcode}
  if (parts[1] === "rooms" && parts.length === 2 && method === "POST") {
    const body = await readJson(req);
    if (HOST_PASSCODE && !safeEqual(body.passcode || "", HOST_PASSCODE)) throw httpError(403, "Incorrect presenter passcode.");
    const lectureId = String(body.lectureId || "");
    if (!LECTURES[lectureId]) throw httpError(404, "Lecture not found.");
    if (LECTURES[lectureId].protected && !isAdmin(req)) throw httpError(403, "This lecture needs the admin password.");
    const room = createRoom(lectureId);
    return sendJson(res, 201, { code: room.code, hostKey: room.hostKey, lectureId });
  }

  if (parts[1] !== "rooms" || !parts[2]) throw httpError(404, "Not found.");
  const room = getRoom(parts[2]);
  const action = parts.slice(3).join("/");

  // GET /api/rooms/:code  — public room info
  if (!action && method === "GET") return sendJson(res, 200, audienceSnapshot(room));

  // GET /api/rooms/:code/stream?key=...  (host) or no key (audience)
  if (action === "stream" && method === "GET") {
    const key = url.searchParams.get("key");
    const isHost = Boolean(key);
    if (isHost) requireHost(room, key);
    const tok = url.searchParams.get("token");
    res.writeHead(200, { "content-type": "text/event-stream", "cache-control": "no-store", connection: "keep-alive", "x-accel-buffering": "no" });
    res.write("retry: 2000\n\n");
    const set = isHost ? room.hostClients : room.audienceClients;
    set.add(res);
    sse(res, isHost ? hostSnapshot(room) : audienceSnapshot(room));
    const ping = setInterval(() => {
      res.write(": ping\n\n");
      const p = tok && room.participants.get(tok);
      if (p) p.seen = Date.now();
    }, 15_000);
    const p = tok && room.participants.get(tok);
    if (p) { p.seen = Date.now(); broadcast(room); }
    req.on("close", () => { clearInterval(ping); set.delete(res); });
    return;
  }

  const body = method === "POST" ? await readJson(req) : {};

  // POST /api/rooms/:code/join {token?, reroll?}
  if (action === "join" && method === "POST") {
    let p = body.token && room.participants.get(body.token);
    if (p && body.reroll) {
      const avatar = pickAlias(room, p.avatarId);
      p.avatarId = "__none"; // exclude self from numbering
      p.alias = aliasLabel(room, avatar); p.avatarId = avatar.id;
    } else if (!p) {
      if (room.ended) throw httpError(410, "This session has ended.");
      if (room.participants.size >= MAX_PARTICIPANTS) throw httpError(503, "This room is full.");
      const avatar = pickAlias(room);
      p = { id: crypto.randomUUID(), token: token(), avatarId: avatar.id, alias: aliasLabel(room, avatar), seen: Date.now(), lastPost: 0, posts: 0 };
      room.participants.set(p.token, p);
      room.participantsById.set(p.id, p);
    }
    p.seen = Date.now();
    broadcast(room);
    return sendJson(res, 200, { token: p.token, id: p.id, alias: p.alias, avatarId: p.avatarId });
  }

  // POST /api/rooms/:code/message {token, slideId, text}
  if (action === "message" && method === "POST") {
    if (room.ended) throw httpError(410, "This session has ended.");
    const p = requireParticipant(room, body.token);
    const deck = LECTURES[room.lectureId];
    const slide = deck.slides.find((s) => s.id === body.slideId);
    const ix = slide && slide.interaction;
    let channel;
    if (body.channel === "qa") channel = "qa";
    else if (ix && ix.type === "text" && !ix.channel) channel = "slide";
    else throw httpError(400, "This slide doesn’t take messages.");
    if (channel === "slide" && slide.id !== slideOf(room).id) throw httpError(409, "The presenter has moved to another slide.");
    const max = channel === "qa" ? 200 : ix.maxLength || 180;
    const text = cleanText(body.text, max);
    if (!text) throw httpError(400, "Type something first.");
    const now = Date.now();
    if (now - p.lastPost < 2500) throw httpError(429, "Slow down a little — try again in a moment.");
    if (p.posts >= 60 || room.messages.length >= MAX_MESSAGES) throw httpError(429, "Message limit reached.");
    p.lastPost = now; p.posts++;
    const m = { id: ++room.seq, pid: p.id, slideId: channel === "qa" ? "qa" : slide.id, channel, text,
      status: room.moderate ? "pending" : "shown", at: now };
    room.messages.push(m);
    broadcast(room);
    return sendJson(res, 201, { id: m.id, status: m.status });
  }

  // POST /api/rooms/:code/vote {token, slideId, value}
  if (action === "vote" && method === "POST") {
    if (room.ended) throw httpError(410, "This session has ended.");
    const p = requireParticipant(room, body.token);
    const slide = LECTURES[room.lectureId].slides.find((s) => s.id === body.slideId);
    const ix = slide && slide.interaction;
    if (!ix || ix.type !== "choice") throw httpError(400, "This slide doesn’t take votes.");
    if (!ix.options.some((o) => o.value === body.value)) throw httpError(400, "Unknown option.");
    if (!room.votes.has(slide.id)) room.votes.set(slide.id, new Map());
    room.votes.get(slide.id).set(p.id, body.value);
    broadcast(room);
    return sendJson(res, 200, { ok: true });
  }

  // POST /api/rooms/:code/consent {token, research, contact} — optional consents (finance lecture)
  if (action === "consent" && method === "POST") {
    const p = requireParticipant(room, body.token);
    p.consent = { research: body.research === true, contact: body.contact === true };
    saveSubmission({ type: "consent", at: new Date().toISOString(), room: room.code, lecture: room.lectureId,
      participant: p.id, pseudonym: p.alias, research: p.consent.research, contact: p.consent.contact });
    return sendJson(res, 200, { ok: true });
  }

  // POST /api/rooms/:code/review {token, learned, rating, review}
  // "What I learned" goes to the live wall; the rating/review is for the presenter only.
  if (action === "review" && method === "POST") {
    const p = requireParticipant(room, body.token);
    const learned = cleanText(body.learned, 200);
    const rating = Number(body.rating);
    const review = cleanText(body.review, 600);
    if (!learned) throw httpError(400, "Share one thing you learned first.");
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) throw httpError(400, "Choose a rating from 1 to 5.");
    const slide = LECTURES[room.lectureId].slides.find((s) => s.kind === "review");
    const existing = room.reviews.find((r) => r.pid === p.id);
    if (existing) Object.assign(existing, { learned, rating, review });
    else {
      room.reviews.push({ pid: p.id, learned, rating, review });
      room.messages.push({ id: ++room.seq, pid: p.id, slideId: slide ? slide.id : "review", channel: "slide", text: learned,
        status: room.moderate ? "pending" : "shown", at: Date.now() });
    }
    saveSubmission({ type: "review", at: new Date().toISOString(), room: room.code, lecture: room.lectureId,
      participant: p.id, instrument: p.alias, learned, rating, review });
    broadcast(room);
    return sendJson(res, 200, { ok: true });
  }

  // POST /api/rooms/:code/submit {token, results, useStrength, useWeakness, email, consent}
  if (action === "submit" && method === "POST") {
    const p = requireParticipant(room, body.token);
    if (!room.reviews.some((r) => r.pid === p.id)) throw httpError(409, "Please review the lecture first.");
    const results = {};
    for (const id of DIM_IDS) {
      const v = body.results && body.results[id];
      if (v === "low" || v === "mid" || v === "high") results[id] = v;
    }
    const useStrength = cleanText(body.useStrength, 600);
    const useWeakness = cleanText(body.useWeakness, 600);
    const email = cleanText(body.email, 200).toLowerCase();
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) throw httpError(400, "That email doesn’t look right.");
    if (email && body.consent !== true) throw httpError(400, "Please check the box to agree to receive job matches by email.");
    if (!useStrength && !useWeakness) throw httpError(400, "Write at least one reflection before submitting.");
    room.submitted.add(p.id);
    saveSubmission({ type: "reflection", at: new Date().toISOString(), room: room.code, lecture: room.lectureId,
      participant: p.id, instrument: p.alias, results, useStrength, useWeakness, email: email || null, emailConsent: Boolean(email) });
    broadcast(room);
    return sendJson(res, 200, { ok: true });
  }

  // GET /api/rooms/:code/export?key=...  — presenter download of this room's submissions (CSV)
  if (action === "export" && method === "GET") {
    requireHost(room, url.searchParams.get("key"));
    const rows = [];
    let text = "";
    try { text = fs.readFileSync(SUBMISSIONS_FILE, "utf8"); } catch {}
    const byPid = new Map();
    for (const line of text.split("\n")) {
      if (!line) continue;
      let r; try { r = JSON.parse(line); } catch { continue; }
      if (r.room !== room.code) continue;
      const row = byPid.get(r.participant) || { instrument: r.instrument };
      Object.assign(row, r.type === "review" ? { learned: r.learned, rating: r.rating, review: r.review }
        : { ...Object.fromEntries(DIM_IDS.map((d) => [d, r.results[d] || ""])), useStrength: r.useStrength, useWeakness: r.useWeakness, email: r.email || "" , submittedAt: r.at });
      byPid.set(r.participant, row);
    }
    const cols = ["instrument", "learned", "rating", "review", ...DIM_IDS, "useStrength", "useWeakness", "email", "submittedAt"];
    // Quote every cell, and neutralise spreadsheet formulas (CSV injection).
    const esc = (v) => { let t = String(v ?? ""); if (/^[=+\-@\t\r]/.test(t)) t = "'" + t; return `"${t.replace(/"/g, '""')}"`; };
    rows.push(cols.join(","));
    for (const r of byPid.values()) rows.push(cols.map((c) => esc(r[c])).join(","));
    res.writeHead(200, { "content-type": "text/csv; charset=utf-8", "cache-control": "no-store",
      "content-disposition": `attachment; filename="hephzibah-${room.code}-responses.csv"` });
    return res.end("\ufeff" + rows.join("\r\n"));
  }

  // POST /api/rooms/:code/host {key, op, ...}
  if (action === "host" && method === "POST") {
    requireHost(room, body.key);
    const deck = LECTURES[room.lectureId];
    switch (body.op) {
      case "slide": {
        const i = Number(body.index);
        if (!Number.isInteger(i) || i < 0 || i >= deck.slides.length) throw httpError(400, "Bad slide index.");
        room.slideIndex = i; broadcast(room, { audience: true }); break;
      }
      case "moderate": room.moderate = Boolean(body.value); broadcast(room); break;
      case "status": {
        const m = room.messages.find((x) => x.id === Number(body.id));
        if (!m) throw httpError(404, "Message not found.");
        if (!["shown", "hidden", "pending"].includes(body.status)) throw httpError(400, "Bad status.");
        m.status = body.status; broadcast(room); break;
      }
      case "approveAll":
        for (const m of room.messages) if (m.status === "pending") m.status = "shown";
        broadcast(room); break;
      case "end": room.ended = true; broadcast(room, { audience: true }); break;
      case "reopen": room.ended = false; broadcast(room, { audience: true }); break;
      default: throw httpError(400, "Unknown host operation.");
    }
    return sendJson(res, 200, { ok: true });
  }

  throw httpError(404, "Not found.");
}

// ---------- Static files ----------
const TYPES = { ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8", ".svg": "image/svg+xml", ".png": "image/png", ".ico": "image/x-icon",
  ".woff": "font/woff", ".woff2": "font/woff2", ".txt": "text/plain; charset=utf-8", ".webp": "image/webp", ".jpg": "image/jpeg",
  ".mp3": "audio/mpeg", ".m4a": "audio/mp4", ".ogg": "audio/ogg", ".wav": "audio/wav" };

const ROUTES = { "/": "/index.html", "/lectures": "/lectures.html", "/present": "/present.html", "/join": "/join.html", "/support": "/support.html", "/mentors": "/mentors.html", "/apply": "/apply.html", "/personality": "/personality.html", "/cohort": "/cohort.html",
  "/lectures/my-user-manual": "/lectures/my-user-manual.html", "/lectures/basic-finance": "/lectures/basic-finance.html" };

function serveStatic(req, res, url) {
  let p = decodeURIComponent(url.pathname);
  if (/^\/j\/[A-Za-z0-9]{3,8}$/.test(p)) { // short join link: /j/CODE
    res.writeHead(302, { location: `/join?code=${p.slice(3).toUpperCase()}` }); return res.end();
  }
  p = ROUTES[p.replace(/\/$/, "") || "/"] || p;
  // Protected lectures: slide data and slide downloads need the admin cookie,
  // or (for the data file) a live room of that lecture, so students' phones can follow along.
  const prot = /^\/(?:data\/([\w-]+)\.json|downloads\/([\w-]+)-slides\.html)$/.exec(p);
  const protId = prot && (prot[1] || prot[2]);
  if (protId && LECTURES[protId] && LECTURES[protId].protected && !isAdmin(req)) {
    const room = prot[1] && rooms.get(String(url.searchParams.get("room") || "").toUpperCase());
    if (!room || room.lectureId !== protId) { res.writeHead(403, { "content-type": "text/plain; charset=utf-8" }); return res.end("Locked"); }
  }
  const file = path.normalize(path.join(PUBLIC, p));
  if (!file.startsWith(PUBLIC + path.sep)) { res.writeHead(403); return res.end(); }
  fs.stat(file, (err, st) => {
    if (err || !st.isFile()) {
      res.writeHead(404, { "content-type": "text/html; charset=utf-8" });
      return fs.createReadStream(path.join(PUBLIC, "404.html")).on("error", () => res.end("Not found")).pipe(res);
    }
    const ext = path.extname(file).toLowerCase();
    res.writeHead(200, { "content-type": TYPES[ext] || "application/octet-stream",
      "cache-control": ext === ".html" || ext === ".json" ? "no-cache" : "public, max-age=3600",
      "x-content-type-options": "nosniff", "referrer-policy": "same-origin" });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, "http://localhost");
  try {
    if (url.pathname.startsWith("/api/")) return await api(req, res, url);
    if (req.method !== "GET" && req.method !== "HEAD") throw httpError(405, "Method not allowed.");
    serveStatic(req, res, url);
  } catch (e) {
    const status = e.status || 500;
    if (status === 500) console.error(e);
    if (!res.headersSent) sendJson(res, status, { error: { message: status === 500 ? "Something went wrong." : e.message } });
    else res.end();
  }
});

server.listen(PORT, () => {
  console.log(`Hephzibah Academy running at http://localhost:${PORT}`);
  if (!HOST_PASSCODE) console.log("Note: HOST_PASSCODE is not set — anyone can start a live session.");
});
