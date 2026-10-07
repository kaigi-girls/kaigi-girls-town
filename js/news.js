/* 街のできごと: news.csv (date,who,text_ja,text_en), newest first */
(function () {
  const D = window.KG_DATA, C = window.KG_CONFIG;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  let rows = [];
  const lang = () => localStorage.getItem("kg_lang") || "ja";
  function draw() {
    const el = document.getElementById("newsList"), h = document.getElementById("newsTitle");
    if (!el) return;
    const en = lang() === "en";
    h.textContent = en ? "Town news" : "街のできごと";
    el.innerHTML = rows.slice(0, 8).map(r => {
      const m = C.members[r.who] || null;
      const col = m && m.color ? m.color : "#bde1fb";
      const txt = en ? (r.text_en || r.text_ja) : (r.text_ja || r.text_en);
      return `<li><time style="border-color:${esc(col)}">${esc(r.date.slice(5).replace("-", "/"))}</time><span>${esc(txt)}</span></li>`;
    }).join("");
    document.getElementById("news").hidden = !rows.length;
  }
  async function load() {
    try {
      const r = await fetch("news.csv?t=" + Date.now(), { cache: "no-store" });
      if (!r.ok) return;
      rows = D.parseCSV(await r.text()).filter(x => x.date && (x.text_ja || x.text_en)).sort((a, b) => b.date.localeCompare(a.date));
    } catch (e) { console.warn(e); }
    draw();
  }
  document.addEventListener("click", e => { if (e.target.id === "langBtn") setTimeout(draw, 0); });
  load(); setInterval(load, 5 * 60 * 1000);
})();
