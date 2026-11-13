# Hephzibah Academy

*Rooted in faith. Shining in the world.*

The Hephzibah Academy website, with live, interactive lectures. The presenter shows one slide at a time on the projector. Students join from their phones and answer questions, and their answers show up on the big screen.

## What's here

| Page | URL |
| --- | --- |
| Landing page | `/` |
| Lectures (Academy) | `/lectures` |
| **For High School → My User Manual** | `/lectures/my-user-manual` |
| Presenter screen (projector) | `/present?lecture=my-user-manual` |
| Slide preview (no audience) | `/present?lecture=my-user-manual&preview=1` |
| Student join page | `/join`, or the short link `/j/CODE` |
| Mentors (adult sign-up) | `/mentors` |
| Cohort sign-up | `/cohort` |
| Personality test (20 questions) | `/personality` |
| Beulah Venture application | `/apply` |
| Support (monthly giving) | `/support` |

### The live lecture: *My User Manual* (36 slides, about 40 minutes)

1. The presenter clicks **Start live session**. A room code and QR code appear on screen.
2. Students scan the QR code. No sign-up is needed, and no real names are used. Each student gets a random **orchestra instrument** (Violin, Oboe, Tuba, and so on) and can roll again for a different one.
3. While they wait, students can swipe through the **20 self-reflection questions**. Their results stay locked until the end.
4. The presenter moves through the slides one at a time (← / → keys), and the phones follow along.
   * **Poll** (slides 2 and 3): bars on the screen update live.
   * **Live answers** (slide 21): each answer appears on the screen as a card with the student's instrument name.
   * **Private worksheet** (slide 28): stays on the phone and can be downloaded.
   * **Q&A**: students can send questions at any time. The closing slide shows them.
5. **The orchestra** (slide 31): click an instrument to hear only its part, then press **All together**.
6. **Video** (slide 32): *Morricone conducts Morricone: The Mission (Gabriel's Oboe)*, embedded from YouTube.
7. **Review** (slide 35): on their phones, students
   1. write one thing they learned (it appears on the big screen),
   2. rate and review the lecture,
   3. unlock their personality results (strengths, challenges, ways to grow),
   4. write how they could use their strengths and work with their weaknesses,
   5. can leave an email, with a consent checkbox, to receive job matches later.

Presenter keys: `→`/`Space` next (on slides marked `"reveal": true` or `"titleSteps": true`, lines appear one by one on their own; → shows the next one right away) · `←` back · `N` speaker notes · `Q` big QR code · `F` fullscreen · `Esc` close.
Toolbar: **Review first** holds each message until you approve it. **Queue** holds pending messages, audience questions and hidden messages. **Export** downloads a CSV of this room's reviews, reflections and emails.

## Run it

Node 18 or newer is required. There are no dependencies to install.

```bash
npm start
```

Then open http://localhost:3000.

### Settings (environment variables)

| Variable | Purpose |
| --- | --- |
| `PORT` | Port to listen on (default `3000`) |
| `HOST_PASSCODE` | If set, a presenter must enter this passcode before starting a live session. **Set this in production.** |
| `DATA_DIR` | Folder where student submissions are saved (default `./data`). Point it at a persistent disk. |

## Public website (GitHub Pages)

`docs/` holds a static copy of the website, rebuilt with `python3 tools/build-static.py`. To publish it for free:

1. On GitHub, open the repo and go to **Settings → Pages**.
2. Under **Source**, choose **Deploy from a branch**.
3. Pick the branch and the **/docs** folder, then click **Save**.

After a minute the site is live at https://wonshon-cmd.github.io/hephzibahacademy/. It includes every page, the 한국어 button, the personality test and the slide deck. Live classes, sign-ups and applications need the full server, described below.

## Hosting

The site needs a server that runs Node, because live rooms use Server-Sent Events. Render, Railway, Fly.io or any VPS will work. Static hosts such as GitHub Pages will not.

* Run the service as a **single instance**. Live rooms are kept in memory, so restarting the server ends any active session. Submissions are written to disk and survive restarts.
* Submissions are saved to `DATA_DIR/submissions.jsonl`, one JSON record per line. The host CSV export reads from this file. These records are what you would use later to send job matches by email.

## Live lecture: *Basic Finance*

`/lectures/basic-finance` is the second live lecture: *Basic Finance: Living as God’s Steward* (기초재정 — 하나님의 청지기로 살아가기). It runs 60 or 120 minutes in 10 sections.

The slide content lives in `tools/decks/basic_finance.py`. To regenerate `public/data/basic-finance.json`, run:

```bash
python3 tools/decks/basic_finance.py
```

How it differs from *My User Manual*:

* Participants get Bible-character pseudonyms with portraits (`"pseudonyms": "bible"`) instead of instruments.
* There is a consent screen with two optional checkboxes: research use and future counseling contact.
* Some slides are private tools that stay on each phone: a spending guess-vs-actual check, a credit-card payoff calculator and a home-tasks checklist.
* Income and life situation are asked as polls, so only totals show on screen.

Sections 4–9 currently have title slides only.

## Beulah Venture applications

`/apply` is the First Track 2027 application ("Tell us about your business"). It is for Venture 101 graduates, and the page says you reply within 2 weeks.

The applicant goes through three steps:

1. Enter a name and email.
2. Type in the 6-digit code that was emailed to them (it expires after 15 minutes).
3. Fill in the application.

Applications are saved to `DATA_DIR/applications.jsonl`. To download them as a CSV, open `/api/applications.csv?passcode=YOUR_HOST_PASSCODE`.

Sending the code by email needs a [Resend](https://resend.com) account:

| Variable | Purpose |
| --- | --- |
| `RESEND_API_KEY` | Resend API key, required to send the verification emails |
| `MAIL_FROM` | Sender, e.g. `Beulah Venture <apply@yourdomain.com>` (the domain must be verified in Resend) |

Without `RESEND_API_KEY`, the code is printed to the server log instead. That is enough for testing, but real applicants cannot apply this way.

## Locked slides (admin password)

Lectures with `"protected": true` in their JSON (both current lectures) keep their slides private.

* **Public pages:** a lecture page shows only its title, a short description and the big topics.
* **Admin access:** the slide list, presenter screen, preview and slide download need the admin password.
* **Students:** phones in a live room can still load the slides they need.

On the server, set `ADMIN_PASSCODE` as an environment variable. Signing in sets a 12-hour cookie. If the variable is not set, the slides stay locked for everyone.

The static site (`docs/`) has no server. Instead, it embeds each slide deck encrypted with AES-GCM, using a key derived from the password (PBKDF2, 600,000 iterations). The browser decrypts it only when the right password is typed. Build it with:

```bash
ADMIN_PASSCODE=... python3 tools/build-static.py
```

Without `ADMIN_PASSCODE`, the static site has no slides at all. The password is never written into the repo.

**Note:** this repository is public, so the slide source files (`public/data/*.json`, `tools/decks/`) can be read on GitHub. The lock protects the website only.

## Languages

Every page has a 한국어 / English button. The choice is remembered on that device. Slides, speaker notes, the 20 questions and the results all have Korean versions (`ko` fields in `public/data/*.json`).

## Standalone slide deck

`public/downloads/my-user-manual-slides.html` is a single offline file of the lecture, with the language toggle, speaker notes (N) and the orchestra sounds. It has no live audience features. After editing the slides, rebuild it:

```bash
node tools/build-slides.mjs my-user-manual public/downloads/my-user-manual-slides.html
```

## Cohort sign-ups

A cohort runs as a live session, then a class, then mentoring, with a check-in after each one. Sign-ups made at `/cohort` are saved to `DATA_DIR/cohort.jsonl`. To download them as a CSV, open `/api/cohort.csv?passcode=YOUR_HOST_PASSCODE`.

## Mentor sign-ups

Adults sign up at `/mentors`. They choose how to help: fund classes, give career advice, teach a live class, give feedback, or invest through Beulah Venture. Sign-ups are saved to `DATA_DIR/mentors.jsonl`. To download them as a CSV, open `/api/mentors.csv?passcode=YOUR_HOST_PASSCODE`. This works only when `HOST_PASSCODE` is set.

## Content and data files

* `public/data/my-user-manual.json`: slides, speaker notes and interactions, in English (translated from the original Korean talk).
* `public/data/personality.json`: the 20 questions and the results text for the 5 areas. This is a self-reflection activity, not a validated psychological test.
* `public/data/instruments.json`: the instrument pseudonyms.
* Orchestra sounds: each part of an original short piece is played with real recorded instrument samples (FluidR3_GM soundfont by Frank Wen, MIT licence, via midi-js-soundfonts by Benjamin Gleitzman), loaded from the web when the orchestra slide opens. If they can't load, a built-in synthesizer plays instead. Full recordings dropped into `public/audio/` (see `public/audio/README.txt`) take priority.

## Privacy notes

* The big screen shows only instrument names, never real names.
* Answers to the 20 questions stay on the student's phone. Only the five summary labels (for example "mid") are sent, and only when the student submits their reflections.
* Email is optional and requires a consent checkbox. Many students will be minors, so check what your church or organization requires (for example, parental consent) before you send any emails.

## Private photos

Photos that show real people (for example the Kenya photo in *My User Manual*) are never stored in the repo as plain images. They are kept encrypted in `private/` with the admin password:

```bash
ADMIN_PASSCODE=... node tools/private-assets.mjs add photo.jpg kenya.jpg
```

A slide uses one with `"src": "private:kenya.jpg"`. The server decrypts it only for admins and live rooms (so `ADMIN_PASSCODE` must be set), and `tools/build-static.py` embeds it only inside the encrypted slide decks. The plain offline deck in `public/downloads/` shows a placeholder instead.

## Live extras

* **Word cloud:** a text question with `"display": "cloud"` shows answers as words; the same answer typed by several people grows bigger (slide 3, "What kind of person do you think I am?").
* **Orchestra seating:** during a live *My User Manual* session, every student who joins appears as a small instrument badge in their section (strings in front, then woodwinds, brass and percussion) at the bottom of the screen.

## Demo deck (for introducing the lecture)

To show the lecture to teachers or pastors as if a class were in the room, build a demo deck: a pretend class joins one by one, polls fill up, and sample answers (the `demo` lists in the lecture JSON) appear on each question slide.

```bash
DEMO=1 ADMIN_PASSCODE=... INCLUDE_PRIVATE=1 node tools/build-slides.mjs my-user-manual my-user-manual-demo.html
```

On the server, the same mode is at `/present?lecture=my-user-manual&demo` (admin only). The static site also publishes public samples (no private photos, not indexed by search engines) at `/sample/my-user-manual/` and `/sample/basic-finance/`.

## Growth Note demo (함께하는 성장 노트)

`/sample/growth-note/` is a phone-first demo of the group workshop from the printed *함께하는 성장 노트* (about 75 minutes, groups of 4–5). Everyone else in the room is simulated:

1. Enter a name. Friends join, and everyone is split into random groups of 4–5.
2. Opening prayer.
3. Personality test: 20 questions, one tap each (a "⚡ 자동으로 빠르게" button fills it in for demos). Types: A 리더형 (느헤미야), B 열정형 (베드로), C 돌봄형 (바나바), D 신중형 (누가). Group members' results and one-line shares appear.
4. Compliment shower: friends write three strengths for you, then you write three for each friend.
5. Apply to me: overlap between the test and friends' words, a strength you didn't know, a one-sentence vision and one small practice.
6. Dream and job, and how to use the money earned.
7. Pair prayer, then a summary "growth note".

It is a single self-contained file, `public/sample/growth-note/index.html`; nothing is sent to a server.

## Speakers

`/speakers` invites pastors, ministers, ministry staff and church members to share their story with young people. The page shows the five steps (apply → review → upload → schedule → speak and get paid) and an application form. Applications are saved to `DATA_DIR/speakers.jsonl` with `status: "applied"`; download them at `/api/speakers.csv?passcode=YOUR_HOST_PASSCODE`. Review, upload, scheduling and payment are handled by the team for now.

## Reviews and instructors

Each lecture page shows its instructor and a **Reviews** section; the Academy list shows each course's rating. Reviews come from the review students leave at the end of a live class (stored in `submissions.jsonl`, shown under their class pseudonym, never a real name) through `GET /api/reviews/<lectureId>`. The static site has no server, so it shows only curated reviews from `public/data/reviews.json`.

## For churches

`/churches` offers every lecture to a church on one monthly plan by church size (up to 100, 100–300, 300–1,000, 1,000+), used live, as a recording, or tried first through the samples, plus follow-up (Growth Note, personality test, cohort check-ins, mentors, speakers; mentor counseling is coming later). Prices currently read "Contact us". Inquiries are saved to `DATA_DIR/churches.jsonl`; download them at `/api/churches.csv?passcode=YOUR_HOST_PASSCODE`.
