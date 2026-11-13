// Course reviews and ratings.
// Fills [data-reviews="lectureId"] (a list) and [data-rating="lectureId"] (a short "★ 4.8 · 12 reviews" label).
// Live site: /api/reviews/<id> (reviews students leave at the end of each live class).
// Static site: window.__REVIEWS (public/data/reviews.json, curated).
(() => {
  const ko = () => (window.hzLang && window.hzLang()) === "ko";
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const stars = (n) => "★★★★★".slice(0, Math.round(n)) + "☆☆☆☆☆".slice(0, 5 - Math.round(n));
  async function load(id) {
    try { const r = await fetch(`/api/reviews/${id}`); if (r.ok) return await r.json(); } catch {}
    const list = ((window.__REVIEWS || {})[id] || []).filter((x) => x && x.rating);
    const count = list.length;
    return { count, rating: count ? Math.round((list.reduce((a, b) => a + b.rating, 0) / count) * 10) / 10 : null, reviews: list };
  }
  function render() {
    const ids = new Set([...document.querySelectorAll("[data-reviews],[data-rating]")].map((n) => n.dataset.reviews || n.dataset.rating));
    ids.forEach(async (id) => {
      const d = await load(id);
      document.querySelectorAll(`[data-rating="${id}"]`).forEach((n) => {
        n.hidden = !d.count;
        n.textContent = d.count ? `★ ${d.rating} · ${ko() ? `리뷰 ${d.count}개` : `${d.count} review${d.count === 1 ? "" : "s"}`}` : "";
      });
      document.querySelectorAll(`[data-reviews="${id}"]`).forEach((box) => {
        const head = d.count ? `<p class="rv-sum"><b>${d.rating}</b><span class="rv-stars" aria-hidden="true">${stars(d.rating)}</span><span>${ko() ? `리뷰 ${d.count}개` : `${d.count} review${d.count === 1 ? "" : "s"}`}</span></p>` : "";
        const items = d.reviews.filter((r) => r.text).slice(0, 12).map((r) => `<li><span class="rv-stars" aria-label="${r.rating}/5">${stars(r.rating)}</span><p>${esc(r.text)}</p><small>${esc(r.name || "")}${r.date ? " · " + esc(r.date) : ""}</small></li>`).join("");
        box.innerHTML = head + (items ? `<ul class="rv-list">${items}</ul>` : `<p class="muted">${ko() ? "아직 리뷰가 없어요. 수업이 끝나면 학생들의 리뷰가 여기에 남아요." : "No reviews yet. Students leave a review at the end of each class."}</p>`);
      });
    });
  }
  document.addEventListener("DOMContentLoaded", render);
  document.addEventListener("hz-langchange", render);
})();
