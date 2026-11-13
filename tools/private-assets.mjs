// Private images (e.g. photos of children) are kept in the repo only in encrypted form,
// using the same format as tools/encrypt.mjs (PBKDF2-SHA256 → AES-256-GCM, key = ADMIN_PASSCODE).
//
//   ADMIN_PASSCODE=... node tools/private-assets.mjs add photo.jpg kenya.jpg   → writes private/kenya.jpg.enc.json
//
// Slides refer to them as "src": "private:kenya.jpg". The server decrypts them for admins and live rooms;
// tools/build-slides.mjs embeds them only when INCLUDE_PRIVATE=1 (used for the encrypted static decks).
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

export const PRIVATE_DIR = path.join(path.resolve(path.dirname(fileURLToPath(import.meta.url)), ".."), "private");
const ITER = 600000;

export function encryptBuffer(buf, password) {
  const salt = crypto.randomBytes(16), iv = crypto.randomBytes(12);
  const key = crypto.pbkdf2Sync(password, salt, ITER, 32, "sha256");
  const c = crypto.createCipheriv("aes-256-gcm", key, iv);
  const ct = Buffer.concat([c.update(buf), c.final(), c.getAuthTag()]);
  return { iter: ITER, salt: salt.toString("base64"), iv: iv.toString("base64"), ct: ct.toString("base64") };
}

export function decryptPrivate(name, password) {
  if (!/^[\w.-]+$/.test(name)) throw new Error("bad name");
  const e = JSON.parse(fs.readFileSync(path.join(PRIVATE_DIR, name + ".enc.json"), "utf8"));
  const key = crypto.pbkdf2Sync(password, Buffer.from(e.salt, "base64"), e.iter, 32, "sha256");
  const all = Buffer.from(e.ct, "base64");
  const d = crypto.createDecipheriv("aes-256-gcm", key, Buffer.from(e.iv, "base64"));
  d.setAuthTag(all.subarray(all.length - 16));
  return Buffer.concat([d.update(all.subarray(0, all.length - 16)), d.final()]);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const [, , cmd, input, name] = process.argv;
  const pw = process.env.ADMIN_PASSCODE;
  if (cmd !== "add" || !input || !name || !pw) { console.error("usage: ADMIN_PASSCODE=... node tools/private-assets.mjs add <file> <name>"); process.exit(1); }
  fs.mkdirSync(PRIVATE_DIR, { recursive: true });
  fs.writeFileSync(path.join(PRIVATE_DIR, name + ".enc.json"), JSON.stringify(encryptBuffer(fs.readFileSync(input), pw)));
  console.log("wrote private/" + name + ".enc.json");
}
