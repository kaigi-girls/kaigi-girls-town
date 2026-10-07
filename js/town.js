/* KAIGI GIRLS TOWN — isometric seaside town (Shonan/Kamakura-ish, fictional) */
(function () {
  const { makeIso, robotSVG, NAVY } = window.KG_ISO;
  const VB = { w: 400, h: 392 };
  const iso = makeIso({ cx: 186, oy: 108, hw: 20.5, hh: 10.25 });
  const { P, pts, poly, tile, box, onL, onR, gable, cyl, blob, tree, pine, bush, tram, girl } = iso;
  const HILL = 16, SEA = -6;
  const PATH = "#f3e3c6";

  // ---------- elevation (for the walking robot) ----------
  const elev = gy => gy < 2.2 ? HILL : gy < 3.2 ? HILL * (3.2 - gy) : 0;

  // ---------- ground ----------
  function ground() {
    let s = "";
    s += `<defs>
      <linearGradient id="kgSky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#eef8ff"/><stop offset=".42" stop-color="#d4eefc"/>
        <stop offset=".62" stop-color="#a9dcf5"/><stop offset="1" stop-color="#8fd0f1"/></linearGradient>
    </defs>`;
    s += `<rect x="0" y="0" width="${VB.w}" height="${VB.h}" fill="url(#kgSky)"/>`;
    // distant hills (Kamakura-ish green hills behind the town)
    s += `<path d="M0 118 C 40 70, 90 66, 130 92 C 160 58, 230 50, 270 84 C 300 66, 360 70, 400 100 L400 200 L0 200Z" fill="#cfe9d6" opacity=".9"/>`;
    s += `<path d="M0 140 C 50 104, 110 108, 150 126 C 200 96, 270 98, 320 122 C 350 110, 380 112, 400 124 L400 220 L0 220Z" fill="#bfe2c7"/>`;
    // waves (animated via CSS)
    s += `<g class="waves" fill="none" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".75">`;
    [[30, 262], [205, 330], [300, 312], [355, 285], [150, 372], [260, 360], [345, 352], [24, 340], [120, 350], [380, 330], [60, 300]].forEach(([x, y], i) =>
      s += `<path class="w${i % 3}" d="M${x} ${y} q4 -3 8 0 q4 3 8 0"/>`);
    s += `</g>`;
    // land sides (diorama)
    s += poly([P(10, 0, -10), P(10, 8.6, -10), P(10, 8.6, 0), P(10, 3.2, 0), P(10, 2.2, HILL), P(10, 0, HILL)], "#e2c99a", "none");
    s += poly([P(10, 0, HILL), P(10, 2.2, HILL), P(10, 3.2, 0), P(10, 8.6, 0), P(10, 8.6, -2.5), P(10, 3.2, -2.5), P(10, 2.2, HILL - 2.5), P(10, 0, HILL - 2.5)], "#b5dca0", "none");
    s += poly([P(0, 8.6, -10), P(10, 8.6, -10), P(10, 8.6, 0), P(0, 8.6, 0)], "#efd59d", "none");
    // foam along the beach
    s += `<polyline points="${pts([P(0, 8.6, -9), P(10, 8.6, -9)])}" stroke="#fff" stroke-width="2.4" stroke-linecap="round" opacity=".8"/>`;
    // tops
    s += tile(0, 0, 10, 2.2, HILL, "#cfeabf");
    s += poly([P(0, 2.2, HILL), P(10, 2.2, HILL), P(10, 3.2, 0), P(0, 3.2, 0)], "#bde2a9", "none");
    s += tile(0, 3.2, 10, 1.8, 0, "#e3f1d6");
    s += tile(0, 5.0, 10, 1.0, 0, "#dfe0ea");                      // street
    s += tile(0, 5.0, 10, 0.08, 0, "#f7f7fb"); s += tile(0, 5.92, 10, 0.08, 0, "#f7f7fb");
    // tram rails
    [5.3, 5.7].forEach(y => s += `<polyline points="${pts([P(0, y), P(10, y)])}" stroke="#a7aabd" stroke-width="1.1"/>`);
    s += tile(0, 6.0, 10, 1.4, 0, "#e7f3dc");                      // promenade
    s += tile(0, 6.0, 10, 0.32, 0, "#f3ece1");
    s += tile(0, 7.4, 10, 1.2, 0, "#f9e8bd");                      // beach
    s += tile(0, 8.25, 10, 0.35, 0, "#f3dca6");
    // slope road (to the hilltop cafe) + paths
    s += poly([P(1.55, 2.2, HILL), P(2.45, 2.2, HILL), P(2.45, 3.2, 0), P(1.55, 3.2, 0)], PATH, "none");
    for (let i = 1; i < 6; i++) { const y = 2.2 + i / 6; s += `<polyline points="${pts([P(1.6, y, elev(y)), P(2.4, y, elev(y))])}" stroke="#e2cfac" stroke-width=".8"/>`; }
    s += tile(1.55, 3.2, 0.9, 1.8, 0, PATH);
    s += tile(1.55, 1.9, 6.6, 0.3, HILL, PATH);
    // narrow alley to the old-house studio (stepping stones)
    s += tile(4.5, 4.15, 0.55, 0.85, 0, "#d9cfbd");
    [4.3, 4.55, 4.8].forEach(y => s += tile(4.62, y, 0.3, 0.14, 0, "#f6efe2"));
    s += tile(7.75, 4.8, 0.7, 0.2, 0, PATH);
    // zebra crossing at the foot of the slope
    for (let i = 0; i < 4; i++) s += tile(1.62 + i * 0.22, 5.08, 0.12, 0.84, 0, "#ffffff");
    // tunnel portal where the tram line comes out of the hill
    s += box({ x: -0.05, y: 4.85, w: 0.4, d: 1.3, z: 0, h: 24, left: "#b9c7a4", right: "#cfd7c0", top: "#a9d494" });
    s += onR(0.35, 4.95, 6.05, 0, 21, "#bfc6b6");
    { const a = P(0.35, 5.12, 0), b = P(0.35, 5.88, 0), c = P(0.35, 5.5, 18), ctl = P(0.35, 5.5, 24);
      s += `<path d="M${a[0]} ${a[1]} L${a[0]} ${a[1] - 11} Q${ctl[0]} ${ctl[1] - 6} ${b[0]} ${b[1] - 11} L${b[0]} ${b[1]} Z" fill="#33405e"/>`; }
    // little terminal station + buffer stop before the sea
    s += box({ x: 7.9, y: 6.0, w: 1.75, d: 0.32, z: 0, h: 2.2, left: "#e9dfcf", right: "#d9ccb6", top: "#f6efe2" });
    for (const x of [8.05, 9.5]) { const q = P(x, 6.2, 2.2); s += `<line x1="${q[0]}" y1="${q[1]}" x2="${q[0]}" y2="${q[1] - 12}" stroke="#8a90a8" stroke-width="1"/>`; }
    s += box({ x: 7.95, y: 6.02, w: 1.65, d: 0.3, z: 14, h: 1.2, left: "#5cb58e", right: "#3f9572", top: "#7cc9a6" });
    s += box({ x: 9.68, y: 5.22, w: 0.1, d: 0.56, z: 0, h: 4, left: "#ef6f6f", right: "#d65a5a", top: "#f4a0a0" });
    return s;
  }

  // ---------- objects (sortable) ----------
  const objects = [];   // {id, x, y, w, d, svg, room?}
  const add = (o) => objects.push(o);
  const W1 = "#fffaf2", W2 = "#f1e6d6";

  function build() {
    // hill trees + hydrangeas
    add({ x: 0.3, y: 0.3, w: .2, d: .2, svg: tree(0.4, 0.4, HILL, 1.1) });
    add({ x: 3.6, y: 0.4, w: .2, d: .2, svg: pine(3.7, 0.5, HILL, 1) });
    add({ x: 4.6, y: 0.9, w: .2, d: .2, svg: tree(4.7, 1.0, HILL, 1.2, "#9ad48f") });
    add({ x: 5.6, y: 0.3, w: .2, d: .2, svg: tree(5.7, 0.4, HILL, 0.9) });
    add({ x: 9.3, y: 0.3, w: .2, d: .2, svg: pine(9.4, 0.4, HILL, 1.1) });
    add({ x: 9.4, y: 1.4, w: .2, d: .2, svg: tree(9.5, 1.5, HILL, 0.8, "#9ad48f") });
    [[3.3, "#b9a6e6"], [3.9, "#9cc6f0"], [4.6, "#c9a6e0"], [5.4, "#9cc6f0"], [6.1, "#b9a6e6"], [0.8, "#9cc6f0"]].forEach(([x, c]) =>
      add({ x, y: 2.25, w: .1, d: .1, svg: bush(x, 2.35, elev(2.35), c, 1) }));

    // meeting room: 2F of the hilltop cafe
    let s = "";
    const cf = { x: 0.95, y: 0.35, w: 2.2, d: 1.4, z: HILL };
    s += box({ ...cf, h: 13, left: W1, right: W2, top: null });
    s += onL(cf.y + cf.d, 1.25, 1.75, HILL + 1, HILL + 9, "#bfe0f6"); s += onL(cf.y + cf.d, 2.35, 2.75, HILL, HILL + 9, "#c7a77f");
    // tricolor awning
    const aw = [["#fbabb6", 1.05, 1.75], ["#bfa6dd", 1.75, 2.45], ["#e7b66a", 2.45, 3.15]];
    aw.forEach(([c, a, b]) => s += poly([P(a, cf.y + cf.d, HILL + 13), P(b, cf.y + cf.d, HILL + 13), P(b, cf.y + cf.d + 0.35, HILL + 9.5), P(a, cf.y + cf.d + 0.35, HILL + 9.5)], c, "none"));
    s += box({ ...cf, z: HILL + 13, h: 12, left: "#ffffff", right: "#eef3fa", top: null });
    for (let i = 0; i < 3; i++) s += onL(cf.y + cf.d, 1.1 + i * 0.68, 1.62 + i * 0.68, HILL + 16, HILL + 23, "#a9d6f5");
    s += onR(cf.x + cf.w, 0.55, 1.55, HILL + 16, HILL + 23, "#93c6ec");
    s += gable({ ...cf, z: HILL + 25, h: 8, roof: "#7d93c2", back: "#6d82b0", wall: "#eef3fa", ridge: "#5d6f99" });
    add({ id: "meeting", room: "meeting", ...cf, svg: s, top: HILL + 33 });
    add({ x: 0.45, y: 1.75, w: .2, d: .2, svg: tree(0.55, 1.85, HILL, 0.8, "#9ad48f") });

    // president's office (robot light blue), window facing the sea & island
    s = "";
    const pr = { x: 6.7, y: 0.45, w: 1.9, d: 1.3, z: HILL };
    s += box({ ...pr, h: 20, left: "#d9eefc", right: "#bcdcf3", top: "#a8d1f2" });
    s += onL(pr.y + pr.d, 6.9, 7.85, HILL + 6, HILL + 17, "#ffffff"); s += onL(pr.y + pr.d, 6.97, 7.78, HILL + 7, HILL + 16, "#7fc0ef");
    s += onL(pr.y + pr.d, 8.05, 8.45, HILL, HILL + 11, NAVY, "none", 'opacity=".85"');
    s += onR(pr.x + pr.w, 0.7, 1.5, HILL + 8, HILL + 16, "#7fc0ef");
    // roof rim + antenna like the logo robot
    s += tile(pr.x, pr.y, pr.w, 0.08, HILL + 20, "#8cbfe8"); 
    { const a = P(7.65, 1.1, HILL + 20), b = P(7.65, 1.1, HILL + 30); s += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="${NAVY}" stroke-width="1.4"/><circle cx="${b[0]}" cy="${b[1]}" r="2.6" fill="${NAVY}"/>`; }
    add({ id: "president", room: "president", ...pr, svg: s, top: HILL + 30 });
    { const p = P(7.45, 1.95, HILL); add({ x: 7.35, y: 1.85, w: .2, d: .2, svg: `<g transform="translate(${p[0]},${p[1]})">${robotSVG({ scale: 0.62, headset: true, pen: true })}</g>` }); }

    // block trees
    add({ x: 0.4, y: 3.5, w: .2, d: .2, svg: tree(0.5, 3.6, 0, 1.1) });
    add({ x: 0.9, y: 4.4, w: .2, d: .2, svg: tree(1.0, 4.5, 0, 0.85, "#9ad48f") });
    add({ x: 2.8, y: 3.4, w: .2, d: .2, svg: pine(2.9, 3.5, 0, 0.95) });
    add({ x: 6.5, y: 3.4, w: .2, d: .2, svg: bush(6.6, 3.5, 0, "#b9a6e6", 1.1) });
    add({ x: 9.5, y: 3.4, w: .2, d: .2, svg: tree(9.6, 3.5, 0, 0.8) });

    // studio: old Japanese house at the back of the alley
    s = "";
    const st = { x: 4.05, y: 3.3, w: 1.5, d: 0.85, z: 0 };
    s += box({ ...st, h: 15, left: "#f4e6cc", right: "#e5d0aa", top: null });
    for (let i = 0; i <= 6; i++) { const x = st.x + 0.08 + i * 0.22; s += onL(st.y + st.d, x, x + 0.03, 1, 14, "#b98a5a"); }
    s += onL(st.y + st.d, 4.6, 5.0, 6, 14.5, "#bfa6dd");                       // purple noren
    s += onL(st.y + st.d, 4.6, 5.0, 6, 7, "#8a63c4");
    s += onR(st.x + st.w, 3.45, 4.0, 4, 11, "#c99b6a");
    s += gable({ ...st, z: 15, h: 11, e: 0.18, roof: "#55627f", back: "#47536e", wall: "#e5d0aa", ridge: "#3a4560" });
    add({ id: "studio", room: "studio", ...st, svg: s, top: 26 });
    // alley houses
    s = box({ x: 3.15, y: 4.15, w: 1.3, d: 0.8, h: 8, left: "#fff4ee", right: "#f1e0d6", top: null });
    s += onL(4.95, 3.4, 3.75, 2.5, 6, "#bfe0f6"); s += onL(4.95, 3.95, 4.25, 0, 6, "#d8b58e");
    s += gable({ x: 3.15, y: 4.15, w: 1.3, d: 0.8, z: 8, h: 6, roof: "#eaa298", back: "#d98e84", wall: "#f1e0d6" });
    add({ x: 3.15, y: 4.15, w: 1.3, d: 0.8, svg: s });
    s = box({ x: 5.1, y: 4.15, w: 1.15, d: 0.8, h: 8, left: "#f3f8ff", right: "#dfe9f6", top: null });
    s += onL(4.95, 5.3, 5.65, 2.5, 6, "#bfe0f6"); s += onR(6.25, 4.35, 4.75, 2.5, 6, "#a9cfee");
    s += gable({ x: 5.1, y: 4.15, w: 1.15, d: 0.8, z: 8, h: 5, roof: "#8fb3d9", back: "#7ea2c9", wall: "#dfe9f6" });
    add({ x: 5.1, y: 4.15, w: 1.15, d: 0.8, svg: s });

    // editorial office by the tram line (honey)
    s = "";
    const ed = { x: 7.0, y: 3.5, w: 2.3, d: 1.2, z: 0 };
    s += box({ ...ed, h: 17, left: "#fffaf0", right: "#f4dde1", top: "#fdd0d7" });
    s += onL(ed.y + ed.d, 7.2, 8.4, 2, 10, "#bfe0f6"); s += onL(ed.y + ed.d, 7.25, 7.7, 7.5, 9.5, "#fff", "none", 'opacity=".6"');
    s += onL(ed.y + ed.d, 8.65, 9.05, 0, 9, "#e0607a");
    s += poly([P(7.1, 4.7, 12.5), P(9.2, 4.7, 12.5), P(9.2, 5.0, 10), P(7.1, 5.0, 10)], "#fbabb6", "none");
    for (let i = 0; i < 4; i++) s += onL(ed.y + ed.d, 7.2 + i * 0.52, 7.55 + i * 0.52, 13.5, 16, "#bfe0f6");
    s += onR(ed.x + ed.w, 3.7, 4.5, 4, 14, "#a9cfee");
    s += tile(ed.x, ed.y, ed.w, ed.d, 17, "#fbabb6", "none", 'opacity=".55"');
    add({ id: "editorial", room: "editorial", ...ed, svg: s, top: 17 });
    // trend board (掲示板)
    s = "";
    { const a = P(6.52, 4.86, 0), b = P(6.88, 4.86, 0); s += `<line x1="${a[0]}" y1="${a[1]}" x2="${a[0]}" y2="${a[1] - 9}" stroke="#b07f55" stroke-width="1.4"/><line x1="${b[0]}" y1="${b[1]}" x2="${b[0]}" y2="${b[1] - 9}" stroke="#b07f55" stroke-width="1.4"/>`; }
    s += onL(4.86, 6.45, 6.95, 6, 12, "#e8c48f", NAVY); s += onL(4.86, 6.52, 6.66, 7.2, 10.8, "#ffffff"); s += onL(4.86, 6.72, 6.88, 7.6, 11, "#fbabb6");
    add({ id: "board", room: "board", x: 6.45, y: 4.8, w: 0.5, d: 0.1, svg: s, top: 12 });
    // railway crossing signal
    { const a = P(2.65, 4.92, 0); s = `<line x1="${a[0]}" y1="${a[1]}" x2="${a[0]}" y2="${a[1] - 16}" stroke="#555e78" stroke-width="1.2"/>` +
      `<path d="M${a[0] - 4} ${a[1] - 17} l8 -4 M${a[0] - 4} ${a[1] - 21} l8 4" stroke="#f2c94c" stroke-width="1.8" stroke-linecap="round"/>` +
      `<circle cx="${a[0] - 2.4}" cy="${a[1] - 11}" r="1.6" fill="#ef6f6f"/><circle cx="${a[0] + 2.4}" cy="${a[1] - 11}" r="1.6" fill="#ef6f6f"/>`;
      add({ x: 2.6, y: 4.87, w: .1, d: .1, svg: s }); }

    // tram (animated) — footprint spans the whole street
    add({ id: "tram", x: 0, y: 5.2, w: 10, d: 0.62, svg: `<g clip-path="url(#kgTramClip)"><g id="kgTram">${tram(0, 5.2, 0.6, 2.2, 0.6, 15)}</g></g>` });

    // gym: glass-walled, sea view
    s = "";
    const gy = { x: 0.7, y: 6.15, w: 2.6, d: 1.05, z: 0 };
    s += tile(gy.x, gy.y, gy.w, gy.d, 0.2, "#f7f2ee");
    // equipment inside (pink)
    s += box({ x: 1.0, y: 6.45, w: 0.55, d: 0.3, z: 0, h: 4, left: "#e7b66a", right: "#c9974a", top: "#f6d79f", stroke: "none" });
    s += box({ x: 1.95, y: 6.5, w: 0.5, d: 0.28, z: 0, h: 5, left: "#e7b66a", right: "#c9974a", top: "#f6d79f", stroke: "none" });
    s += box({ x: 2.7, y: 6.4, w: 0.18, d: 0.5, z: 0, h: 8, left: "#9fb0cc", right: "#8396b8", top: "#c5d0e2", stroke: "none" });
    s += box({ ...gy, h: 15, left: "rgba(178,226,250,.55)", right: "rgba(150,206,240,.6)", top: null });
    for (let i = 1; i < 6; i++) s += onL(gy.y + gy.d, gy.x + i * gy.w / 6 - 0.015, gy.x + i * gy.w / 6 + 0.015, 0, 15, "#ffffff", "none", 'opacity=".9"');
    for (let i = 1; i < 3; i++) s += onR(gy.x + gy.w, gy.y + i * gy.d / 3 - 0.015, gy.y + i * gy.d / 3 + 0.015, 0, 15, "#ffffff", "none", 'opacity=".9"');
    s += onL(gy.y + gy.d, 1.5, 1.95, 0, 9, "rgba(255,255,255,.55)", NAVY);
    s += box({ ...gy, x: gy.x - 0.06, y: gy.y - 0.06, w: gy.w + 0.12, d: gy.d + 0.12, z: 15, h: 2.4, left: "#e7b66a", right: "#d6a259", top: "#ffffff" });
    s += tile(gy.x + 0.25, gy.y + 0.2, gy.w - 0.5, gy.d - 0.4, 17.4, "#fbeccd");
    add({ id: "gym", room: "gym", ...gy, svg: s, top: 17.4 });

    // the three girls (tiny chibi markers in their colors)
    add({ girl: "rin", gx: 2.4, gy: 6.6, gz: 0.2, x: 2.35, y: 6.55, w: .1, d: .1, svg: girl(2.4, 6.6, 0.2, "#e7b66a", "#4a3a3a", 0.85, true) });      // 凛 inside the glass gym
    add({ girl: "mio", gx: 4.77, gy: 4.6, gz: 0, x: 4.72, y: 4.55, w: .1, d: .1, svg: girl(4.77, 4.6, 0, "#bfa6dd", "#22243a", 0.8) });              // 澪 in the alley
    add({ girl: "rina", gx: 8.8, gy: 4.87, gz: 0, x: 8.75, y: 4.82, w: .1, d: .1, svg: girl(8.8, 4.87, 0, "#fbabb6", "#9a6a3a", 0.85) });            // リナ by the tracks

    // promenade pines, bench
    add({ x: 3.9, y: 6.6, w: .2, d: .2, svg: pine(4.0, 6.7, 0, 1.05) });
    add({ x: 6.7, y: 6.5, w: .2, d: .2, svg: pine(6.8, 6.6, 0, 0.95) });
    add({ x: 9.1, y: 6.6, w: .2, d: .2, svg: pine(9.2, 6.7, 0, 1.1) });
    add({ x: 5.0, y: 6.9, w: 0.7, d: 0.2, svg: box({ x: 5.0, y: 6.95, w: 0.7, d: 0.16, z: 2, h: 1.2, left: "#d7a777", right: "#c08d5e", top: "#e9bd8e" }) });

    // beach: umbrellas in the three colors + shop hut (coming soon)
    [["#fbabb6", 2.6, 7.95], ["#bfa6dd", 3.6, 8.1], ["#e7b66a", 4.6, 7.9]].forEach(([c, x, y]) => {
      const b = P(x, y, 0), t = P(x, y, 13);
      add({ x: x - .1, y: y - .1, w: .2, d: .2, svg: `<g><ellipse cx="${b[0] + 3}" cy="${b[1]}" rx="9" ry="3" fill="${NAVY}" opacity=".09"/><line x1="${b[0]}" y1="${b[1]}" x2="${t[0]}" y2="${t[1]}" stroke="#8a7a6a" stroke-width="1"/>` +
        `<path d="M${t[0] - 11} ${t[1] + 3} Q${t[0]} ${t[1] - 9} ${t[0] + 11} ${t[1] + 3} Q${t[0]} ${t[1]} ${t[0] - 11} ${t[1] + 3}Z" fill="${c}"/>` +
        `<path d="M${t[0] - 3.5} ${t[1] + 1.2} Q${t[0]} ${t[1] - 7} ${t[0] + 3.5} ${t[1] + 1.2}" fill="#fff" opacity=".55"/></g>` });
    });
    s = box({ x: 6.1, y: 7.55, w: 1.15, d: 0.7, h: 9, left: "#ffffff", right: "#eef0f4", top: null });
    s += onL(8.25, 6.3, 7.05, 2.5, 7, "#fde4e8"); s += onL(8.25, 6.3, 7.05, 6.2, 7, "#fbabb6");
    s += gable({ x: 6.1, y: 7.55, w: 1.15, d: 0.7, z: 9, h: 6, roof: "#fbabb6", back: "#e994a3", wall: "#eef0f4" });
    add({ id: "shop", room: "shop", x: 6.1, y: 7.55, w: 1.15, d: 0.7, svg: s, top: 15 });

    // bridge + little island with a lighthouse (fictional, "feels like" the coast)
    s = "";
    for (let y = 8.9; y < 11.4; y += 0.55) { const a = P(7.45, y, -2), b = P(7.45, y, SEA), c = P(7.85, y, -2), d = P(7.85, y, SEA);
      s += `<line x1="${a[0]}" y1="${a[1]}" x2="${b[0]}" y2="${b[1]}" stroke="#c9d3e3" stroke-width="1.2"/><line x1="${c[0]}" y1="${c[1]}" x2="${d[0]}" y2="${d[1]}" stroke="#c9d3e3" stroke-width="1.2"/>`; }
    s += box({ x: 7.45, y: 8.6, w: 0.4, d: 2.9, z: -2.2, h: 1.6, left: "#ffffff", right: "#e3e9f2", top: "#f7f9fc" });
    s += blob(7.6, 12.55, 1.55, 1.3, 4, "#bfe2a9", "#e2c99a", 10, 0.18);
    s += blob(7.7, 12.4, 0.95, 0.8, 12, "#a9d895", "#d9bf8f", 8, 0.12);
    s += tree(7.2, 12.2, 12, 0.75, "#8fcf8a") + tree(8.2, 13.1, 4, 0.7, "#9ad48f") + tree(6.9, 13.2, 4, 0.6);
    s += cyl(7.85, 12.25, 0.2, 12, 16, "#ffffff", "#eef2f8") + cyl(7.85, 12.25, 0.28, 28, 2, "#bde1fb", "#9ccbf0") + cyl(7.85, 12.25, 0.13, 30, 4, "#fbabb6", "#e994a3");
    add({ x: 7.4, y: 8.6, w: 0.5, d: 6, svg: s });
    // little boats
    const boat = (x, y, c) => `<g class="boat"><path d="M${x - 9} ${y} h18 l-3 4 h-12z" fill="#ffffff" stroke="${NAVY}" stroke-opacity=".3" stroke-width=".6"/><path d="M${x} ${y - 1} v-15 l9 13z" fill="${c}"/><path d="M${x - 1} ${y - 1} v-11 l-6 10z" fill="#ffffff"/></g>`;
    add({ x: 20, y: 20, w: .1, d: .1, svg: boat(318, 346, "#fbabb6") + boat(232, 374, "#bfa6dd") });
  }

  // topological painter's order
  function sortObjects(list) {
    const behind = (a, b) => (a.x + a.w <= b.x + 1e-6) || (a.y + a.d <= b.y + 1e-6);
    const n = list.length, indeg = new Array(n).fill(0), adj = list.map(() => []);
    for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) if (i !== j) {
      const a = list[i], b = list[j];
      if (behind(a, b) && !behind(b, a)) { adj[i].push(j); indeg[j]++; }
    }
    const key = o => o.x + o.w / 2 + o.y + o.d / 2;
    const out = [], ready = list.map((_, i) => i).filter(i => !indeg[i]);
    while (ready.length) {
      ready.sort((i, j) => key(list[i]) - key(list[j]));
      const i = ready.shift(); out.push(list[i]);
      adj[i].forEach(j => { if (--indeg[j] === 0) ready.push(j); });
    }
    if (out.length < n) list.forEach(o => { if (!out.includes(o)) out.push(o); });
    return out;
  }

  function convexHull(p) {
    p = p.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
    const cr = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
    const lo = [], up = [];
    for (const q of p) { while (lo.length >= 2 && cr(lo[lo.length - 2], lo[lo.length - 1], q) <= 0) lo.pop(); lo.push(q); }
    for (const q of p.slice().reverse()) { while (up.length >= 2 && cr(up[up.length - 2], up[up.length - 1], q) <= 0) up.pop(); up.push(q); }
    return lo.slice(0, -1).concat(up.slice(0, -1));
  }

  // ---------- public: render ----------
  function render(svgEl) {
    objects.length = 0;
    build();
    const sorted = sortObjects(objects);
    const clip = convexHull([0.35, 9.68].flatMap(x => [5.0, 6.0].flatMap(y => [-1, 34].map(z => P(x, y, z)))));
    let s = `<defs><clipPath id="kgTramClip"><polygon points="${pts(clip)}"/></clipPath></defs>`;
    s += `<g id="kgGround">${ground()}</g><g id="kgObjs">`;
    sorted.forEach((o, i) => {
      const attrs = o.room ? ` data-room="${o.room}" class="obj room-hit" role="button" tabindex="0"` : o.girl ? ` class="obj girl" data-girl="${o.girl}"` : ` class="obj"`;
      s += `<g data-i="${i}" data-x="${o.x}" data-y="${o.y}" data-w="${o.w}" data-d="${o.d}"${attrs}>${o.svg}</g>`;
    });
    s += `</g><g id="kgSigns"></g>`;
    svgEl.setAttribute("viewBox", `0 0 ${VB.w} ${VB.h}`);
    svgEl.innerHTML = s;
    return sorted;
  }

  // anchor for room signs (screen coords) and door points (grid coords)
  function roomAnchor(o) { return P(o.x + o.w / 2, o.y + o.d / 2, (o.top || 10) + (o.z || 0) * 0 + 4); }
  const DOORS = { meeting: [2.0, 2.0], president: [7.5, 2.05], studio: [4.78, 4.35], editorial: [8.0, 4.95],
                  gym: [1.75, 7.4], shop: [6.6, 8.45], board: [6.7, 5.05] };

  window.KG_TOWN = { render, iso, P, elev, VB, DOORS, roomAnchor, sortObjects };
})();
