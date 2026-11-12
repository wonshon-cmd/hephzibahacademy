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
| Support (monthly giving) | `/support` |

### The live lecture: *My User Manual* (29 slides, about 40 minutes)

1. The presenter clicks **Start live session**. A room code and QR code appear on screen.
2. Students scan the QR code. No sign-up is needed, and no real names are used. Each student gets a random **orchestra instrument** (Violin, Oboe, Tuba, and so on) and can roll again for a different one.
3. While they wait, students can swipe through the **20 self-reflection questions**. Their results stay locked until the end.
4. The presenter moves through the slides one at a time (← / → keys), and the phones follow along.
   * **Poll** (slide 2): bars on the screen update live.
   * **Live answers** (slides 10, 17, 24): each answer appears on the screen as a card with the student's instrument name.
   * **Private worksheet** (slide 23): stays on the phone and can be downloaded.
   * **Q&A**: students can send questions at any time. The closing slide shows them.
5. **The orchestra** (slide 27): click an instrument to hear only its part, then press **All together**.
6. **Video** (slide 28): *Morricone conducts Morricone: The Mission (Gabriel's Oboe)*, embedded from YouTube.
7. **Review** (slide 29): on their phones, students
   1. write one thing they learned (it appears on the big screen),
   2. rate and review the lecture,
   3. unlock their personality results (strengths, challenges, ways to grow),
   4. write how they could use their strengths and work with their weaknesses,
   5. can leave an email, with a consent checkbox, to receive job matches later.

Presenter keys: `→`/`Space` next · `←` back · `N` speaker notes · `Q` big QR code · `F` fullscreen · `Esc` close.
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

## Hosting

The site needs a server that runs Node, because live rooms use Server-Sent Events. Render, Railway, Fly.io or any VPS will work. Static hosts such as GitHub Pages will not.

* Run the service as a **single instance**. Live rooms are kept in memory, so restarting the server ends any active session. Submissions are written to disk and survive restarts.
* Submissions are saved to `DATA_DIR/submissions.jsonl`, one JSON record per line. The host CSV export reads from this file. These records are what you would use later to send job matches by email.

## Mentor sign-ups

Adults sign up at `/mentors`. They choose how to help: fund classes, give career advice, teach a live class, give feedback, or invest through Beulah Venture. Sign-ups are saved to `DATA_DIR/mentors.jsonl`. To download them as a CSV, open `/api/mentors.csv?passcode=YOUR_HOST_PASSCODE`. This works only when `HOST_PASSCODE` is set.

## Content and data files

* `public/data/my-user-manual.json`: slides, speaker notes and interactions, in English (translated from the original Korean talk).
* `public/data/personality.json`: the 20 questions and the results text for the 5 areas. This is a self-reflection activity, not a validated psychological test.
* `public/data/instruments.json`: the instrument pseudonyms.
* `public/audio/`: optional real recordings for the orchestra slide. See `public/audio/README.txt`. Without them, the instruments are synthesized in the browser, playing an original short piece written for this demo.

## Privacy notes

* The big screen shows only instrument names, never real names.
* Answers to the 20 questions stay on the student's phone. Only the five summary labels (for example "mid") are sent, and only when the student submits their reflections.
* Email is optional and requires a consent checkbox. Many students will be minors, so check what your church or organization requires (for example, parental consent) before you send any emails.
