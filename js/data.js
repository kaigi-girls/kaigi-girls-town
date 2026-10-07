/* Data loading: status.csv, rooms.md, meeting.json (all re-readable, no cache) */
(function () {
  const C = window.KG_CONFIG;
  const JP = /[\u3040-\u30ff\u3400-\u9fff\uff00-\uffef]/;

  async function fetchText(url) {
    const r = await fetch(url + (url.includes("?") ? "&" : "?") + "t=" + Date.now(), { cache: "no-store" });
    if (!r.ok) throw new Error(url + " " + r.status);
    return r.text();
  }

  // Minimal RFC4180-ish CSV parser (handles quotes, commas and newlines inside quotes, BOM)
  function parseCSV(text) {
    text = text.replace(/^\uFEFF/, "");
    const rows = []; let row = [], f = "", q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) {
        if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
        else f += c;
      } else if (c === '"') q = true;
      else if (c === ",") { row.push(f); f = ""; }
      else if (c === "\n" || c === "\r") {
        if (c === "\r" && text[i + 1] === "\n") i++;
        row.push(f); f = ""; if (row.some(v => v.trim() !== "")) rows.push(row); row = [];
      } else f += c;
    }
    row.push(f); if (row.some(v => v.trim() !== "")) rows.push(row);
    if (!rows.length) return [];
    const head = rows[0].map(h => h.trim());
    return rows.slice(1).map(r => Object.fromEntries(head.map((h, i) => [h, (r[i] || "").trim()])));
  }

  function memberIdByName(name) {
    for (const [id, m] of Object.entries(C.members)) if (m.match.includes(name.trim())) return id;
    return null;
  }
  function roomIdByText(text) {
    for (const r of C.rooms) if (text.includes(r.mdKey)) return r.id;
    return null;
  }

  // "2026-10-07 08:45" (JST) -> Date
  function parseJST(s) {
    if (!s) return null;
    const m = s.match(/(\d{4})-(\d{1,2})-(\d{1,2})[ T](\d{1,2}):(\d{2})/);
    if (!m) return null;
    const p = n => String(n).padStart(2, "0");
    return new Date(`${m[1]}-${p(m[2])}-${p(m[3])}T${p(m[4])}:${m[5]}:00+09:00`);
  }

  async function loadStatus() {
    const rows = parseCSV(await fetchText(C.data.status));
    const out = {};
    for (const r of rows) {
      const id = memberIdByName(r.name || "");
      if (!id) continue;
      out[id] = {
        id, name: r.name, roomText: r.room,
        roomId: roomIdByText(r.room || "") || C.members[id].room,
        ja: r.status_ja || "", en: r.status_en || "",
        updatedRaw: r.updated_jst || "", updated: parseJST(r.updated_jst)
      };
    }
    return out;
  }

  // rooms.md: "# title", intro lines, then "## heading" sections.
  // Inside a section, lines containing Japanese -> ja, other lines -> en.
  async function loadRooms() {
    const md = await fetchText(C.data.rooms);
    const res = { title: "", intro: { ja: "", en: "" }, rooms: {} };
    let cur = res.intro;
    for (const raw of md.split(/\r?\n/)) {
      const line = raw.trim();
      if (!line) continue;
      if (line.startsWith("## ")) {
        const heading = line.slice(3).trim();
        const id = roomIdByText(heading);
        cur = { heading, ja: "", en: "" };
        if (id) res.rooms[id] = cur;
        continue;
      }
      if (line.startsWith("# ")) { res.title = line.slice(2).trim(); continue; }
      const key = JP.test(line) ? "ja" : "en";
      cur[key] = cur[key] ? cur[key] + "\n" + line : line;
    }
    return res;
  }

  async function loadMeetings() {
    const j = JSON.parse(await fetchText(C.data.meeting));
    const list = (j.meetings || []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
    return list;
  }

  // trends.csv: date,who,trend,comment,next_post  -> [{date, items:[...]}] newest first
  async function loadTrends() {
    const text = (await fetchText(C.data.trends)).split(/\r?\n/).filter(l => !l.trim().startsWith("#")).join("\n");
    const by = {};
    for (const r of parseCSV(text)) {
      const d = (r.date || "").match(/^\d{4}-\d{2}-\d{2}$/) ? r.date : null;
      const who = (r.who || "").toLowerCase();
      if (!d || !C.members[who] || !r.trend) continue;
      (by[d] = by[d] || []).push({ date: d, who, trend: r.trend, comment: r.comment || "", next: r.next_post === "1" });
    }
    return Object.keys(by).sort().reverse().map(date => ({ date, items: by[date] }));
  }

  window.KG_DATA = { loadStatus, loadRooms, loadMeetings, loadTrends, parseCSV, parseJST };
})();
