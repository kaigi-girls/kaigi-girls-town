/* Tiny isometric SVG toolkit (string-based, no deps). Shared by the town map
   and tools/tram_illustration.html. */
(function () {
  const NAVY = "#112e58";
  const f1 = n => Math.round(n * 10) / 10;

  function makeIso(opt) {
    const { cx, oy, hw, hh } = opt;
    const zs = opt.zs || 1;                       // pixels per z unit
    const P = (gx, gy, z = 0) => [cx + (gx - gy) * hw, oy + (gx + gy) * hh - z * zs];
    const pts = arr => arr.map(p => f1(p[0]) + "," + f1(p[1])).join(" ");
    const SW = opt.strokeW || 0.6;
    const strokeAttr = (s) => s === "none" ? "" : ` stroke="${s || NAVY}" stroke-opacity="0.28" stroke-width="${SW}" stroke-linejoin="round"`;
    const poly = (arr, fill, s, extra = "") => `<polygon points="${pts(arr)}" fill="${fill}"${strokeAttr(s)} ${extra}/>`;

    // flat quad on z plane
    const tile = (x, y, w, d, z, fill, s = "none", extra = "") =>
      poly([P(x, y, z), P(x + w, y, z), P(x + w, y + d, z), P(x, y + d, z)], fill, s, extra);

    // box: left = face on plane gy=y+d (front-left), right = plane gx=x+w (front-right)
    function box(o) {
      const { x, y, w, d, z = 0, h } = o, z1 = z + h;
      let s = "";
      s += poly([P(x, y + d, z), P(x + w, y + d, z), P(x + w, y + d, z1), P(x, y + d, z1)], o.left, o.stroke, o.leftExtra || "");
      s += poly([P(x + w, y, z), P(x + w, y + d, z), P(x + w, y + d, z1), P(x + w, y, z1)], o.right, o.stroke, o.rightExtra || "");
      if (o.top !== null) s += poly([P(x, y, z1), P(x + w, y, z1), P(x + w, y + d, z1), P(x, y + d, z1)], o.top, o.stroke);
      return s;
    }
    // rectangles drawn onto faces
    const onL = (Y, x0, x1, z0, z1, fill, s = "none", extra = "") =>
      poly([P(x0, Y, z0), P(x1, Y, z0), P(x1, Y, z1), P(x0, Y, z1)], fill, s, extra);
    const onR = (X, y0, y1, z0, z1, fill, s = "none", extra = "") =>
      poly([P(X, y0, z0), P(X, y1, z0), P(X, y1, z1), P(X, y0, z1)], fill, s, extra);

    // gable roof, ridge along gx
    function gable(o) {
      const { x, y, w, d, z, h, e = 0.12 } = o;
      const x0 = x - e, x1 = x + w + e, y0 = y - e, y1 = y + d + e, m = (y0 + y1) / 2;
      let s = "";
      s += poly([P(x0, y0, z), P(x1, y0, z), P(x1, m, z + h), P(x0, m, z + h)], o.back || o.roof, o.stroke);
      s += poly([P(x0, y1, z), P(x1, y1, z), P(x1, m, z + h), P(x0, m, z + h)], o.roof, o.stroke);
      s += poly([P(x + w, y, z), P(x + w, y + d, z), P(x + w, (y + y + d) / 2, z + h * 0.92)], o.gableWall || o.wall, o.stroke);
      if (o.ridge) s += `<line x1="${f1(P(x0, m, z + h)[0])}" y1="${f1(P(x0, m, z + h)[1])}" x2="${f1(P(x1, m, z + h)[0])}" y2="${f1(P(x1, m, z + h)[1])}" stroke="${o.ridge}" stroke-width="${SW * 2.2}" stroke-linecap="round"/>`;
      return s;
    }

    // vertical cylinder (front half side + top ellipse)
    function cyl(gx, gy, r, z, h, top, side, n = 20) {
      const front = [], topPts = [];
      for (let i = 0; i <= n; i++) { const t = -Math.PI / 4 + Math.PI * i / n; front.push([gx + r * Math.cos(t), gy + r * Math.sin(t)]); }
      for (let i = 0; i < n * 2; i++) { const t = Math.PI * i / n; topPts.push(P(gx + r * Math.cos(t), gy + r * Math.sin(t), z + h)); }
      const sidePts = front.map(p => P(p[0], p[1], z)).concat(front.slice().reverse().map(p => P(p[0], p[1], z + h)));
      return poly(sidePts, side) + poly(topPts, top);
    }

    // blob (iso ellipse-ish polygon) at height z, optional thickness
    function blob(gx, gy, rx, ry, z, top, side, thick = 0, wobble = 0, n = 28) {
      const ring = [];
      for (let i = 0; i < n; i++) {
        const t = Math.PI * 2 * i / n;
        const k = 1 + wobble * Math.sin(t * 3 + 1.3) * 0.5 + wobble * Math.cos(t * 5) * 0.3;
        ring.push([gx + rx * k * Math.cos(t), gy + ry * k * Math.sin(t)]);
      }
      let s = "";
      if (thick) {
        const sides = ring.map(p => P(p[0], p[1], z - thick)).concat(ring.slice().reverse().map(p => P(p[0], p[1], z)));
        // simple: draw the lowered ring then the top on it
        s += poly(ring.map(p => P(p[0], p[1], z - thick)), side, "none");
        // vertical connecting band via many quads (cheap enough for small n)
        for (let i = 0; i < n; i++) {
          const a = ring[i], b = ring[(i + 1) % n];
          s += poly([P(a[0], a[1], z - thick), P(b[0], b[1], z - thick), P(b[0], b[1], z), P(a[0], a[1], z)], side, "none");
        }
      }
      s += poly(ring.map(p => P(p[0], p[1], z)), top, "none");
      return s;
    }

    function tree(gx, gy, z, size = 1, col = "#8fcf8a", dark = "#6fb878") {
      const [x, y] = P(gx, gy, z);
      const r = 7 * size;
      return `<g><ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(r * 0.8)}" ry="${f1(r * 0.35)}" fill="${NAVY}" opacity=".10"/>` +
        `<rect x="${f1(x - 1.2 * size)}" y="${f1(y - 7 * size)}" width="${f1(2.4 * size)}" height="${f1(7 * size)}" rx="1" fill="#c79a6b"/>` +
        `<circle cx="${f1(x)}" cy="${f1(y - 11 * size)}" r="${f1(r)}" fill="${col}"/>` +
        `<circle cx="${f1(x + 2.2 * size)}" cy="${f1(y - 9 * size)}" r="${f1(r * 0.62)}" fill="${dark}" opacity=".55"/>` +
        `<circle cx="${f1(x - 2.4 * size)}" cy="${f1(y - 13.5 * size)}" r="${f1(r * 0.32)}" fill="#fff" opacity=".35"/></g>`;
    }
    function pine(gx, gy, z, size = 1) {
      const [x, y] = P(gx, gy, z);
      const s = size;
      return `<g><ellipse cx="${f1(x)}" cy="${f1(y)}" rx="${f1(5 * s)}" ry="${f1(2 * s)}" fill="${NAVY}" opacity=".10"/>` +
        `<path d="M${f1(x)} ${f1(y)} q ${f1(1.5 * s)} ${f1(-8 * s)} ${f1(4 * s)} ${f1(-16 * s)}" stroke="#b07f55" stroke-width="${f1(2 * s)}" fill="none" stroke-linecap="round"/>` +
        `<ellipse cx="${f1(x + 4 * s)}" cy="${f1(y - 17 * s)}" rx="${f1(8 * s)}" ry="${f1(3.6 * s)}" fill="#5fa77a"/>` +
        `<ellipse cx="${f1(x + 2 * s)}" cy="${f1(y - 12 * s)}" rx="${f1(6 * s)}" ry="${f1(2.8 * s)}" fill="#6fb88a"/>` +
        `<ellipse cx="${f1(x + 5.5 * s)}" cy="${f1(y - 21 * s)}" rx="${f1(5 * s)}" ry="${f1(2.6 * s)}" fill="#7cc496"/></g>`;
    }
    function bush(gx, gy, z, col, size = 1) {
      const [x, y] = P(gx, gy, z);
      return `<g><circle cx="${f1(x - 2.5 * size)}" cy="${f1(y - 2 * size)}" r="${f1(2.8 * size)}" fill="${col}"/>` +
        `<circle cx="${f1(x + 2.2 * size)}" cy="${f1(y - 2.4 * size)}" r="${f1(2.6 * size)}" fill="${col}" opacity=".85"/>` +
        `<circle cx="${f1(x)}" cy="${f1(y - 4.2 * size)}" r="${f1(2.8 * size)}" fill="${col}"/>` +
        `<circle cx="${f1(x - 0.8 * size)}" cy="${f1(y - 5 * size)}" r="${f1(0.9 * size)}" fill="#fff" opacity=".6"/></g>`;
    }

    // little seaside tram (cream + green), runs along gx. (x = rear end)
    function tram(x, y, d = 0.62, len = 2.2, z = 0.6, H = 15) {
      const g = "#5cb58e", gD = "#3f9572", cream = "#fff6df", creamD = "#f1e4c2", roof = "#e8eef5";
      let s = "";
      s += `<g>`;
      s += poly([P(x, y + d, z - 0.6), P(x + len, y + d, z - 0.6), P(x + len + 0.1, y + d + 0.15, z - 0.6), P(x + 0.1, y + d + 0.15, z - 0.6)], "rgba(17,46,88,.12)", "none");
      s += box({ x, y, w: len, d, z, h: H * 0.48, left: g, right: gD, top: null });
      s += box({ x, y, w: len, d, z: z + H * 0.48, h: H * 0.52, left: cream, right: creamD, top: roof });
      // windows on the long side
      const nW = Math.max(3, Math.round(len * 2));
      for (let i = 0; i < nW; i++) {
        const a = x + 0.12 + i * (len - 0.24) / nW, b = a + (len - 0.24) / nW - 0.08;
        s += onL(y + d, a, b, z + H * 0.55, z + H * 0.88, "#7fb8e6", "none");
        s += onL(y + d, a + 0.03, a + (b - a) * 0.45, z + H * 0.78, z + H * 0.86, "#fff", "none", 'opacity=".55"');
      }
      // front window + headlight
      s += onR(x + len, y + 0.1, y + d - 0.1, z + H * 0.56, z + H * 0.9, "#6aa9dc", "none");
      const hl = P(x + len, y + d / 2, z + H * 0.25);
      s += `<circle cx="${f1(hl[0])}" cy="${f1(hl[1])}" r="${f1(1.3 * zs)}" fill="#fff6a8" stroke="${NAVY}" stroke-opacity=".3" stroke-width="${SW}"/>`;
      // wheels
      [0.35, len - 0.35].forEach(t => { const w = P(x + t, y + d, z - 0.2); s += `<circle cx="${f1(w[0])}" cy="${f1(w[1])}" r="${f1(1.6 * zs)}" fill="${NAVY}"/>`; });
      // pantograph
      const p0 = P(x + len * 0.5, y + d / 2, z + H), p1 = P(x + len * 0.42, y + d / 2, z + H + 6), p2 = P(x + len * 0.62, y + d / 2, z + H + 6);
      s += `<polyline points="${pts([p0, p1, p2])}" fill="none" stroke="${NAVY}" stroke-opacity=".6" stroke-width="${SW * 1.4}" stroke-linejoin="round"/>`;
      // pink stripe (company color)
      s += onL(y + d, x, x + len, z + H * 0.46, z + H * 0.52, "#fbabb6", "none");
      s += `</g>`;
      return s;
    }

    // tiny chibi figure (girls on the map): (gx,gy,z) = feet
    function girl(gx, gy, z, color, hair, k = 1, pony = false) {
      const [x, y] = P(gx, gy, z);
      const f = n => f1(n * k);
      return `<g transform="translate(${f1(x)},${f1(y)})">` +
        `<ellipse cx="0" cy="0" rx="${f(4)}" ry="${f(1.5)}" fill="${NAVY}" opacity=".15"/>` +
        `<rect x="${f(-2.2)}" y="${f(-4)}" width="${f(1.6)}" height="${f(4)}" rx="${f(.8)}" fill="${NAVY}" opacity=".75"/><rect x="${f(.6)}" y="${f(-4)}" width="${f(1.6)}" height="${f(4)}" rx="${f(.8)}" fill="${NAVY}" opacity=".75"/>` +
        `<path d="M${f(-3.6)} ${f(-3.4)} Q${f(-3.4)} ${f(-10)} 0 ${f(-10.4)} Q${f(3.4)} ${f(-10)} ${f(3.6)} ${f(-3.4)}Z" fill="${color}" stroke="${NAVY}" stroke-opacity=".3" stroke-width=".5"/>` +
        (pony ? `<path d="M${f(2.6)} ${f(-15)} q${f(3.4)} ${f(1)} ${f(2.4)} ${f(5.6)}" stroke="${hair}" stroke-width="${f(2)}" fill="none" stroke-linecap="round"/>` : "") +
        `<circle cx="0" cy="${f(-13.4)}" r="${f(3.6)}" fill="#ffe3d3"/>` +
        `<path d="M${f(-3.8)} ${f(-12.6)} Q${f(-4.2)} ${f(-17.6)} 0 ${f(-17.4)} Q${f(4.2)} ${f(-17.6)} ${f(3.8)} ${f(-12.6)} Q${f(1)} ${f(-15.4)} ${f(-3.8)} ${f(-12.6)}Z" fill="${hair}"/>` +
        (pony ? "" : `<path d="M${f(-3.8)} ${f(-13)} L${f(-3.9)} ${f(-9.6)} M${f(3.8)} ${f(-13)} L${f(3.9)} ${f(-9.6)}" stroke="${hair}" stroke-width="${f(1.6)}" stroke-linecap="round"/>`) +
        `<circle cx="${f(-1.3)}" cy="${f(-13)}" r="${f(.45)}" fill="${NAVY}"/><circle cx="${f(1.3)}" cy="${f(-13)}" r="${f(.45)}" fill="${NAVY}"/></g>`;
    }

    return { P, pts, poly, tile, box, onL, onR, gable, cyl, blob, tree, pine, bush, tram, girl, hw, hh, cx, oy, zs };
  }

  // Cute flat robot. (0,0) = ground point. Returns an SVG <g> string.
  function robotSVG(o = {}) {
    const body = o.body || "#bde1fb", s = o.scale || 1, eye = o.eye || NAVY;
    const tr = `scale(${s})`;
    let g = `<g transform="${tr}">`;
    g += `<ellipse cx="0" cy="0" rx="8" ry="2.6" fill="${NAVY}" opacity=".16"/>`;
    g += `<rect x="-7" y="-4.5" width="4" height="4.5" rx="2" fill="${NAVY}"/><rect x="3" y="-4.5" width="4" height="4.5" rx="2" fill="${NAVY}"/>`;
    g += `<line x1="0" y1="-20" x2="0" y2="-24" stroke="${NAVY}" stroke-width="1.3"/><circle cx="0" cy="-24.5" r="${o.antennaR || 1.8}" fill="${o.antenna || NAVY}"/>`;
    g += `<ellipse cx="0" cy="-11" rx="8.2" ry="9.4" fill="${body}" stroke="${NAVY}" stroke-opacity=".35" stroke-width=".7"/>`;
    g += `<path d="M-7.6 -7.5 Q0 -3.5 7.6 -7.5 Q6 -2 0 -1.7 Q-6 -2 -7.6 -7.5Z" fill="${o.bodyLow || "#a7d3f5"}" opacity=".8"/>`;
    [[-2.6, -15], [2.6, -15], [-2.6, -10.6], [2.6, -10.6]].forEach(([x, y]) => {
      g += `<circle cx="${x}" cy="${y}" r="1.75" fill="${eye}"/><circle cx="${x + 0.45}" cy="${y - 0.4}" r=".6" fill="#6eabea"/>`;
    });
    if (o.headset) g += `<ellipse cx="7.8" cy="-12" rx="1.9" ry="2.6" fill="${NAVY}"/><path d="M7.8 -10 Q6.5 -5.5 2.8 -5.6" stroke="${NAVY}" stroke-width=".9" fill="none"/><circle cx="2.6" cy="-5.6" r=".9" fill="${NAVY}"/>`;
    if (o.pen) g += `<rect x="-11.2" y="-16" width="1.8" height="9" rx=".8" fill="${NAVY}" transform="rotate(-12 -10 -11)"/><circle cx="-8.6" cy="-8.8" r="1.8" fill="${NAVY}"/>`;
    g += `</g>`;
    return g;
  }

  window.KG_ISO = { makeIso, robotSVG, NAVY };
})();
