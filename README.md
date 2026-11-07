# ATELIER // Club Dossier & Biolink Studio

A self-hostable, multi-member interactive profile directory and modular biolink design studio built for clubs, student collectives, and engineering/design teams.

Designed with a **Dark Editorial Studio** theme (warm obsidian surfaces, 35mm film grain, `Instrument Serif` + `Syne` + `Newsreader` + `JetBrains Mono` typography, and Swiss vermilion / tungsten amber / celadon pigments — zero generic AI purple gradients).

---

## Architecture & Feature Matrix

1. **Multi-Member Club Roster (`/`)**
   - Searchable & department-filterable member index (`Engineering`, `Design`, `Sound & Media`, `Systems`, `Research`).
   - Instant **Claim Member Handle** onboarding modal with optional **Member Edit PIN** protection.
   - Direct routes (`/@handle`, `/u/handle`, `/[username]`) plus automatic **Page Aliases** resolution.
2. **Collapsible Dual-Pane Studio Customizer (`/customize`, `/premium/layout`, `/premium/metadata`)**
   - **9-Slot Drag-and-Drop Asset Uploader** (Background video/image up to 100 MB, Audio `.mp3`/`.aac` 10 MB, Avatar 5 MB, Banner 10 MB, Custom Cursor 5 MB, Custom Font `.ttf`/`.otf`/`.woff` 5 MB via dynamic `FontFace` injection, Album Art/Icon 10 MB, Favicon/OG 10 MB, Custom Badge 10 MB) + direct media URL support.
   - **Click-to-Enter Splash Gate**: Custom headline, sub-caption, blur, opacity, font, and fade/zoom transition unlocking synchronized video & multi-track audio playback.
   - **Glassmorphism & Pigment Engine**: Real-time Opacity (`0%`–`100%`), Backdrop Blur (`0px`–`40px`), multi-stop Gradient builder, Swap Box Colors, Glow spread radius + independent Username / Socials / Badges glow toggles, Monochrome toggles, and animated browser `<title>` marquee.
   - **Atmospheric Canvas Shaders & Cursor Physics**: Mouse-parallax Rain, Snow, Twinkling Night Sky, Blurred Cinema Wallpaper, and VHS Scanline Grain; 5 interactive cursor trail modes + 3D mouse-coordinate card tilt; Typewriter Bio engine (Typing Speed, Deletion Speed, and Pause Duration).
   - **4 Structural Wireframes & Rich Widgets**: `Default`, `Modern` (2-tab unlocking Spotify, YouTube, Discord Server, Telegram Channel, Roblox Profile, and GitHub widgets), `Simplistic` (Linktree-style wide editorial buttons), and `Sleek` (horizontal studio credential).
   - **Live Discord Presence (Lanyard Socket & REST)**: Connects to `wss://api.lanyard.rest/socket` & `https://api.lanyard.rest/v1/users/:id` with live Spotify playback bar, ticking elapsed timer, avatar sync, and decoration rings.
   - **37 Social Platforms & 17 Badges**: Link Mode (open URL) vs. Text Mode (1-click clipboard copy with toast) + drag-and-drop reordering.
3. **Community Templates Marketplace (`/templates`)**
   - Browse presets, live-preview on your own member data, apply in one click, or publish (`Public`, `Unlisted`, `Private`) & export/import `.json` configs.
4. **Telemetry & Visitor Analytics (`/analytics`)**
   - Tracks Total Views, Average Daily Views, Link Clicks, CTR %, Device Breakdown, Referrers, Most Clicked Socials, and an interactive SVG Visitor World Map.

---

## Quick Start

```bash
npm install
npm run dev
```

### Verification & Production Server

```bash
npm run lint    # Static analysis (oxlint)
npm test        # Automated API, PIN guard, alias & upload integration tests
npm run build   # TypeScript type-check (tsc -b) + Vite production bundle
npm start       # Launch standalone production HTTP + persistent API server
```
