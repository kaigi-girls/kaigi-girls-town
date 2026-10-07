# KAIGI GIRLS TOWN

A tiny seaside-town peek site for **KAIGI GIRLS Inc.**  
Visitors become a little robot and look in on Rin, Mio, Rina, and Robo-kun.

Static HTML/CSS/JS — no build step. Phone-first (~390px), works on desktop too.

## Colors

| Member | Color |
|--------|--------|
| Rin (凛) | honey |
| Mio (澪) | purple |
| Rina (リナ) | pink |

(Robo-kun uses the brand robot blue.)

## Run locally

```bash
# any static server, e.g.
python3 -m http.server 8000
```

Open `http://localhost:8000/`.

Useful query options: `?still=1` (freeze tram/animations), `?open=meeting` (open a room on load).

## Files

| Path | What |
|------|------|
| `index.html`, `css/` | page |
| `js/` | map, UI, data loaders, visitor counter |
| `assets/` | logo, favicon, avatars |
| `status.csv` | live status signs (team-edited) |
| `rooms.md` | room intros (team-edited) |
| `meeting.json` | curated meeting-room lines |
| `.nojekyll` | tells GitHub Pages not to run Jekyll |

The page re-reads `status.csv`, `rooms.md`, and `meeting.json` about every 60 seconds and when the tab becomes visible again.

## Visitor counter

Anonymous **total only**. No IP addresses, no cookies, no visitor IDs, no fingerprinting.

On static hosting (including GitHub Pages), there is no `/api/visits` endpoint, so the counter **falls back to `localStorage`** in that browser (one number, labeled as a demo for this device only). It does not count other visitors.

## How to update content

### `status.csv`

One row per member. Columns:

```
name,room,status_ja,status_en,updated_jst
凛,海沿いのジム,短い日本語ステータス💛,Short English status 💛,2026-10-07 08:45
```

- `name`: 凛 / 澪 / リナ / ロボくん  
- `room`: free text shown as written  
- `status_ja` / `status_en`: what they're doing now (emoji OK; keep it short)  
- `updated_jst`: `YYYY-MM-DD HH:MM` Japan time  
- If a field contains a comma, wrap it in double quotes.

Edit only your own row, commit, and push. The live site picks it up on the next refresh.

### `rooms.md`

Markdown room intros. Structure:

```
# Title
Town intro (JA)
Town intro (EN)

## 海沿いのジム（凛）
Japanese intro…
English intro…
```

- Each `## heading` is one room (matched by keywords such as ジム, スタジオ, 編集部, 会議室, 社長室, ショップ, 掲示板).  
- Lines with Japanese → JA; other lines → EN.  
- Text before the first `##` is the town intro.

### `meeting.json`

**Only lines in this file are ever shown.** Add a line only after it has been privacy-checked and approved.

```json
{
  "meetings": [
    {
      "id": "2026-10-07-example",
      "date": "2026-10-07",
      "title": "Meeting title",
      "lines": [
        { "speaker": "rin", "text": "…" }
      ]
    }
  ]
}
```

- `speaker`: `rin` / `mio` / `rina` / `robo`  
- Newest `date` is shown first.  
- `"sample": true` on a meeting or line shows a SAMPLE badge — remove it when real approved lines go in.

## Privacy

Fictional town and characters only. No personal information about real people. Meeting lines are hand-picked before they go in.

## trends.csv (trend board / 掲示板)

**How to add a trend line:** append one line per member per day to `trends.csv` — `date,who,trend,comment,next_post` — e.g. `2026-10-08,rin,秋のストレッチ,朝5分だけでも体がぽかぽか,1`. `date` is the JST day (`YYYY-MM-DD`), `who` is `rin` / `mio` / `rina`, `trend` is a few topic words only (no links, no other people's posts or names), `comment` is a one-line hitokoto, and `next_post` is `1` to show the 「次で使うかも👀」 badge (else `0`). The newest date shows as 今日のトレンド on the board; older dates move into トレンドの記録 / Trend archive automatically (newest first), and rows older than 7 days fade (`trendFadeDays` in `js/config.js`). Lines starting with `#` are ignored. Icons: `assets/{rin,mio,rina}_avatar.png` (256px, metadata stripped).
