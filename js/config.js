/* =========================================================
   KAIGI GIRLS TOWN — config (edit here, no build step)
   ========================================================= */
window.KG_CONFIG = {
  // Brand colors (sampled from logo_v1.jpg). Girls' colors are a PLACEHOLDER
  // assignment — change `color` below and everything (map signs, chat bubbles)
  // follows. tools/export_meeting.py reads these same hex values from this file.
  brand: {
    navy: "#112e58",
    robot: "#bde1fb",
    robotDeep: "#6eabea",
    pink: "#fbabb6",
    purple: "#bfa6dd",
    honey: "#e7b66a"
  },

  // Members. `match` = names as written in status.csv's `name` column.
  members: {
    rin:  { name: "凛",     nameEn: "Rin",      color: "#e7b66a", deep: "#c4862a", avatar: "assets/rin_avatar.png", room: "gym",       match: ["凛", "Rin"] },
    mio:  { name: "澪",     nameEn: "Mio",      color: "#bfa6dd", deep: "#8a63c4", avatar: "assets/mio_avatar.png", room: "studio",    match: ["澪", "Mio"] },
    rina: { name: "リナ",   nameEn: "Rina",     color: "#fbabb6", deep: "#e0607a", avatar: "assets/rina_avatar.png", room: "editorial", match: ["リナ", "Rina"] },
    robo: { name: "ロボくん", nameEn: "Robo-kun", color: "#bde1fb", deep: "#3f86d6", room: "president", match: ["ロボくん", "ロボ", "Robo", "Robo-kun"] }
  },

  // Rooms. `mdKey` = a word that appears in the rooms.md `## heading` for that room
  // (checked in this order, so the more specific ones come first).
  rooms: [
    { id: "board",     mdKey: "掲示板",   label: "トレンド掲示板", labelEn: "Trend board" },
    { id: "shop",      mdKey: "ショップ", comingSoon: true,  label: "ショップ", labelEn: "Shop" },
    { id: "meeting",   mdKey: "会議室",   label: "会議室",   labelEn: "Meeting room", shared: true },
    { id: "president", mdKey: "社長室",   label: "社長室",   labelEn: "President's office", owner: "robo" },
    { id: "gym",       mdKey: "ジム",     label: "ジム",     labelEn: "Gym",       owner: "rin" },
    { id: "studio",    mdKey: "スタジオ", label: "スタジオ", labelEn: "Studio",    owner: "mio" },
    { id: "editorial", mdKey: "編集部",   label: "編集部",   labelEn: "Editorial", owner: "rina" },
    // the little island at the end of the bridge (no rooms.md section needed: introJa/introEn are used)
    { id: "lighthouse", mdKey: "灯台の島", label: "灯台の島", labelEn: "Lighthouse Island", signEn: "Lighthouse",
      introJa: "街のいちばん端っこ、江ノ島っぽい灯台の島。ここから街ぜんぶと海が見えるよ🌊",
      introEn: "The far edge of town: a little Enoshima-ish island with a lighthouse. You can see the whole town and the sea from here 🌊" }
  ],

  // Data files (relative to index.html). The team edits status.csv and rooms.md.
  data: {
    status: "status.csv",
    rooms: "rooms.md",
    meeting: "meeting.json",
    trends: "trends.csv",     // daily trend board (one line per member per day)
    trendFadeDays: 7,         // rows older than this many days show faded
    rewards: "rewards.csv",   // daily off-shot after talking to all three (file,who,caption_ja,caption_en -> assets/rewards/)
    refreshSeconds: 60
  },

  // Footer links. href: null => shown as "準備中 / coming soon" (not clickable).
  links: {
    note: { label: "会社紹介（note）", labelEn: "Company profile (note)", href: null }
  },

  // Visitor counter (anonymous total only — see README "Visitor counter").
  //  mode "auto"     : try the local server (/api/visits), else fall back to localStorage demo
  //  mode "server"   : POST/GET `endpoint` (returns {"count": n})
  //  mode "local"    : localStorage demo (counts only in this browser)
  //  mode "off"      : hide the counter
  counter: { mode: "auto", endpoint: "/api/visits" }
};
