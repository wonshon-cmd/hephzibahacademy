// Lecture page: slides, preview, download and the slide list are for admins only.
// <script src="/js/lecture-admin.js" data-deck="LECTURE_ID" defer></script>
(() => {
  const deckId = document.currentScript.dataset.deck;
  const lang = () => (window.hzLang && window.hzLang()) || "en";
  const form = document.getElementById("admin-form");
  const err = form.querySelector(".error");
  let deck = null;

  document.getElementById("admin-open").onclick = () => {
    form.hidden = !form.hidden;
    if (!form.hidden) document.getElementById("admin-pw").focus();
  };
  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    err.textContent = "";
    const r = await fetch("/api/admin/login", { method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ passcode: document.getElementById("admin-pw").value }) });
    if (r.ok) return unlock();
    err.textContent = lang() === "ko" ? "암호가 맞지 않아요." : "Incorrect password.";
  });

  async function unlock() {
    const r = await fetch(`/data/${deckId}.json`);
    if (!r.ok) return;
    deck = await r.json();
    document.querySelectorAll(".admin-only").forEach((n) => (n.hidden = false));
    form.hidden = true;
    document.getElementById("admin-open").hidden = true;
    render();
  }

  function render() {
    if (!deck) return;
    const ol = document.getElementById("outline");
    if (!ol) return;
    ol.replaceChildren();
    deck.slides.forEach((s, i) => {
      const li = document.createElement("li");
      li.innerHTML = '<div class="n"></div><div class="t"></div>';
      li.querySelector(".n").textContent = String(i + 1).padStart(2, "0");
      li.querySelector(".t").textContent = (lang() === "ko" && s.ko ? s.ko.title : s.title).replace(/\n/g, " ");
      ol.append(li);
    });
  }

  document.addEventListener("hz-langchange", render);
  fetch("/api/admin/status").then((r) => r.json()).then((d) => { if (d.admin) unlock(); }).catch(() => {});
})();
