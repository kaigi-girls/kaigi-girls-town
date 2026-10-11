/* コンテンツ hub: renders KG_CONFIG.contents grouped by `group`. */
(function () {
  const el = document.getElementById("hub"); if (!el) return;
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const items = (window.KG_CONFIG && KG_CONFIG.contents) || [], groups = [...new Set(items.map(i => i.group))];
  el.innerHTML = groups.map(g => `<h3 class="lead" style="font-weight:800;color:var(--navy);margin-top:12px">${esc(g)}</h3><div class="hubgrid">` +
    items.filter(i => i.group === g).map(i => {
      const inner = (i.icon ? `<img class="ic" src="${esc(i.icon)}" alt="">` : "") + `<b>${esc(i.title)}</b><small>${esc(i.sub || "")}</small>`;
      return i.href ? `<a class="hubcard" style="--c:${i.c}" href="${esc(i.href)}"${i.internal ? "" : ' target="_blank" rel="noopener"'}>${inner}</a>`
        : `<div class="hubcard off" style="--c:${i.c}">${inner}</div>`;
    }).join("") + `</div>`).join("");
})();
