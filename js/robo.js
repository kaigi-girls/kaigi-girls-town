/* ロボくんの部屋 — YouTube archive. Data: data/videos.json (add one entry per episode). */
(async function () {
  const $ = s => document.querySelector(s);
  const esc = s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  let D;
  try { D = await (await fetch("data/videos.json", { cache: "no-cache" })).json(); }
  catch (e) { $("#vgrid").innerHTML = "<p>動画リストを読み込めませんでした。</p>"; return; }
  if (D.channel && D.channel.url) $("#channelLink").href = D.channel.url;
  const vids = (D.videos || []).filter(v => !v.hidden).slice().sort((a, b) => (b.date || "").localeCompare(a.date || "") || (b.number || 0) - (a.number || 0));
  const hosts = D.hosts || {};
  const uniq = k => [...new Set(vids.map(v => v[k]).filter(Boolean))];
  const params = new URLSearchParams(location.search);
  const sel = { host: params.get("host") || "", genre: params.get("genre") || "" };
  const ytId = u => (u.match(/(?:youtu\.be\/|v=|shorts\/)([\w-]{11})/) || [])[1];
  const thumb = v => v.thumbnail || (ytId(v.url) ? `https://i.ytimg.com/vi/${ytId(v.url)}/hqdefault.jpg` : "assets/robo_channel.png");

  function chips(key, label, items) {
    return `<div class="frow"><span class="flbl">${label}</span>` +
      [["", "すべて"], ...items.map(i => [i, i])].map(([val, txt]) => {
        const h = hosts[val]; const st = h && key === "host" ? ` style="--c:${h.color};--d:${h.deep}"` : "";
        return `<button class="chip" data-k="${key}" data-v="${esc(val)}" aria-pressed="${sel[key] === val}"${st}>${esc(txt)}</button>`;
      }).join("") + `</div>`;
  }
  function render() {
    $("#filters").innerHTML = chips("host", "出演", Object.keys(hosts).filter(h => uniq("host").includes(h)).concat(uniq("host").filter(h => !hosts[h]))) + chips("genre", "ジャンル", uniq("genre"));
    const list = vids.filter(v => (!sel.host || v.host === sel.host) && (!sel.genre || v.genre === sel.genre));
    $("#count").textContent = `${list.length} 本の動画${sel.host || sel.genre ? "（絞り込み中）" : ""}`;
    $("#vgrid").innerHTML = list.map(v => {
      const h = hosts[v.host] || { color: "#bde1fb", deep: "#3f86d6" };
      return `<a class="vcard" href="${esc(v.url)}" target="_blank" rel="noopener" style="--c:${h.color};--d:${h.deep}">
        <div class="vthumb"><img src="${esc(thumb(v))}" alt="" loading="lazy" width="640" height="360"><span class="ep">${v.number ? "#" + String(v.number).padStart(2, "0") : esc(v.kind || "")}</span><span class="play">▶</span></div>
        <div class="vinfo"><h2>${esc(v.title)}</h2><p>${esc(v.summary)}</p>
        <div class="meta"><span class="host">${esc(v.host)}</span><span class="genre">${esc(v.genre)}</span><time>${esc(v.date)}</time></div></div></a>`;
    }).join("") || "<p>該当する動画はまだありません。</p>";
    document.querySelectorAll(".chip").forEach(b => b.onclick = () => {
      sel[b.dataset.k] = b.dataset.v;
      const p = new URLSearchParams(); if (sel.host) p.set("host", sel.host); if (sel.genre) p.set("genre", sel.genre);
      history.replaceState(null, "", p.toString() ? "?" + p : location.pathname); render();
    });
  }
  render();
})();
