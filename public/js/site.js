// Mobile menu toggle
document.addEventListener("click", (e) => {
  const btn = e.target.closest(".menu-btn");
  if (!btn) return;
  const nav = document.getElementById(btn.getAttribute("aria-controls"));
  const open = nav.classList.toggle("open");
  btn.setAttribute("aria-expanded", String(open));
});

// ---------- Subtle motion: headline rise, lines drawing in, scroll reveals ----------
// Runs after the language script so the headline is already in the right language.
document.addEventListener("DOMContentLoaded", () => {
  const root = document.documentElement;
  root.classList.add("m-on");
  const h1 = document.querySelector(".hero .display");
  if (h1) {
    const original = [...h1.childNodes];
    const spark = h1.querySelector(".spark"), sr = h1.querySelector(".sr-only");
    const text = original.filter((n) => n.nodeType === 3).map((n) => n.textContent).join("").trim();
    const words = text.split(" ");
    h1.replaceChildren();
    words.forEach((w, i) => {
      const s = document.createElement("span"); s.className = "w"; s.textContent = w;
      s.style.animationDelay = (0.15 + i * 0.12) + "s";
      h1.append(s, i < words.length - 1 ? " " : "");
    });
    if (spark) h1.lastElementChild.append(spark);
    if (sr) h1.append(sr);
    // Put the original text back once the words have risen, so the language button keeps working.
    setTimeout(() => h1.replaceChildren(...original), (0.15 + words.length * 0.12 + 1) * 1000);
  }
  document.querySelectorAll('.hill-art g[fill="none"] path').forEach((p) => p.style.setProperty("--len", Math.ceil(p.getTotalLength())));
  const targets = [];
  document.querySelectorAll(".pillar, .section .section-head, .section .split > *, .card, .names2 > div, .names2-lead, .names2-verse, .later, .site-footer .lockup")
    .forEach((el) => { el.classList.add("rv"); targets.push(el); });
  document.querySelectorAll(".pillars, .card, .names2").forEach((el) => { el.classList.add("rule-draw"); targets.push(el); });
  document.querySelectorAll(".pillar").forEach((el, i) => el.style.setProperty("--d", (i * 0.12) + "s"));
  document.querySelectorAll(".card").forEach((el, i) => el.style.setProperty("--d", (i % 4 * 0.08) + "s"));
  const art = document.querySelector(".hill-art"); if (art) targets.push(art);
  if (!("IntersectionObserver" in window)) { targets.forEach((t) => t.classList.add("in")); return; }
  const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { threshold: 0.12 });
  targets.forEach((t) => io.observe(t));
});
