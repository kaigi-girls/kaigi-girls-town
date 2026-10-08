/* KAIGI GIRLS TOWN — app glue: signs, cards, room sheet, meeting chat, visitor robot, tram, counter */
(function () {
  const C = window.KG_CONFIG, D = window.KG_DATA, T = window.KG_TOWN;
  const { robotSVG, NAVY } = window.KG_ISO;
  const $ = s => document.querySelector(s);
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const params = new URLSearchParams(location.search);
  const STILL = params.has("still") || matchMedia("(prefers-reduced-motion: reduce)").matches;

  const I18N = {
    ja: { tagline: "ロボになって、街をのぞこう", hint: "タップした場所へ歩くよ・建物は「入る」でのぞける", nowTitle: "いま、なにしてる？",
      meetBtn: "会議室をのぞく", footNote: "この街と登場人物はフィクションです。人間はみんな小さなロボの姿で遊びに来ています。",
      updated: "更新", minAgo: n => `${n}分前`, hourAgo: n => `${n}時間前`, dayAgo: n => `${n}日前`, justNow: "たった今",
      visitors: "これまでに来たロボ", comingSoon: "COMING SOON", tapToPeek: "タップでのぞく", nowDoing: "いま",
      noStatus: "ひみつ", sample: "サンプル", sampleNote: "※サンプルの会話です（実際の会議ではありません）",
      curated: "公開OKになったセリフだけを載せています。", replay: "もう一度再生", you: "YOU", loaded: "自動更新",
      noMeeting: "まだ公開できる会議はありません。", soonText: "準備中",
      trendToday: "今日のトレンド", trendArchive: "トレンドの記録", trendNext: "次で使うかも👀", trendPicked: "ピック", noTrends: "まだトレンドはありません。", trendNote: "メンバーが気になった話題をひとことで。",
      hint2: "ロボを三人に近づけると、ひとこと話すよ", talkTo: n => `${n}に話しかける`, heard: "今日おはなしした",
      rewardHint: "三人とおはなしすると、今日のオフショットが見られるよ", rewardTitle: "今日のオフショット📸", rewardEmpty: "ゴール！オフショットは準備中だよ", close: "閉じる",
      enterQ: n => `${n}に入る？`, enterGo: "入る", enterNo: "やめる" },
    en: { tagline: "Become a tiny robot and peek into our town", hint: "Tap to walk · tap a building, then “Go in” to peek", nowTitle: "What's everyone doing?",
      meetBtn: "Peek into the meeting room", footNote: "This town and its characters are fictional. Humans visit as tiny robots.",
      updated: "updated", minAgo: n => `${n} min ago`, hourAgo: n => `${n} h ago`, dayAgo: n => `${n} d ago`, justNow: "just now",
      visitors: "robots visited so far", comingSoon: "COMING SOON", tapToPeek: "tap to peek", nowDoing: "Now",
      noStatus: "secret", sample: "SAMPLE", sampleNote: "* Sample conversation (not a real meeting)",
      curated: "Only lines approved for publishing appear here.", replay: "Replay", you: "YOU", loaded: "auto-refresh",
      noMeeting: "No public meetings yet.", soonText: "coming soon",
      trendToday: "Today's trends", trendArchive: "Trend archive", trendNext: "maybe next post 👀", trendPicked: "picked", noTrends: "No trends yet.", trendNote: "Topics the girls are into, in one line.",
      hint2: "Walk your robot up to the girls to hear what they're up to", talkTo: n => `Talk to ${n}`, heard: "Talked today",
      rewardHint: "Talk to all three to unlock today's off-shot", rewardTitle: "Today's off-shot 📸", rewardEmpty: "Goal! Off-shots coming soon", close: "Close",
      enterQ: n => `Go into ${n}?`, enterGo: "Go in", enterNo: "Cancel" }
  };
  let lang = localStorage.getItem("kg_lang") === "en" ? "en" : "ja";
  const t = k => I18N[lang][k];

  const S = { status: {}, rooms: { rooms: {}, intro: {} }, meetings: [], meetingSel: 0, trends: [], rewards: [] };
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
    board:     { x: 212, y: 190, to: [224, 216] },
    lighthouse: { x: 189, y: 270 }   // out at sea, right of the bridge (clear of the gym / shop / editorial labels' hit pads)
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
  // Tap targets: every sign gets an invisible "hitpad" of at least HIT_PX CSS px (sized from the
  // current map scale), so a slightly-off tap still lands. Neighbouring pads never overlap
  // (they are split at the middle of the overlap, never cutting into a visible label).
  const HIT_PX = 46;   // >= 44 px with a little rounding slack
  function hitUnits() { const w = svg.getBoundingClientRect().width; return w > 0 ? HIT_PX * T.VB.w / w : 30; }
  function signPads(items) {
    const U = hitUnits();
    const pads = items.map(it => { const w = Math.max(it.w, U), h = Math.max(it.h, U); return { x: it.x + (it.w - w) / 2, y: it.y + (it.h - h) / 2, w, h, b: it }; });
    for (let i = 0; i < pads.length; i++) for (let j = i + 1; j < pads.length; j++) {
      const a = pads[i], c = pads[j];
      const ox = Math.min(a.x + a.w, c.x + c.w) - Math.max(a.x, c.x), oy = Math.min(a.y + a.h, c.y + c.h) - Math.max(a.y, c.y);
      if (ox <= 0 || oy <= 0) continue;
      const ax = ox <= oy ? "x" : "y", sz = ax === "x" ? "w" : "h";
      const [lo, hi] = a[ax] + a[sz] / 2 <= c[ax] + c[sz] / 2 ? [a, c] : [c, a];
      const cut = (Math.max(lo[ax], hi[ax]) + Math.min(lo[ax] + lo[sz], hi[ax] + hi[sz])) / 2;   // middle of the overlap
      const loEnd = Math.max(cut, lo.b[ax] + lo.b[sz]), hiStart = Math.min(cut, hi.b[ax]);
      lo[sz] = loEnd - lo[ax];
      hi[sz] = hi[ax] + hi[sz] - hiStart; hi[ax] = hiStart;
    }
    return pads;
  }
  function drawSigns() {
    const layer = $("#kgSigns"); if (!layer) return;
    const items = [];   // { room, x, y, w, h, html }
    for (const o of sorted) {
      if (!o.room) continue;
      const r = roomCfg(o.room);
      const [ax, ay] = T.roomAnchor(o);
      if (r.comingSoon) {
        const l1 = roomTitle(o.room).replace(/^(浜辺の|編集部の)/, ""), fs = 7.5;
        const w = Math.max(tw(l1, fs), tw("COMING SOON", 6.5)) + 14, h = 22;
        const b = signBox(o.room, w, h, ax, ay);
        items.push({ room: o.room, x: b.x, y: b.y, w, h, html: `<g pointer-events="none">${pointer(b, w, h, b.tx, b.ty, NAVY, NAVY)}</g>` +
          `<rect class="sbody" x="${b.x}" y="${b.y}" width="${w}" height="${h}" rx="6" fill="${NAVY}"/>` +
          `<text x="${b.x + w / 2}" y="${b.y + 9.5}" font-size="${fs}" font-weight="700" fill="#fff" text-anchor="middle">${esc(l1)}</text>` +
          `<text x="${b.x + w / 2}" y="${b.y + 18}" font-size="6.5" font-weight="800" fill="#ffd98a" text-anchor="middle" letter-spacing=".4">COMING SOON</text>` });
        continue;
      }
      const owner = ownerOf(o.room);
      const col = owner ? owner.color : "#bde1fb", deep = owner ? owner.deep : NAVY;
      const name = owner ? (lang === "en" ? owner.nameEn : owner.name) : (lang === "en" ? r.signEn : r.sign) || roomTitle(o.room);
      const st = owner ? S.status[owner.id] : null;
      let line2 = owner ? (statusText(st) || roomTitle(o.room)) : t("tapToPeek");
      const fs1 = 8.5, fs2 = 8.5, maxW = lang === "en" ? 104 : 100;
      line2 = clip(line2, fs2, maxW);
      const w = Math.max(tw(name, fs1) + 22 + (o.room === "meeting" ? 18 : 0), tw(line2, fs2) + 12, 44), h = 28;
      const b = signBox(o.room, w, h, ax, ay);
      items.push({ room: o.room, x: b.x, y: b.y, w, h, html:
        `<rect x="${b.x + 1}" y="${b.y + 2}" width="${w}" height="${h}" rx="8" fill="${NAVY}" opacity=".12" pointer-events="none"/>` +
        `<g pointer-events="none">${pointer(b, w, h, b.tx, b.ty, "#fff", owner ? deep : NAVY)}</g>` +
        `<rect class="sbody" x="${b.x}" y="${b.y}" width="${w}" height="${h}" rx="8" fill="#fff" stroke="${owner ? col : NAVY}" stroke-width="1.6"/>` +
        `<circle cx="${b.x + 9}" cy="${b.y + 8.5}" r="4.2" fill="${col}"/>` +
        `<text x="${b.x + 16}" y="${b.y + 11.4}" font-size="${fs1}" font-weight="800" fill="${NAVY}">${esc(name)}</text>` +
        (o.room === "meeting" ? `<g class="dots">${[0, 1, 2].map(i => `<circle cx="${b.x + w - 18 + i * 5}" cy="${b.y + 8.5}" r="1.5" fill="${NAVY}"/>`).join("")}</g>` : "") +
        `<text x="${b.x + 6}" y="${b.y + 23}" font-size="${fs2}" fill="${NAVY}">${esc(line2)}</text>` });
    }
    const pads = signPads(items);
    layer.innerHTML = items.map((it, i) => { const p = pads[i];
      return `<g class="sign" data-room="${it.room}" role="button"><rect class="hitpad" x="${p.x.toFixed(1)}" y="${p.y.toFixed(1)}" width="${p.w.toFixed(1)}" height="${p.h.toFixed(1)}" fill="#fff" fill-opacity="0"/>${it.html}</g>`; }).join("");
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
    hideEnter();
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
    const pJa = md.ja || r.introJa, pEn = md.en || r.introEn;   // rooms.md first; config text for spots it doesn't cover
    if (pJa) h += `<p>${esc(pJa)}</p>`;
    if (pEn) h += `<p class="en">${esc(pEn)}</p>`;
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
  // Taps never open a panel by themselves. Ground = walk there. Building / sign = walk to its door
  // and ask 「〇〇に入る？」 in the enter bar; only 「入る」 opens the panel. Arriving next to a building
  // (or bumping into it with the arrow keys) asks too; walking away closes the bar.
  const R = { x: 4.3, y: 6.9, tx: null, ty: null, keys: new Set(), raf: 0, last: 0, pendingRoom: null, talkTo: null, goal: null, bump: null, path: [], chk: null };
  const SPEED = 2.6;
  const blockers = () => sorted.filter(o => o.room || (o.w * o.d > 0.5 && o.id !== "tram" && o.x < 10 && o.y < 8.6));
  const inRect = (x, y, o, m = 0.1) => x > o.x - m && x < o.x + o.w + m && y > o.y - m && y < o.y + o.d + m;
  // town block + the bridge + the lighthouse island's flat top (shapes live in js/town.js)
  const walkable = (x, y) => (x >= 0.15 && x <= 9.85 && y >= 0.15 && y <= 8.45) || T.onBridge(x, y) || T.onIsle(x, y);
  const zAt = (x, y) => T.groundZ(x, y);
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
    let moved = false; R.bump = null;
    const go = (nx, ny) => { if (walkable(nx, ny)) { const b = hitBuilding(nx, ny); if (!b) { R.x = nx; R.y = ny; return true; } if (b.room) R.bump = b.room; } return false; };
    if (go(R.x + dx, R.y + dy)) moved = true;
    else {   // blocked: slide along the wall at full step (bigger component first; ignore near-head-on)
      const L = Math.hypot(dx, dy), axes = Math.abs(dx) >= Math.abs(dy) ? [[dx, 0], [0, dy]] : [[0, dy], [dx, 0]];
      for (const [ax, ay] of axes) if (Math.abs(ax + ay) > 0.05 * L && go(R.x + Math.sign(ax) * L, R.y + Math.sign(ay) * L)) { moved = true; break; }
    }
    return moved;
  }

  // ---------- route finding (so a tapped building's door is actually reached) ----------
  // 0.1-grid occupancy map built once (buildings never move); BFS + line-of-sight smoothing.
  const NAV = { s: 0.1, W: 100, H: 140, free: null };
  const freeAt = (x, y) => walkable(x, y) && !hitBuilding(x, y);
  const roomy = (x, y, m = 0.04) => freeAt(x, y) && freeAt(x + m, y) && freeAt(x - m, y) && freeAt(x, y + m) && freeAt(x, y - m);   // not a zero-width gap
  function navGrid() {
    if (NAV.free) return NAV.free;
    const f = new Uint8Array(NAV.W * NAV.H);
    for (let j = 0; j < NAV.H; j++) for (let i = 0; i < NAV.W; i++) f[j * NAV.W + i] = roomy((i + 0.5) * NAV.s, (j + 0.5) * NAV.s) ? 1 : 0;
    return (NAV.free = f);
  }
  function nearestFree(x, y) {
    const f = navGrid(), ci = Math.floor(x / NAV.s), cj = Math.floor(y / NAV.s);
    for (let r = 0; r < 30; r++) { let best = -1, bd = Infinity;
      for (let j = cj - r; j <= cj + r; j++) for (let i = ci - r; i <= ci + r; i++) {
        if (Math.max(Math.abs(i - ci), Math.abs(j - cj)) !== r || i < 0 || j < 0 || i >= NAV.W || j >= NAV.H || !f[j * NAV.W + i]) continue;
        const d = Math.hypot((i + 0.5) * NAV.s - x, (j + 0.5) * NAV.s - y); if (d < bd) { bd = d; best = j * NAV.W + i; } }
      if (best >= 0) return best; }
    return -1;
  }
  function clearLine(x0, y0, x1, y1) {
    const n = Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 0.05);
    for (let k = 1; k <= n; k++) if (!(k === n ? freeAt : roomy)(x0 + (x1 - x0) * k / n, y0 + (y1 - y0) * k / n)) return false;
    return true;
  }
  function findPath(x0, y0, x1, y1) {   // -> [[x,y], ...] ending at the goal (or the free spot nearest to it)
    if (clearLine(x0, y0, x1, y1)) return [[x1, y1]];
    const f = navGrid(), W = NAV.W, a = nearestFree(x0, y0), b = nearestFree(x1, y1);
    if (a < 0 || b < 0) return [[x1, y1]];
    const prev = new Int32Array(W * NAV.H).fill(-1), q = [a]; prev[a] = a;
    for (let h = 0; h < q.length && prev[b] < 0; h++) {
      const c = q[h], i = c % W, j = (c - i) / W;
      for (let dj = -1; dj <= 1; dj++) for (let di = -1; di <= 1; di++) {
        const ni = i + di, nj = j + dj, n = nj * W + ni;
        if ((!di && !dj) || ni < 0 || nj < 0 || ni >= W || nj >= NAV.H || !f[n] || prev[n] >= 0) continue;
        if (di && dj && (!f[j * W + ni] || !f[nj * W + i])) continue;   // no corner cutting
        prev[n] = c; q.push(n);
      }
    }
    if (prev[b] < 0) return [[x1, y1]];
    const cells = []; for (let c = b; c !== a; c = prev[c]) cells.push(c); cells.reverse();
    const pts = cells.map(c => [(c % W + 0.5) * NAV.s, (Math.floor(c / W) + 0.5) * NAV.s]);
    const goal = freeAt(x1, y1) ? [x1, y1] : pts[pts.length - 1];
    if (freeAt(x1, y1)) pts.push(goal);
    const out = []; let cx = x0, cy = y0, k = 0;   // keep only the corners we must turn at
    while (k < pts.length) { let far = k; for (let m = pts.length - 1; m > k; m--) if (clearLine(cx, cy, pts[m][0], pts[m][1])) { far = m; break; }
      out.push(pts[far]); [cx, cy] = pts[far]; k = far + 1; }
    return out;
  }

  // ---------- enter bar 「〇〇に入る？」 ----------
  const CONF = { room: null, no: null, el: null, NEAR: 0.4, LEAVE: 0.9 };
  function roomDist(room, x = R.x, y = R.y) {   // grid distance to the building's footprint or its door
    const o = sorted.find(q => q.room === room); if (!o) return Infinity;
    const dx = Math.max(o.x - x, 0, x - (o.x + o.w)), dy = Math.max(o.y - y, 0, y - (o.y + o.d));
    const d = T.DOORS[room];
    return Math.min(Math.hypot(dx, dy), d ? Math.hypot(d[0] - x, d[1] - y) : Infinity);
  }
  function nearRoom(x = R.x, y = R.y) {
    let best = null;
    for (const o of sorted) if (o.room) { const d = roomDist(o.room, x, y); if (d <= CONF.NEAR && (!best || d < best.d)) best = { room: o.room, d }; }
    return best && best.room;
  }
  function paintEnter() {
    const el = CONF.el; if (!el || !CONF.room) return;
    const owner = ownerOf(CONF.room);
    el.style.setProperty("--c", owner ? owner.color : CONF.room === "meeting" ? "#bfa6dd" : "#bde1fb");
    const [pre, post] = t("enterQ")("\u0000").split("\u0000");   // keep 「に入る？」 / "?" from breaking off on its own line
    el.querySelector(".q").innerHTML = `${esc(pre)}${esc(roomTitle(CONF.room))}<span class="sfx">${esc(post)}</span>`;
    el.querySelector(".go").textContent = t("enterGo");
    el.querySelector(".no").textContent = t("enterNo");
  }
  function askEnter(room, explicit) {   // explicit = the user tapped this building / its sign
    if (!room || !CONF.el || openId) return;
    if (!explicit && CONF.no === room) return;   // said 「やめる」 here; ask again only after walking away
    if (explicit) CONF.no = null;
    const was = CONF.room; CONF.room = room; paintEnter();
    if (was !== room || CONF.el.hidden) { CONF.el.hidden = false; CONF.el.classList.remove("show"); void CONF.el.offsetWidth; CONF.el.classList.add("show"); }
  }
  function hideEnter() { CONF.room = null; if (CONF.el) CONF.el.hidden = true; }
  function enterGo() {
    const room = CONF.room; if (!room) return;
    CONF.no = room;   // no re-ask at this door right after the panel closes
    if (R.pendingRoom === room) R.pendingRoom = null;
    openRoom(room);
  }
  function enterNo() {
    const room = CONF.room; CONF.no = room;
    if (room && R.pendingRoom === room) { R.pendingRoom = null; R.tx = R.ty = null; R.path = []; R.goal = null; }
    hideEnter();
  }
  function checkLeave() {
    if (CONF.room && CONF.room !== R.pendingRoom && roomDist(CONF.room) > CONF.LEAVE) hideEnter();
    if (CONF.no && roomDist(CONF.no) > CONF.LEAVE) CONF.no = null;
  }
  function arrived() {   // the robot stopped (reached the target or got blocked)
    clearMark();
    const goal = R.goal; R.goal = null;
    if (goal === "talk") return;
    if (R.pendingRoom) { const room = R.pendingRoom; R.pendingRoom = null; askEnter(room, false); return; }
    askEnter(nearRoom(), false);
  }
  function enterInit() {
    const el = document.createElement("div");
    el.id = "enterBar"; el.className = "enterbar" + (STILL ? " still" : ""); el.hidden = true;
    el.setAttribute("role", "group"); el.setAttribute("aria-live", "polite");
    el.innerHTML = `<i class="dot" aria-hidden="true"></i><b class="q"></b><button type="button" class="go"></button><button type="button" class="no"></button>`;
    el.querySelector(".go").onclick = enterGo; el.querySelector(".no").onclick = enterNo;
    document.body.appendChild(el); CONF.el = el;
    addEventListener("keydown", e => { if (e.key === "Escape" && CONF.room && !openId) enterNo(); });
  }

  // little ring where the robot is heading (ground taps)
  function showMark(gx, gy) {
    clearMark();
    const layer = $("#kgGround"); if (!layer) return;
    const [x, y] = T.P(gx, gy, zAt(gx, gy));
    const m = document.createElementNS("http://www.w3.org/2000/svg", "g");
    m.id = "tapMark"; m.setAttribute("pointer-events", "none");
    m.innerHTML = `<ellipse cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" rx="6.5" ry="3.25" fill="#fff" fill-opacity=".55" stroke="${NAVY}" stroke-opacity=".55" stroke-width="1"/>`;
    layer.appendChild(m);
  }
  function clearMark() { const m = $("#tapMark"); if (m) m.remove(); }

  function loop(ts) {
    const dt = Math.min(0.05, (ts - (R.last || ts)) / 1000); R.last = ts;
    let dx = 0, dy = 0;
    if (R.keys.size) {
      if (R.keys.has("ArrowUp")) { dx -= 1; dy -= 1; } if (R.keys.has("ArrowDown")) { dx += 1; dy += 1; }
      if (R.keys.has("ArrowLeft")) { dx -= 1; dy += 1; } if (R.keys.has("ArrowRight")) { dx += 1; dy -= 1; }
      R.tx = R.ty = null; R.path = [];
      R.talkTo = null;
    } else if (R.tx != null) {
      if (R.talkTo && !R.path.length) { const sp = talkSpot(R.talkTo); R.tx = sp[0]; R.ty = sp[1]; }   // follow her if she is walking
      dx = R.tx - R.x; dy = R.ty - R.y;
    }
    const len = Math.hypot(dx, dy);
    if (len > 0.001) {
      const st = Math.min(SPEED * dt, R.tx != null && !R.keys.size ? len : Infinity);
      const ok = tryMove(dx / len * st, dy / len * st);
      if (R.bump && (R.keys.size || R.bump === R.pendingRoom)) askEnter(R.bump, false);   // bumped into it: ask, never open
      let stop = false;
      if (!ok && R.tx != null) { R.tx = R.ty = null; R.path = []; stop = true; }
      if (R.tx != null && !R.keys.size) {   // sliding along a wall without getting closer: give up there
        const d = Math.hypot(R.tx - R.x, R.ty - R.y);
        if (!R.chk) R.chk = { t: ts, d };
        else if (ts - R.chk.t > 300) { if (R.chk.d - d < Math.min(0.25, R.chk.d * 0.5)) { R.tx = R.ty = null; R.path = []; stop = true; } else R.chk = { t: ts, d }; }
      }
      if (R.tx != null && Math.hypot(R.tx - R.x, R.ty - R.y) < 0.03) {
        if (R.path.length) { [R.tx, R.ty] = R.path.shift(); R.chk = null; } else { R.tx = R.ty = null; stop = true; }
      }
      placeRobot();
      $("#visitor .vbody").setAttribute("transform", `translate(0,${(Math.sin(ts / 70) * 0.6).toFixed(2)})`);
      checkTalk();
      checkLeave();
      if (stop) arrived();
    } else if (R.tx != null && !R.keys.size) {   // already at this point
      if (R.path.length) [R.tx, R.ty] = R.path.shift(); else { R.tx = R.ty = null; arrived(); }
    }
    if (R.talkTo && R.tx == null && !R.keys.size) arriveTalk();
    R.raf = (R.keys.size || R.tx != null) ? requestAnimationFrame(loop) : 0;
    if (!R.raf) R.last = 0;
  }
  const kick = () => { if (!R.raf) R.raf = requestAnimationFrame(loop); };
  function walkTo(x, y) {   // walks around buildings (route), not just straight at the point
    R.path = findPath(R.x, R.y, x, y); [R.tx, R.ty] = R.path.shift(); R.chk = null; kick();
  }
  function tapRoom(room) {   // tap on a building or its sign: walk to the door and ask
    R.talkTo = null; R.keys.clear(); clearMark();
    askEnter(room, true);
    const d = T.DOORS[room];
    if (d && Math.hypot(d[0] - R.x, d[1] - R.y) > 0.05) { R.pendingRoom = room; R.goal = "room"; walkTo(d[0], d[1]); }
    else { R.pendingRoom = null; R.goal = null; }
  }

  function svgPoint(ev) {   // ev = { clientX, clientY }
    const p = svg.createSVGPoint(); p.x = ev.clientX; p.y = ev.clientY;
    return p.matrixTransform(svg.getScreenCTM().inverse());
  }
  function toGrid(sx, sy) {
    let z = 0, gx = 0, gy = 0;
    for (let i = 0; i < 3; i++) {
      const a = (sx - T.iso.cx) / T.iso.hw, b = (sy + z - T.iso.oy) / T.iso.hh;
      gx = (a + b) / 2; gy = (b - a) / 2; z = T.groundZ(gx, gy);
    }
    return [gx, gy];
  }
  // What did this tap mean? Visible label > visible girl > nearest invisible hit pad > building art > ground.
  const pxDist = (r, x, y) => Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom));
  function pickTarget(ev) {   // ev = { clientX, clientY }
    const x = ev.clientX, y = ev.clientY;
    const els = document.elementsFromPoint(x, y).filter(n => n !== svg && svg.contains(n));
    const pads = els.filter(n => n.classList.contains("hitpad")), real = els.filter(n => !n.classList.contains("hitpad"));
    const as = n => { const s = n.closest(".sign"); if (s) return { room: s.dataset.room }; const g = n.closest("[data-girl]"); return g && G[g.dataset.girl] ? { girl: g.dataset.girl } : null; };
    let n = real.find(n => n.closest(".sign")); if (n) return as(n);
    n = real.find(n => { const g = n.closest("[data-girl]"); return g && G[g.dataset.girl]; }); if (n) return as(n);
    let best = null;
    for (const p of pads) {
      const own = p.closest(".sign") || p.closest("[data-girl]"); if (!own) continue;
      const vis = own.classList.contains("sign") ? own.querySelector(".sbody") : (G[own.dataset.girl] || {}).inner;
      if (!vis) continue;
      const d = pxDist(vis.getBoundingClientRect(), x, y);
      if (!best || d < best.d) best = { d, p };
    }
    if (best) { const r = as(best.p); if (r) return r; }
    n = real.find(n => n.closest(".room-hit")); if (n) return { room: n.closest(".room-hit").dataset.room };
    return null;
  }
  // Mobile Chrome "touch adjustment" moves a tap's click onto a nearby clickable thing (e.g. a
  // building next to the ground you tapped). Use where the finger really lifted instead.
  let rawTap = null;
  svg.addEventListener("pointerup", e => { rawTap = e.pointerType === "mouse" ? null : { clientX: e.clientX, clientY: e.clientY, t: performance.now() }; });
  svg.addEventListener("click", e => {
    const ev = rawTap && performance.now() - rawTap.t < 800 && Math.hypot(rawTap.clientX - e.clientX, rawTap.clientY - e.clientY) < 40 ? rawTap : e;
    rawTap = null;
    const hit = pickTarget(ev);
    if (hit && hit.girl) { talkTo(hit.girl); return; }
    if (hit && hit.room) { tapRoom(hit.room); return; }   // never opens directly: walk + 「入る？」
    // empty ground: just walk there
    const p = svgPoint(ev); let [gx, gy] = toGrid(p.x, p.y);
    R.pendingRoom = null; R.talkTo = null; R.goal = "ground"; hideEnter();
    if (!walkable(gx, gy)) {   // off the walkable area: the bridge / island spot right next to it, else the town edge
      const n = gy > 8.5 ? nearestFree(gx, gy) : -1, nx = (n % NAV.W + 0.5) * NAV.s, ny = (Math.floor(n / NAV.W) + 0.5) * NAV.s;
      if (n >= 0 && ny > 8.45 && Math.hypot(nx - gx, ny - gy) < 1.2) { gx = nx; gy = ny; }
      else { gx = Math.min(9.85, Math.max(0.15, gx)); gy = Math.min(8.45, Math.max(0.15, gy)); }
    }
    showMark(gx, gy);
    walkTo(gx, gy);
  });
  svg.addEventListener("keydown", ev => {   // keyboard focus is deliberate: Enter on a building still opens it
    if ((ev.key === "Enter" || ev.key === " ") && ev.target.dataset && ev.target.dataset.room) { ev.preventDefault(); openRoom(ev.target.dataset.room); }
    else if ((ev.key === "Enter" || ev.key === " ") && ev.target.dataset && G[ev.target.dataset.girl]) { ev.preventDefault(); talkTo(ev.target.dataset.girl); }
  });
  addEventListener("keydown", e => {
    if (!e.key.startsWith("Arrow") || openId) return;
    e.preventDefault(); R.keys.add(e.key); R.talkTo = null; R.pendingRoom = null; R.goal = null; clearMark(); kick();
  });
  addEventListener("keyup", e => R.keys.delete(e.key));
  addEventListener("blur", () => R.keys.clear());

  // ---------- time of day (Asia/Tokyo, not the viewer's clock) ----------
  // morning 5–9, day 9–16, evening 16–19, night 19–5. Rechecked every minute.
  // ?phase=morning|day|evening|night forces one (screenshots/tests).
  // The look is pure CSS on html[data-phase]; here we only gate the girls' walks and the tram.
  const PHASES = ["morning", "day", "evening", "night"];
  const FORCED = PHASES.includes(params.get("phase")) ? params.get("phase") : null;
  const jstFmt = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tokyo", hour: "numeric", minute: "numeric", hourCycle: "h23" });
  function jstHour(d = new Date()) {
    const parts = jstFmt.formatToParts(d), get = t => +((parts.find(p => p.type === t) || {}).value || 0);
    return (get("hour") % 24) + get("minute") / 60;
  }
  const phaseAt = h => h >= 5 && h < 9 ? "morning" : h >= 9 && h < 16 ? "day" : h >= 16 && h < 19 ? "evening" : "night";
  let phase = null;
  const isNight = () => phase === "night";
  const phaseHooks = [];
  function applyPhase() {
    const p = FORCED || phaseAt(jstHour());
    if (p === phase) return;
    phase = p;
    document.documentElement.dataset.phase = p;
    phaseHooks.forEach(f => f(p));
  }

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
  function tapBubble(id) {   // tiny "TAP" hint above her for ~1.5 s (moves with her)
    if (STILL) return;
    const g = G[id], m = C.members[id], [hx, hy] = T.P(g.x0, g.y0, g.z0);
    const b = document.createElementNS("http://www.w3.org/2000/svg", "g");
    b.setAttribute("class", "tapb"); b.setAttribute("pointer-events", "none");
    b.innerHTML = `<g transform="translate(${hx.toFixed(1)},${(hy - 24).toFixed(1)})"><rect x="-9" y="-6" width="18" height="10" rx="5" fill="#fff" stroke="${m.color}" stroke-width="1.3"/>` +
      `<path d="M-2 4 L0 7 L2 4Z" fill="#fff" stroke="${m.color}" stroke-width="1"/><text x="0" y="1.4" font-size="5.6" font-weight="800" fill="${NAVY}" text-anchor="middle" letter-spacing=".3">TAP</text></g>`;
    g.el.appendChild(b);
    setTimeout(() => b.remove(), 1600);
  }
  function sizeGirlPads() {
    const U = hitUnits();
    Object.values(G).forEach(g => { if (!g.pad) return; const [hx, hy] = T.P(g.x0, g.y0, g.z0);
      g.pad.setAttribute("x", (hx - U / 2).toFixed(1)); g.pad.setAttribute("y", (hy - 7 - U / 2).toFixed(1));
      g.pad.setAttribute("width", U.toFixed(1)); g.pad.setAttribute("height", U.toFixed(1)); g.pad.setAttribute("rx", (U / 4).toFixed(1)); });
  }
  function girlWalk(id) {
    if (isNight()) return;                                     // asleep at home
    const g = G[id], route = GIRL_ROUTES[id];
    const path = route.concat(route.slice(0, -1).reverse());   // out and back
    const PAUSE_AT = route.length - 1, GS = 0.9;               // grid units / s
    let i = 0, last = 0, pauseUntil = 0;
    g.walking = true;
    tapBubble(id);
    const step = ts => {
      if (g.abort) {                                           // night fell mid-walk: back home at once
        g.abort = false; g.x = g.x0; g.y = g.y0; g.face = 1; g.home = true; placeGirl(g, 0); g.walking = false;
        g.el.querySelectorAll(".tapb").forEach(n => n.remove()); return;
      }
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
      checkTalk();
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function girlsInit() {
    sorted.filter(o => o.girl).forEach(o => {
      const el = $(`#kgObjs [data-girl="${o.girl}"]`); if (!el) return;
      const inner = el.firstElementChild;
      G[o.girl] = { el, inner, x0: o.gx, y0: o.gy, z0: o.gz, x: o.gx, y: o.gy, face: 1, home: true, walking: false };
      el.setAttribute("tabindex", "0"); el.setAttribute("role", "button");
      // invisible >= 44 px square tap pad around her (moves with her; off at night with her)
      const pad = document.createElementNS("http://www.w3.org/2000/svg", "rect");
      pad.setAttribute("class", "hitpad"); pad.setAttribute("fill", "#fff"); pad.setAttribute("fill-opacity", "0");
      el.appendChild(pad);
      G[o.girl].pad = pad;
    });
    sizeGirlPads();
    phaseHooks.push(p => { if (p === "night") Object.values(G).forEach(g => { if (g.walking) g.abort = true; }); });
    if (STILL) return;
    const next = () => setTimeout(() => {
      const free = Object.keys(G).filter(id => !G[id].walking && GIRL_ROUTES[id]);
      if (free.length && !document.hidden && !isNight()) girlWalk(free[Math.floor(Math.random() * free.length)]);
      next();
    }, 20000 + Math.random() * 20000);
    next();
  }


  // ---------- talk bubbles ----------
  // When the visitor robot comes within NEAR grid units of a girl she says ONE line:
  // her current status from status.csv (zzZ… at night). Once per approach: the robot
  // has to go further than AWAY before the same girl talks again. One bubble at a time.
  // The bubble is HTML over the map (readable font size on phones), clamped inside it.
  const TALK = { MS: 4000, NEAR: 0.9, AWAY: 1.4, armed: {}, who: null, timer: 0, raf: 0, el: null };
  const JPC = /[\u3040-\u30ff\u3400-\u9fff\uff00-\uffef]/;
  const seg = typeof Intl.Segmenter === "function" ? new Intl.Segmenter(undefined, { granularity: "grapheme" }) : null;
  const graphemes = s => seg ? [...seg.segment(s)].map(x => x.segment) : [...s];
  function shortLine(s) {
    s = String(s || "").replace(/\s+/g, " ").trim();
    const max = JPC.test(s) ? 28 : 45, g = graphemes(s);
    if (g.length <= max) return s;
    let cut = g.slice(0, max - 1).join("");
    if (!JPC.test(s)) { const sp = cut.lastIndexOf(" "); if (sp > max * 0.6) cut = cut.slice(0, sp); }
    return cut.replace(/[\s、。，,.!！?？・:：;；\-–—]+$/u, "") + "…";
  }
  const talkLine = id => isNight() ? "zzZ…" : shortLine(statusText(S.status[id])) || "…";
  const memberName = id => { const m = C.members[id]; return lang === "en" ? m.nameEn : m.name; };
  function talkSpot(id) {   // a free spot just short of her, nearest to the robot
    const g = G[id]; let best = null;
    for (const r of [0.55, 0.65, 0.8]) for (let a = 0; a < 16; a++) {
      const x = g.x + Math.cos(a * Math.PI / 8) * r, y = g.y + Math.sin(a * Math.PI / 8) * r;
      if (!walkable(x, y) || hitBuilding(x, y)) continue;
      const d = Math.hypot(x - R.x, y - R.y); if (!best || d < best[2]) best = [x, y, d];
    }
    return best || [g.x, g.y];
  }
  function talkTo(id) {     // tap / Enter on a girl: walk up to her, she talks on arrival
    R.pendingRoom = null; R.keys.clear(); R.goal = "talk"; hideEnter(); clearMark();
    const [x, y] = talkSpot(id);
    R.talkTo = id;
    if (Math.hypot(x - R.x, y - R.y) < 0.05) { arriveTalk(); return; }
    walkTo(x, y);
  }
  function arriveTalk() {
    const id = R.talkTo; R.talkTo = null;
    if (!id || !G[id]) return;
    TALK.armed[id] = false;
    if (TALK.who !== id) say(id);
  }
  function checkTalk() {
    let best = null;
    for (const id of Object.keys(G)) {
      const g = G[id], d = Math.hypot(g.x - R.x, g.y - R.y);
      if (d > TALK.AWAY) TALK.armed[id] = true;
      else if (d < TALK.NEAR && TALK.armed[id] !== false && (!best || d < best.d)) best = { id, d };
    }
    if (best) { TALK.armed[best.id] = false; if (R.talkTo === best.id) R.talkTo = null; say(best.id); }
  }
  function talkAnchor(id) {  // map (SVG) point the tail touches: above her head, or her Zzz at night
    if (isNight()) {
      const z = svg.querySelector(`[data-zzz="${id}"]`), m = z && /translate\(([-\d.]+)[ ,]+([-\d.]+)\)/.exec(z.getAttribute("transform") || "");
      if (m) return { x: +m[1] + 8, y: +m[2] - 23, foot: +m[2] + 4 };
    }
    const g = G[id], [sx, sy] = T.P(g.x, g.y, g.home ? g.z0 : zAt(g.x, g.y));
    return { x: sx, y: sy - 18, foot: sy + 3 };
  }
  function placeTalk() {
    const el = TALK.el; if (!TALK.who || !el || el.hidden) return;
    const wrap = el.parentNode.getBoundingClientRect(), r = svg.getBoundingClientRect(), k = r.width / T.VB.w;
    const a = talkAnchor(TALK.who), px = r.left - wrap.left + a.x * k;
    const w = el.offsetWidth, h = el.offsetHeight, pad = 6, gap = 9;
    const left = Math.min(Math.max(px - w / 2, pad), Math.max(pad, wrap.width - w - pad));
    let top = r.top - wrap.top + a.y * k - h - gap, below = false;
    if (top < pad) { top = r.top - wrap.top + a.foot * k + gap; below = true; }   // no room above: hang it below her
    top = Math.min(top, wrap.height - h - pad);
    el.style.left = left.toFixed(1) + "px"; el.style.top = top.toFixed(1) + "px";
    el.style.setProperty("--tx", Math.min(Math.max(px - left, 14), w - 14).toFixed(1) + "px");
    el.classList.toggle("below", below);
  }
  function followTalk() {
    cancelAnimationFrame(TALK.raf);
    const f = () => { if (!TALK.who) return; placeTalk(); TALK.raf = requestAnimationFrame(f); };
    TALK.raf = requestAnimationFrame(f);
  }
  function say(id) {
    if (!G[id] || !TALK.el) return;
    clearTimeout(TALK.timer);
    const el = TALK.el;
    el.style.setProperty("--c", C.members[id].color);
    el.innerHTML = `<span class="sr">${esc(memberName(id))}: </span>${esc(talkLine(id))}<i aria-hidden="true"></i>`;
    el.classList.remove("show"); el.hidden = false; void el.offsetWidth; el.classList.add("show");
    TALK.who = id; placeTalk(); followTalk();
    TALK.timer = setTimeout(hideTalk, TALK.MS);
    markHeard(id);
  }
  function hideTalk() { clearTimeout(TALK.timer); cancelAnimationFrame(TALK.raf); TALK.who = null; if (TALK.el) { TALK.el.hidden = true; TALK.el.classList.remove("show"); } }

  // ---------- daily reward (all three heard on the same Japan date) ----------
  // Progress lives only in this browser's localStorage: key kg_heard_YYYY-MM-DD (JST) = "rin,mio".
  // The photo comes from rewards.csv (assets/rewards/); same pick for everyone that day.
  const TALKERS = ["rin", "mio", "rina"];
  const jstDayFmt = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit" });
  function jstDate(d = new Date()) { const p = jstDayFmt.formatToParts(d), v = ty => (p.find(x => x.type === ty) || {}).value; return `${v("year")}-${v("month")}-${v("day")}`; }
  const heardKey = () => "kg_heard_" + jstDate();
  function heardToday() { try { return (localStorage.getItem(heardKey()) || "").split(",").filter(x => TALKERS.includes(x)); } catch (e) { return []; } }
  function markHeard(id) {
    if (!TALKERS.includes(id)) return;
    const h = heardToday();
    if (!h.includes(id)) {
      h.push(id);
      try {
        for (let i = localStorage.length - 1; i >= 0; i--) { const k = localStorage.key(i); if (k && k.startsWith("kg_heard_") && k !== heardKey()) localStorage.removeItem(k); }
        localStorage.setItem(heardKey(), h.join(","));
      } catch (e) { /* storage off: progress just isn't kept */ }
      if (TALKERS.every(x => h.includes(x))) setTimeout(openReward, STILL ? 500 : 1500);
    }
    drawProgress();
  }
  function drawProgress() {
    const el = $("#talkDots"); if (!el) return;
    const h = heardToday(), done = TALKERS.every(x => h.includes(x));
    const label = `${t("heard")} ${h.length}/3` + (done ? ` · ${t("rewardTitle")}` : ` · ${t("rewardHint")}`);
    el.innerHTML = TALKERS.map(id => `<i class="${h.includes(id) ? "on" : ""}" style="--c:${C.members[id].color}"></i>`).join("") + `<span aria-hidden="true">📸</span>`;
    el.classList.toggle("done", done); el.title = label; el.setAttribute("aria-label", label);
    el.disabled = !done;
  }
  function openReward() {
    const el = $("#reward"); if (!el) return;
    const list = S.rewards || [];
    const day = Math.floor(Date.parse(jstDate() + "T00:00:00Z") / 864e5);
    const it = list.length ? list[((day % list.length) + list.length) % list.length] : null;
    const m = it && C.members[it.who];
    const cap = it ? (lang === "en" ? it.en || it.ja : it.ja || it.en) : "";
    el.style.setProperty("--c", m ? m.color : "#bfa6dd");
    el.innerHTML = `<div class="rhead"><b id="rewardTitle">${esc(t("rewardTitle"))}</b><button class="rclose" aria-label="${esc(t("close"))}">×</button></div>` +
      (it ? `<img src="assets/rewards/${encodeURIComponent(it.file)}" alt="${esc(cap || t("rewardTitle"))}">${cap ? `<p>${esc(cap)}</p>` : ""}` : `<p class="empty">${esc(t("rewardEmpty"))}</p>`);
    const img = el.querySelector("img");
    if (img) img.onerror = () => { img.remove(); const p = el.querySelector("p"); if (p) p.remove(); el.insertAdjacentHTML("beforeend", `<p class="empty">${esc(t("rewardEmpty"))}</p>`); };
    el.querySelector(".rclose").onclick = closeReward;
    el.hidden = false; el.classList.toggle("still", STILL);
    el.querySelector(".rclose").focus({ preventScroll: true });
  }
  function closeReward() { const el = $("#reward"); if (el && !el.hidden) { el.hidden = true; const d = $("#talkDots"); if (d && !d.disabled) d.focus({ preventScroll: true }); } }
  function talkInit() {
    const wrap = $(".mapwrap"); if (!wrap) return;
    TALK.el = document.createElement("div");
    TALK.el.className = "talk" + (STILL ? " still" : ""); TALK.el.hidden = true;
    TALK.el.setAttribute("role", "status"); TALK.el.setAttribute("aria-live", "polite");
    const dots = document.createElement("button");
    dots.id = "talkDots"; dots.className = "talkdots"; dots.type = "button"; dots.onclick = openReward;
    const card = document.createElement("div");
    card.id = "reward"; card.className = "reward"; card.hidden = true;
    card.setAttribute("role", "dialog"); card.setAttribute("aria-labelledby", "rewardTitle");
    wrap.append(TALK.el, dots, card);
    addEventListener("keydown", e => { if (e.key === "Escape") closeReward(); });
    addEventListener("resize", placeTalk);
    phaseHooks.push(() => { if (TALK.who) say(TALK.who); });   // dusk/dawn mid-bubble: refresh the line
    drawProgress();
  }

  // ---------- tram ----------
  function tramLoop() {
    const el = $("#kgTram"); if (!el) return;
    const place = u => el.setAttribute("transform", `translate(${(u * T.iso.hw).toFixed(1)},${(u * T.iso.hh).toFixed(1)})`);
    // out of the tunnel -> slow into the terminal -> dwell -> back into the tunnel
    // Night: it finishes its run, then rests at the end station (B) until morning.
    const A = -2.0, B = 7.3, RUN = 9, DWELL = 4, HIDE = 3;
    if (STILL) { const still = () => place(isNight() ? B : 6.3); still(); phaseHooks.push(still); return; }
    const cycle = HIDE + RUN + DWELL + RUN, DWELL_AT = HIDE + RUN, DEPART_AT = HIDE + RUN + DWELL;
    const ease = k => k < 0.5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    const at = s => s < HIDE ? A : (s -= HIDE) < RUN ? A + (B - A) * ease(s / RUN) : (s -= RUN) < DWELL ? B : B - (B - A) * ease((s - DWELL) / RUN);
    let t0 = null, resting = isNight();
    if (resting) place(B);
    const f = ts => {
      if (t0 == null) t0 = ts;
      if (resting && !isNight()) { resting = false; t0 = ts - (DEPART_AT - 1.5) * 1000; }   // morning: leave after 1.5 s
      if (!resting && !document.hidden) {
        const s = ((ts - t0) / 1000) % cycle;
        if (isNight() && s >= DWELL_AT && s < DEPART_AT) { resting = true; place(B); }
        else place(at(s));
      }
      requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  }

  // ---------- data refresh ----------
  async function refresh() {
    const [st, rm, mt, tr, rw] = await Promise.allSettled([D.loadStatus(), D.loadRooms(), D.loadMeetings(), D.loadTrends(), D.loadRewards()]);
    if (st.status === "fulfilled") S.status = st.value; else console.warn(st.reason);
    if (rm.status === "fulfilled") S.rooms = rm.value; else console.warn(rm.reason);
    if (mt.status === "fulfilled") S.meetings = mt.value; else console.warn(mt.reason);
    if (tr.status === "fulfilled") S.trends = tr.value; else console.warn(tr.reason);
    if (rw.status === "fulfilled") S.rewards = rw.value; else console.warn(rw.reason);
    S.loadedAt = new Date();
    paintText();
    if (openId && openId !== "meeting") openRoom(openId);
  }
  function paintText() {
    document.documentElement.lang = lang;
    document.querySelectorAll("[data-i18n]").forEach(el => { const v = t(el.dataset.i18n); if (typeof v === "string") el.textContent = v; });
    $("#hint").innerHTML = `<span>${esc(t("hint"))}</span><br><span>${esc(t("hint2"))}</span>`;
    $("#langBtn").textContent = lang === "ja" ? "EN" : "日本語";
    const intro = S.rooms.intro || {};
    $("#townIntro").textContent = (lang === "en" ? intro.en : intro.ja) || "";
    if (S.loadedAt) $("#lastLoad").textContent = `${t("loaded")} ${new Intl.DateTimeFormat("ja-JP", { timeZone: "Asia/Tokyo", hour: "2-digit", minute: "2-digit" }).format(S.loadedAt)} JST`;
    const yt = $("#visitor text"); if (yt) yt.textContent = t("you");
    drawSigns(); drawCards(); drawLinks(); drawCounter(); drawProgress(); paintEnter();
    Object.keys(G).forEach(id => G[id].el.setAttribute("aria-label", t("talkTo")(memberName(id))));
  }
  $("#langBtn").onclick = () => { lang = lang === "ja" ? "en" : "ja"; localStorage.setItem("kg_lang", lang); paintText(); if (openId) openRoom(openId); if (!$("#reward").hidden) openReward(); };

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
  applyPhase();
  tramLoop();
  girlsInit();
  talkInit();
  enterInit();
  { let rt = 0; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(() => { drawSigns(); sizeGirlPads(); }, 150); }); }   // hit pads follow the map scale
  setInterval(applyPhase, 60 * 1000);
  refresh();
  initCounter();
  setInterval(refresh, (C.data.refreshSeconds || 60) * 1000);
  document.addEventListener("visibilitychange", () => { if (!document.hidden) { applyPhase(); refresh(); } });
  if (params.get("open")) setTimeout(() => openRoom(params.get("open")), 400);
  window.KG_APP = { openRoom, walkTo, R, G, girlWalk, GIRL_ROUTES, walkable, hitBuilding, phaseAt, jstHour, get phase() { return phase; },
    talkTo, say, checkTalk, talkSpot, shortLine, heardToday, openReward, closeReward, jstDate, TALK,
    tapRoom, askEnter, hideEnter, nearRoom, roomDist, CONF, get openId() { return openId; } };
})();
