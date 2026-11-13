// Encrypts a file with a password (PBKDF2-SHA256 → AES-256-GCM) for the static site.
//   ADMIN_PASSCODE=... node tools/encrypt.mjs input.html > output.json
// The browser decrypts it with the same password (see tools/build-static.py).
import fs from "node:fs";
import { webcrypto as crypto } from "node:crypto";

const [, , input] = process.argv;
const password = process.env.ADMIN_PASSCODE;
if (!input || !password) { console.error("usage: ADMIN_PASSCODE=... node tools/encrypt.mjs <file>"); process.exit(1); }

const ITER = 600000;
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));
const base = await crypto.subtle.importKey("raw", new TextEncoder().encode(password), "PBKDF2", false, ["deriveKey"]);
const key = await crypto.subtle.deriveKey({ name: "PBKDF2", salt, iterations: ITER, hash: "SHA-256" }, base, { name: "AES-GCM", length: 256 }, false, ["encrypt"]);
const ct = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, fs.readFileSync(input)));
const b64 = (u) => Buffer.from(u).toString("base64");
process.stdout.write(JSON.stringify({ iter: ITER, salt: b64(salt), iv: b64(iv), ct: b64(ct) }));
