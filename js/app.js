/* KAIGI GIRLS TOWN — app glue: signs, cards, room sheet, meeting chat, visitor robot, tram, counter */
(function () {
  const C = window.KG_CONFIG, D = window.KG_DATA, T = window.KG_TOWN;
  const { robotSVG, NAVY } = window.KG_ISO;
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const params = new URLSearchParams(location.search);
  const STILL = params.has("still") || matchMedia("(prefers-reduced-motion: reduce)").matches;

  const I18N = {
    ja: { tagline: "ロボになって、街をのぞこう", hint: "タップした場所へ歩くよ・建物をタップでのぞける", nowTitle: "いま、なにしてる？",
      meetBtn: "会議室をのぞく", footNote: "この街と登場人物はフィクションです。人間はみんな小さなロボの姿で遊びに来ています。",
      updated: "更新", minAgo: n => `${n}分前`, hourAgo: n => `${n}時間前`, dayAgo: n => `${n}日前`, justNow: "たった今",
      visitors: "これまでに来たロボ", comingSoon: "COMING SOON", tapToPeek: "タップでのぞく", nowDoing: "いま",
      noStatus: "ひみつ", sample: "サンプル", sampleNote: "※サンプルの会話です（実際の会議ではありません）",
      curated: "公開OKになったセリフだけを載せています。", replay: "もう一度再生", you: "YOU", loaded: "自動更新",
      noMeeting: "まだ公開できる会議はありません。", soonText: "準備中",
      trendToday: "今日のトレンド", trendArchive: "トレンドの記録", trendNext: "次で使うかも👀", trendPicked: "ピック", noTrends: "まだトレンドはありません。", trendNote: "メンバーが気になった話題をひとことで。" },
    en: { tagline: "Become a tiny robot and peek into our town", hint: "Tap to walk · tap a building to peek inside", nowTitle: "What's everyone doing?",
      meetBtn: "Peek into the meeting room", footNote: "This town and its characters are fictional. Humans visit as tiny robots.",
      updated: "updated", minAgo: n => `${n} min ago`, hourAgo: n => `${n} h ago`, dayAgo: n => `${n} d ago`, justNow: "just now",
      visitors: "robots visited so far", comingSoon: "COMING SOON", tapToPeek: "tap to peek", nowDoing: "Now",
      noStatus: "secret", sample: "SAMPLE", sampleNote: "* Sample conversation (not a real meeting)",
      curated: "Only lines approved for publishing appear here.", replay: "Replay", you: "YOU", loaded: "auto-refresh",
      noMeeting: "No public meetings yet.", soonText: "coming soon",
      trendToday: "Today's trends", trendArchive: "Trend archive", trendNext: "maybe next post 👀", trendPicked: "picked", noTrends: "No trends yet.", trendNote: "Topics the girls are into, in one line." }
  };
  let lang = localStorage.getItem("kg_lang") === "en" ? "en" : "ja";
  const t = k => I18N[lang][k];

  const S = { status: {}, rooms: { rooms: {}, intro: {} }, meetings: [], meetingSel: 0, trends: [] };
  const roomCfg = id => C.rooms.find(r => r.id === id) || { id, label: id, labelEn: id };
  const ownerOf = roomId => { const r = roomCfg(roomId); return r.owner ? { id: r.owner, ...C.members[r.owner] } : null; };

  // ---------- text width estimate for SVG signs ----------
  const cw = ch => /[\u2E80-\uFFEF]/.test(ch) ? 1 : /\p{Extended_Pictographic}/u.test(ch) ? 1.15 : 0.6;
  const tw = (s, fs) => [...s].reduce((a, ch) => a + cw(ch), 0) * fs;
  function clip(s, fs, max) {
    if (tw(s, fs) <= max) return s;
    let out = ""; for (const ch of s) { if (tw(out + ch + "…", fs) > max) break; out += ch; }
    return out + "…";
  }

  function relTime(d) {
    if (!d) return "";
    const m = Math.max(0, Math.round((Date.now() - d.getTime()) / 60000));
    if (m < 1) return t("justNow"); if (m < 60) return t("minAgo")(m);
    if (m < 60 * 24) return t("hourAgo")(Math.round(m / 60)); return t("dayAgo")(Math.round(m / 1440));
  }
  const fmtJST = d => d ? new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(d) + " JST" : "";
  const statusText = st => st ? (lang === "en" ? (st.en || st.ja) : (st.ja || st.en)) : "";
  const roomTitle = (id, full) => {
    const md = S.rooms.rooms[id];
    if (md && lang === "ja") { let h = md.heading.replace(/[（(]COMING SOON[)）]/i, "").trim(); if (!full) h = h.replace(/[（(][^（()）]*[)）]$/, "").trim(); return h; }
    const r = roomCfg(id); return lang === "en" ? r.labelEn : r.label;
  };

  const introLine = id => { const md = S.rooms.rooms[id]; return md ? (lang === "en" ? md.en || md.ja : md.ja || md.en) : ""; };

  // ---------- map ----------
  const svg = $("#town");
  let sorted = [];
  function drawMap() {
    sorted = T.render(svg);
    // visitor robot
    const g = document.createElementNS("http://www.w3.org/2000/svg", "g");
    g.id = "visitor"; g.classList.add("obj");
    g.innerHTML = `<g class="vbody">${robotSVG({ body: "#ffffff", bodyLow: "#e4f2fd", antenna: "#fbabb6", antennaR: 2, scale: 0.55 })}</g>` +
      `<g transform="translate(0,-21)"><rect x="-10" y="-8" width="20" height="10" rx="5" fill="${NAVY}"/><text x="0" y="-0.6" font-size="6.5" font-weight="800" fill="#fff" text-anchor="middle">${t("you")}</text></g>`;
    $("#kgObjs").appendChild(g);
    placeRobot();
  }

  // Sign slots in SVG coords (map is 400 wide). x/y = top-left of the sign (cx = centered),
  // to = where the pointer points (defaults to the building's roof anchor).
  const SIGN_SLOT = {
    meeting:   { cx: 207, y: 44 },
    president: { x: 288, y: 96 },
    studio:    { x: 22, y: 122, to: [209, 170] },
    gym:       { x: 6, y: 224, to: [84, 208] },
    editorial: { x: 262, y: 254, to: [266, 238] },
    shop:      { cx: 161, y: 206 },
    board:     { x: 212, y: 190, to: [224, 216] }
  };
  function signBox(room, w, h, ax, ay) {
    const sl = SIGN_SLOT[room] || {};
    let x = sl.cx != null ? sl.cx - w / 2 : sl.x != null ? sl.x : ax - w / 2;
    let y = sl.y != null ? sl.y : ay - h - 7;
    x = Math.min(Math.max(x, 3), 397 - w); y = Math.max(y, 3);
    const [tx, ty] = sl.to || [ax, ay];
    return { x, y, tx, ty };
  }
  function pointer(b, w, h, tx, ty, fill, stroke) {
    // short triangle if the target is straight below/above the sign, else a leader line
    const inX = tx > b.x + 8 && tx < b.x + w - 8;
    if (inX && ty > b.y + h && ty - (b.y + h) < 16) return `<path d="M${tx - 4} ${b.y + h - 1} L${tx} ${ty} L${tx + 4} ${b.y + h - 1}Z" fill="${fill}" stroke="${stroke}" stroke-width="1.2" stroke-linejoin="round"/><rect x="${tx - 3.4}" y="${b.y + h - 2.4}" width="6.8" height="3" fill="${fill}"/>`;
    if (inX && ty < b.y && b.y - ty < 9) return `<path d="M${tx - 4} ${b.y + 1} L${tx} ${ty} L${tx + 4} ${b.y + 1}Z" fill="${fill}" stroke="${stroke}" stroke-width="1.2" stroke-linejoin="round"/><rect x="${tx - 3.4}" y="${b.y - 0.6}" width="6.8" height="3" fill="${fill}"/>`;
    const sx = Math.min(Math.max(tx, b.x + 10), b.x + w - 10), sy = ty > b.y + h ? b.y + h : ty < b.y ? b.y : b.y + h / 2;
    return `<line x1="${sx}" y1="${sy}" x2="${tx}" y2="${ty}" stroke="${stroke}" stroke-width="1.3" stroke-dasharray="2.5 2" stroke-linecap="round"/><circle cx="${tx}" cy="${ty}" r="2.4" fill="#fff" stroke="${stroke}" stroke-width="1.3"/>`;
  }
  function drawSigns() {
    const layer = $("#kgSigns"); if (!layer) return;
    let s = "";
    for (const o of sorted) {
      if (!o.room) continue;
      const r = roomCfg(o.room);
      const [ax, ay] = T.roomAnchor(o);
      if (r.comingSoon) {
        const l1 = roomTitle(o.room).replace(/^(浜辺の|編集部の)/, ""), fs = 7.5;
        const w = Math.max(tw(l1, fs), tw("COMING SOON", 6.5)) + 14, h = 22;
        const b = signBox(o.room, w, h, ax, ay);
        s += `<g class="sign" data-room="${o.room}" role="button">${pointer(b, w, h, b.tx, b.ty, NAVY, NAVY)}` +
          `<rect x="${b.x}" y="${b.y}" width="${w}" height="${h}" rx="6" fill="${NAVY}"/>` +
          `<text x="${b.x + w / 2}" y="${b.y + 9.5}" font-size="${fs}" font-weight="700" fill="#fff" text-anchor="middle">${esc(l1)}</text>` +
          `<text x="${b.x + w / 2}" y="${b.y + 18}" font-size="6.5" font-weight="800" fill="#ffd98a" text-anchor="middle" letter-spacing=".4">COMING SOON</text></g>`;
        continue;
      }
      const owner = ownerOf(o.room);
      const col = owner ? owner.color : "#bde1fb", deep = owner ? owner.deep : NAVY;
      const name = owner ? (lang === "en" ? owner.nameEn : owner.name) : roomTitle(o.room);
      const st = owner ? S.status[owner.id] : null;
      let line2 = owner ? (statusText(st) || roomTitle(o.room)) : t("tapToPeek");
      const fs1 = 8.5, fs2 = 8.5, maxW = lang === "en" ? 104 : 100;
      line2 = clip(line2, fs2, maxW);
      const w = Math.max(tw(name, fs1) + 22 + (o.room === "meeting" ? 18 : 0), tw(line2, fs2) + 12, 44), h = 28;
      const b = signBox(o.room, w, h, ax, ay);
      s += `<g class="sign" data-room="${o.room}" role="button">` +
        `<rect x="${b.x + 1}" y="${b.y + 2}" width="${w}" height="${h}" rx="8" fill="${NAVY}" opacity=".12"/>` +
        pointer(b, w, h, b.tx, b.ty, "#fff", owner ? deep : NAVY) +
        `<rect x="${b.x}" y="${b.y}" width="${w}" height="${h}" rx="8" fill="#fff" stroke="${owner ? col : NAVY}" stroke-width="1.6"/>` +
        `<circle cx="${b.x + 9}" cy="${b.y + 8.5}" r="4.2" fill="${col}"/>` +
        `<text x="${b.x + 16}" y="${b.y + 11.4}" font-size="${fs1}" font-weight="800" fill="${NAVY}">${esc(name)}</text>` +
        (o.room === "meeting" ? `<g class="dots">${[0, 1, 2].map(i => `<circle cx="${b.x + w - 18 + i * 5}" cy="${b.y + 8.5}" r="1.5" fill="${NAVY}"/>`).join("")}</g>` : "") +
        `<text x="${b.x + 6}" y="${b.y + 23}" font-size="${fs2}" fill="${NAVY}">${esc(line2)}</text></g>`;
    }
    layer.innerHTML = s;
  }

  // ---------- cards ----------
  function drawCards() {
    const ids = Object.keys(C.members);
    $("#cards").innerHTML = ids.map(id => {
      const m = C.members[id], st = S.status[id];
      const av = avatarOf(id, m);
      return `<button class="card" data-room="${m.room}" style="border-color:${m.color}">${av}<span>` +
        `<div class="who"><b>${esc(lang === "en" ? m.nameEn : m.name)}</b>${esc(roomTitle(m.room))}</div>` +
        (statusText(st) ? `<div class="st">${esc(statusText(st))}</div>` : `<div class="st muted">${esc(introLine(m.room) || "…")}</div>`) +
        (st && st.updated ? `<div class="tm">${t("updated")} ${esc(fmtJST(st.updated))}・${esc(relTime(st.updated))}</div>` : "") +
        `</span></button>`;
    }).join("");
    $("#cards").querySelectorAll(".card").forEach(b => b.onclick = () => openRoom(b.dataset.room));
  }

  // ---------- sheet ----------
  let openId = null, chatTimer = null;
  function openRoom(id) {
    openId = id;
    const r = roomCfg(id), owner = ownerOf(id), md = S.rooms.rooms[id] || {};
    $("#sheetTitle").textContent = roomTitle(id, true);
    $("#sheetHead").style.background = owner ? owner.color : id === "meeting" ? "linear-gradient(90deg,#fbabb6,#bfa6dd,#e7b66a)" : "#bde1fb";
    let h = "";
    if (id === "meeting") { renderMeeting(); showSheet(); return; }
    if (id === "board") { renderBoard(); showSheet(); return; }
    if (owner) {
      const st = S.status[owner.id];
      h += `<div class="nowbox" style="border-left-color:${owner.color}"><div class="lbl">${t("nowDoing")}・${esc(lang === "en" ? owner.nameEn : owner.name)}</div>` +
        `<div class="tx">${esc(statusText(st) || "…")}</div>` +
        (st && st.updated ? `<div class="lbl">${t("updated")} ${esc(fmtJST(st.updated))}・${esc(relTime(st.updated))}</div>` : "") + `</div>`;
    }
    if (md.ja) h += `<p>${esc(md.ja)}</p>`;
    if (md.en) h += `<p class="en">${esc(md.en)}</p>`;
    if (r.comingSoon) h += `<span class="soon">COMING SOON</span>`;
    $("#sheetBody").innerHTML = h;
    showSheet();
  }
  function renderMeeting() {
    clearTimeout(chatTimer);
    const md = S.rooms.rooms.meeting || {};
    const ms = S.meetings;
    let h = `<div class="meet-top"><img src="assets/logo_mark.jpg" alt="KAIGI GIRLS Inc."><div class="t">${md.ja && lang === "ja" ? esc(md.ja) : esc(md.en || md.ja || "")}</div></div>`;
    if (!ms.length) { $("#sheetBody").innerHTML = h + `<p>${t("noMeeting")}</p>`; return; }
    if (ms.length > 1) h += `<div class="mtabs">${ms.map((m, i) => `<button data-i="${i}" aria-pressed="${i === S.meetingSel}">${esc(m.date)}</button>`).join("")}</div>`;
    const m = ms[S.meetingSel] || ms[0];
    h += `<p style="margin:6px 0 2px"><b>${esc(m.date)}｜${esc(m.title)}</b>${m.sample ? `<span class="badge">${t("sample")}</span>` : ""}</p>`;
    h += `<div class="chat">` + (m.lines || []).map(l => {
      const mem = C.members[l.speaker] || { name: l.speaker, nameEn: l.speaker, color: "#eef3fa" };
      const isRobo = l.speaker === "robo";
      const av = isRobo ? `<span class="av"><img src="assets/robo_avatar.png" alt=""></span>` : (mem.avatar ? `<span class="av"><img src="${esc(mem.avatar)}" alt=""></span>` : `<span class="av" style="background:${mem.color}">${esc((mem.name || "?")[0])}</span>`);
      return `<div class="line${isRobo ? " right" : ""}">${av}<div class="bub" style="background:${mem.color}">` +
        `<div class="nm">${esc(lang === "en" ? mem.nameEn : mem.name)}${l.sample && !m.sample ? ` <span class="badge">${t("sample")}</span>` : ""}</div>${esc(l.text)}</div></div>`;
    }).join("") + `</div>`;
    h += `<p class="chat-note">${m.sample ? t("sampleNote") + "<br>" : ""}${t("curated")}</p><button class="replay" id="replay">${t("replay")}</button>`;
    $("#sheetBody").innerHTML = h;
    $("#sheetBody").querySelectorAll(".mtabs button").forEach(b => b.onclick = () => { S.meetingSel = +b.dataset.i; renderMeeting(); });
    $("#replay").onclick = () => renderMeeting();
    const lines = [...$("#sheetBody").querySelectorAll(".line")];
    if (STILL) { lines.forEach(l => l.classList.add("show")); return; }
    let i = 0;
    const step = () => { if (i < lines.length) { lines[i++].classList.add("show"); chatTimer = setTimeout(step, 750); } };
    chatTimer = setTimeout(step, 250);
  }
  // ---------- trend board ----------
  const avatarOf = (id, m) => id === "robo" ? `<span class="av"><img src="assets/robo_avatar.png" alt=""></span>`
    : m.avatar ? `<span class="av"><img src="${esc(m.avatar)}" alt=""></span>` : `<span class="av" style="background:${m.color}">${esc(m.name[0])}</span>`;
  function trendCard(it) {
    const m = C.members[it.who];
    const ageDays = (Date.now() - new Date(it.date + "T00:00:00+09:00").getTime()) / 864e5;
    const old = ageDays > (C.data.trendFadeDays || 7);
    return `<div class="tcard${old ? " old" : ""}">${avatarOf(it.who, m)}<div class="tbub" style="border-color:${m.color};background:${m.color}22">` +
      `<div class="nm"><b>${esc(lang === "en" ? m.nameEn : m.name)}</b><span>${t("trendPicked")} ${esc(it.date)}</span></div>` +
      `<div class="tr">${esc(it.trend)}</div>${it.comment ? `<div class="cm">${esc(it.comment)}</div>` : ""}` +
      (it.next ? `<span class="eyes" style="background:${m.color}">${t("trendNext")}</span>` : "") + `</div></div>`;
  }
  function renderBoard() {
    const md = S.rooms.rooms.board || {}, days = S.trends;
    let h = `<p>${esc((lang === "en" ? md.en : md.ja) || t("trendNote"))}</p>`;
    if (!days.length) { $("#sheetBody").innerHTML = h + `<p>${t("noTrends")}</p>`; return; }
    h += `<h4 class="th">${t("trendToday")}・${esc(days[0].date)}</h4><div class="tlist">${days[0].items.map(trendCard).join("")}</div>`;
    if (days.length > 1) h += `<h4 class="th">${t("trendArchive")}</h4>` + days.slice(1).map(d =>
      `<div class="tday"><div class="td">${esc(d.date)}</div><div class="tlist">${d.items.map(trendCard).join("")}</div></div>`).join("");
    $("#sheetBody").innerHTML = h;
  }
  function showSheet() { $("#sheet").hidden = false; $("#sheetBg").hidden = false; $("#sheetClose").focus({ preventScroll: true }); }
  function closeSheet() { $("#sheet").hidden = true; $("#sheetBg").hidden = true; openId = null; clearTimeout(chatTimer); }
  $("#sheetClose").onclick = closeSheet; $("#sheetBg").onclick = closeSheet;
  addEventListener("keydown", e => { if (e.key === "Escape" && openId) closeSheet(); });
  $("#meetBtn").onclick = () => openRoom("meeting");

  // ---------- visitor robot ----------
  const R = { x: 4.3, y: 6.9, tx: null, ty: null, keys: new Set(), raf: 0, last: 0, lastRoom: null, pendingRoom: null };
  const SPEED = 2.6;
  const blockers = () => sorted.filter(o => o.room || (o.w * o.d > 0.5 && o.id !== "tram" && o.x < 10 && o.y < 8.6));
  const inRect = (x, y, o, m = 0.1) => x > o.x - m && x < o.x + o.w + m && y > o.y - m && y < o.y + o.d + m;
  const onIsland = (x, y) => ((x - 7.6) / 1.35) ** 2 + ((y - 12.55) / 1.1) ** 2 <= 1 && ((x - 7.7) / 1.05) ** 2 + ((y - 12.4) / 0.9) ** 2 > 1;
  const walkable = (x, y) => (x >= 0.15 && x <= 9.85 && y >= 0.15 && y <= 8.45) || (x >= 7.5 && x <= 7.8 && y >= 8.4 && y <= 11.4) || onIsland(x, y);
  const zAt = (x, y) => y <= 8.45 ? T.elev(y) : onIsland(x, y) ? 4 : -0.6;
  function hitBuilding(x, y) { return blockers().find(o => inRect(x, y, o)); }

  function placeRobot() {
    const g = $("#visitor"); if (!g) return;
    const [sx, sy] = T.P(R.x, R.y, zAt(R.x, R.y));
    g.setAttribute("transform", `translate(${sx.toFixed(1)},${sy.toFixed(1)})`);
    // painter's order: after the last object that is behind the robot
    const objs = [...$("#kgObjs").children].filter(n => n !== g);
    let after = null;
    for (const n of objs) {
      const o = { x: +n.dataset.x, y: +n.dataset.y, w: +n.dataset.w, d: +n.dataset.d };
      if (o.x + o.w <= R.x - 0.05 || o.y + o.d <= R.y - 0.05) after = n;
    }
    const want = after ? after.nextSibling : objs[0];
    if (want !== g && g.previousSibling !== after) $("#kgObjs").insertBefore(g, want);
  }
  function tryMove(dx, dy) {
    let moved = false;
    const go = (nx, ny) => { if (walkable(nx, ny)) { const b = hitBuilding(nx, ny); if (!b) { R.x = nx; R.y = ny; return true; } if (b.room && (R.keys.size || b.room === R.pendingRoom)) knock(b.room); } return false; };
    if (go(R.x + dx, R.y + dy)) moved = true;
    else { if (dx && go(R.x + dx, R.y)) moved = true; if (dy && go(R.x, R.y + dy)) moved = true; }
    return moved;
  }
  function knock(room) {   // walked into a building => peek inside
    if (openId || R.lastRoom === room) return;
    R.lastRoom = room; R.tx = R.ty = null; R.keys.clear();
    openRoom(room);
  }
  function loop(ts) {
    const dt = Math.min(0.05, (ts - (R.last || ts)) / 1000); R.last = ts;
    let dx = 0, dy = 0;
    if (R.keys.size) {
      if (R.keys.has("ArrowUp")) { dx -= 1; dy -= 1; } if (R.keys.has("ArrowDown")) { dx += 1; dy += 1; }
      if (R.keys.has("ArrowLeft")) { dx -= 1; dy += 1; } if (R.keys.has("ArrowRight")) { dx += 1; dy -= 1; }
      R.tx = R.ty = null;
    } else if (R.tx != null) { dx = R.tx - R.x; dy = R.ty - R.y; }
    const len = Math.hypot(dx, dy);
    if (len > 0.001) {
      const st = Math.min(SPEED * dt, R.tx != null && !R.keys.size ? len : Infinity);
      const ok = tryMove(dx / len * st, dy / len * st);
      if (!ok && R.tx != null) R.tx = R.ty = null;
      if (R.tx != null && Math.hypot(R.tx - R.x, R.ty - R.y) < 0.03) { R.tx = R.ty = null; if (R.pendingRoom) { R.pendingRoom = null; } }
      if (R.lastRoom && !hitBuilding(R.x + 0.2, R.y + 0.2) && !hitBuilding(R.x - 0.2, R.y - 0.2)) R.lastRoom = null;
      placeRobot();
      $("#visitor .vbody").setAttribute("transform", `translate(0,${(Math.sin(ts / 70) * 0.6).toFixed(2)})`);
    }
    R.raf = (R.keys.size || R.tx != null) ? requestAnimationFrame(loop) : 0;
    if (!R.raf) R.last = 0;
  }
  const kick = () => { if (!R.raf) R.raf = requestAnimationFrame(loop); };
  function walkTo(x, y) { R.tx = x; R.ty = y; kick(); }

  function svgPoint(ev) {
    const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  }
  function toGrid(sx, sy) {
    let z = 0, gx = 0, gy = 0;
    for (let i = 0; i < 3; i++) {
      const a = (sx - T.iso.cx) / T.iso.hw, b = (sy + z - T.iso.oy) / T.iso.hh;
      gx = (a + b) / 2; gy = (b - a) / 2; z = gy <= 8.45 ? T.elev(Math.max(0, gy)) : 0;
    }
    return [gx, gy];
  }
  svg.addEventListener("click", ev => {
    const gHit = ev.target.closest("[data-girl]");
    if (gHit && C.members[gHit.dataset.girl]) { openRoom(C.members[gHit.dataset.girl].room); return; }
    const hit = ev.target.closest("[data-room]");
    if (hit) { const room = hit.dataset.room; const d = T.DOORS[room]; if (d) walkTo(d[0], d[1]); R.lastRoom = room; openRoom(room); return; }
    const p = svgPoint(ev); let [gx, gy] = toGrid(p.x, p.y);
    R.pendingRoom = null;
    if (!walkable(gx, gy)) { gx = Math.min(9.85, Math.max(0.15, gx)); gy = Math.min(8.45, Math.max(0.15, gy)); }
    walkTo(gx, gy);
  });
  svg.addEventListener("keydown", ev => { if ((ev.key === "Enter" || ev.key === " ") && ev.target.dataset && ev.target.dataset.room) { ev.preventDefault(); openRoom(ev.target.dataset.room); } });
  addEventListener("keydown", e => {
    if (!e.key.startsWith("Arrow") || openId) return;
    e.preventDefault(); R.keys.add(e.key); kick();
  });
  addEventListener("keyup", e => R.keys.delete(e.key));
  addEventListener("blur", () => R.keys.clear());

  // ---------- girls' little walks ----------
  // Every 20–40 s one girl steps out of her place, walks a short route on open ground,
  // pauses, and walks back. Routes are grid waypoints (first = her home spot).
  // Off in ?still=1 / prefers-reduced-motion.
  const GIRL_ROUTES = {
    rin:  [[2.4, 6.6], [1.75, 7.3], [1.75, 7.75], [3.4, 7.85]],        // gym -> beach
    mio:  [[4.77, 4.6], [4.78, 5.1], [4.78, 6.05], [5.9, 6.05]],       // down the alley -> across the tram street
    rina: [[8.8, 4.87], [8.8, 4.98], [7.2, 4.98], [7.2, 6.3], [7.6, 7.8]] // tracks -> crossing -> beach
  };
  const G = {};   // id -> { el, inner, x0, y0, z0, x, y, face }
  function placeObj(el, gx, gy) {   // painter's order, same rule as the visitor robot
    const objs = [...$("#kgObjs").children].filter(n => n !== el);
    let after = null;
    for (const n of objs) {
      const o = { x: +n.dataset.x, y: +n.dataset.y, w: +n.dataset.w, d: +n.dataset.d };
      if (o.x + o.w <= gx - 0.05 || o.y + o.d <= gy - 0.05) after = n;
    }
    const want = after ? after.nextSibling : objs[0];
    if (want !== el && el.previousSibling !== after) $("#kgObjs").insertBefore(el, want);
  }
  function placeGirl(g, bob) {
    const z = g.home ? g.z0 : zAt(g.x, g.y);
    const [sx, sy] = T.P(g.x, g.y, z), [hx, hy] = T.P(g.x0, g.y0, g.z0);
    g.el.setAttribute("transform", `translate(${(sx - hx).toFixed(1)},${(sy - hy).toFixed(1)})`);
    g.inner.setAttribute("transform", `translate(${hx.toFixed(1)},${(hy + bob).toFixed(1)}) scale(${g.face},1)`);
    placeObj(g.el, g.x, g.y);
  }
  function girlWalk(id) {
    const g = G[id], route = GIRL_ROUTES[id];
    const path = route.concat(route.slice(0, -1).reverse());   // out and back
    const PAUSE_AT = route.length - 1, GS = 0.9;               // grid units / s
    let i = 0, last = 0, pauseUntil = 0;
    g.walking = true;
    const step = ts => {
      if (document.hidden) { last = ts; requestAnimationFrame(step); return; }
      const dt = Math.min(0.05, (ts - (last || ts)) / 1000); last = ts;
      if (ts < pauseUntil) { placeGirl(g, 0); requestAnimationFrame(step); return; }
      const [tx, ty] = path[i + 1], dx = tx - g.x, dy = ty - g.y, len = Math.hypot(dx, dy);
      const sxDir = dx - dy;                                   // screen-x direction on the iso map
      if (Math.abs(sxDir) > 0.01) g.face = sxDir < 0 ? -1 : 1;
      const st = GS * dt;
      if (len <= st) {
        g.x = tx; g.y = ty; i++;
        g.home = i === 0 || i === path.length - 1;
        if (i === PAUSE_AT) pauseUntil = ts + 2500 + Math.random() * 1500;
        if (i >= path.length - 1) { g.face = 1; g.home = true; placeGirl(g, 0); g.walking = false; return; }
      } else { g.x += dx / len * st; g.y += dy / len * st; g.home = false; }
      placeGirl(g, -Math.abs(Math.sin(ts / 110)) * 1.1);
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function girlsInit() {
    sorted.filter(o => o.girl).forEach(o => {
      const el = $(`#kgObjs [data-girl="${o.girl}"]`); if (!el) return;
      const inner = el.firstElementChild;
      G[o.girl] = { el, inner, x0: o.gx, y0: o.gy, z0: o.gz, x: o.gx, y: o.gy, face: 1, home: true, walking: false };
    });
    if (STILL) return;
    const next = () => setTimeout(() => {
      const free = Object.keys(G).filter(id => !G[id].walking && GIRL_ROUTES[id]);
      if (free.length && !document.hidden) girlWalk(free[Math.floor(Math.random() * free.length)]);
      next();
    }, 20000 + Math.random() * 20000);
    next();
  }

  // ---------- tram ----------
  function tramLoop() {
    const el = $("#kgTram"); if (!el) return;
    const place = u => el.setAttribute("transform", `translate(${(u * T.iso.hw).toFixed(1)},${(u * T.iso.hh).toFixed(1)})`);
    if (STILL) { place(6.3); return; }
    const A = -2.6, B = 10.4, V = 0.85, PAUSE = 3;
    const cycle = (B - A) / V + PAUSE;
    const f = ts => {
      if (!document.hidden) { const s = (ts / 1000) % cycle; place(s < PAUSE ? A : A + (s - PAUSE) * V); }
      requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  }

  // ---------- data refresh ----------
  async function refresh() {
    const [st, rm, mt, tr] = await Promise.allSettled([D.loadStatus(), D.loadRooms(), D.loadMeetings(), D.loadTrends()]);
    if (st.status === "fulfilled") S.status = st.value; else console.warn(st.reason);
    if (rm.status === "fulfilled") S.rooms = rm.value; else console.warn(rm.reason);
    if (mt.status === "fulfilled") S.meetings = mt.value; else console.warn(mt.reason);
    if (tr.status === "fulfilled") S.trends = tr.value; else console.warn(tr.reason);
    S.loadedAt = new Date();
    paintText();
    if (openId && openId !== "meeting") openRoom(openId);
  }
  function paintText() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(el => { const v = t(el.dataset.i18n); if (typeof v === "string") el.textContent = v; });
    $("#hint").innerHTML = `<span>${esc(t("hint"))}</span>`;
    $("#langBtn").textContent = lang === "ja" ? "EN" : "日本語";
    const intro = S.rooms.intro || {};
    $("#townIntro").textContent = (lang === "en" ? intro.en : intro.ja) || "";
    if (S.loadedAt) $("#lastLoad").textContent = `${t("loaded")} ${new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit" }).format(S.loadedAt)} JST`;
    const yt = $("#visitor text"); if (yt) yt.textContent = t("you");
    drawSigns(); drawCards(); drawLinks(); drawCounter();
  }
  $("#langBtn").onclick = () => { lang = lang === "ja" ? "en" : "ja"; localStorage.setItem("kg_lang", lang); paintText(); if (openId) openRoom(openId); };

  function drawLinks() {
    $("#links").innerHTML = Object.values(C.links).map(l => {
      const label = esc(lang === "en" ? l.labelEn : l.label);
      return l.href ? `<a href="${esc(l.href)}" target="_blank" rel="noopener">📝 ${label}</a>` : `<span title="URL TBD">📝 ${label}（${t("soonText")}）</span>`;
    }).join("");
  }

  // ---------- counter (anonymous total only) ----------
  let counter = null, visits = null;
  function drawCounter() {
    const el = $("#counter");
    if (!counter || visits == null) { el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = `🤖 ${t("visitors")} <b>${visits.toLocaleString()}</b><small>${esc(counter.label)}</small>`;
  }
  async function initCounter() {
    try { counter = await window.KG_COUNTER.create(); if (counter) visits = await counter.hit(); } catch (e) { console.warn(e); counter = null; }
    drawCounter();
  }

  // ---------- boot ----------
  drawMap();
  tramLoop();
  girlsInit();
  refresh();
  initCounter();
  setInterval(refresh, (C.data.refreshSeconds || 60) * 1000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) refresh(); });
  if (params.get("open")) setTimeout(() => openRoom(params.get("open")), 400);
  window.KG_APP = { openRoom, walkTo, R, G, girlWalk, GIRL_ROUTES, walkable, hitBuilding };
})();
