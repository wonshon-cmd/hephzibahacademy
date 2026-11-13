// Members-only pages (Churches, Speakers): visitors enter church, affiliation, role and email,
// confirm the email with a 6-digit code, then the page content appears.
// Live site: /api/gate/{status,start,verify} (code sent by email, 30-day cookie).
// Static site (no server): the email is confirmed by typing it again; remembered on this device.
(() => {
  const root = document.querySelector("[data-gate]");
  if (!root) return;
  const kind = root.dataset.gate;
  const content = document.getElementById("gated");
  const ko = () => (window.hzLang && window.hzLang()) === "ko";
  const T = (en, k) => (ko() ? k : en);
  const KEY = "hz-gate-" + kind;
  const open = () => { root.hidden = true; content.hidden = false; content.querySelectorAll(".rv").forEach((n) => n.classList.add("in")); };
  try { if (localStorage.getItem(KEY)) open(); } catch {}
  fetch(`/api/gate/status?kind=${kind}`).then((r) => (r.ok ? r.json() : null)).then((d) => { if (d && d.ok) open(); }).catch(() => {});

  const form = root.querySelector("#gate-form");
  const err = root.querySelector(".error");
  let step = 1, info = null, server = true;
  const step2 = root.querySelector("#gate-step2");
  form.addEventListener("submit", async (e) => {
    e.preventDefault(); err.textContent = "";
    const btn = form.querySelector("button[type=submit]"); btn.disabled = true;
    try {
      if (step === 1) {
        const el = form.elements;
        info = { kind, church: el.church.value.trim(), affiliation: el.affiliation.value.trim(), role: el.role.value, email: el.email.value.trim().toLowerCase(), lang: ko() ? "ko" : "en" };
        if (!info.church || !info.affiliation || !info.role) throw new Error(T("Please fill in every field.", "모든 칸을 채워 주세요."));
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(info.email)) throw new Error(T("Please add a valid email.", "올바른 이메일을 적어 주세요."));
        let r = null;
        try { r = await fetch("/api/gate/start", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(info) }); } catch {}
        if (r && r.ok) server = true;
        else if (r && r.status !== 404 && r.status !== 405) { const d = await r.json().catch(() => ({})); throw new Error((d.error && d.error.message) || T("Something went wrong.", "문제가 생겼어요.")); }
        else server = false;
        step = 2;
        form.querySelectorAll(".gate-step1").forEach((n) => (n.hidden = true));
        step2.hidden = false;
        step2.querySelector("label span").textContent = server ? T(`Enter the 6-digit code sent to ${info.email}`, `${info.email}로 보낸 6자리 코드를 입력하세요`) : T("Type your email again to confirm", "확인을 위해 이메일을 한 번 더 입력하세요");
        const inp = step2.querySelector("input");
        inp.type = server ? "text" : "email"; inp.inputMode = server ? "numeric" : "email"; inp.value = ""; inp.focus();
        btn.textContent = T("Confirm", "확인");
      } else {
        const v = step2.querySelector("input").value.trim();
        if (server) {
          const r = await fetch("/api/gate/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ kind, email: info.email, code: v }) });
          const d = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error((d.error && d.error.message) || T("That code isn’t right.", "코드가 맞지 않아요."));
        } else if (v.toLowerCase() !== info.email) throw new Error(T("The emails don’t match.", "이메일이 서로 달라요."));
        try { localStorage.setItem(KEY, "1"); } catch {}
        open();
      }
    } catch (x) { err.textContent = x.message; }
    btn.disabled = false;
  });
})();
