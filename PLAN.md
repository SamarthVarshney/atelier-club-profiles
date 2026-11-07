# PLAN.md — 6-Wave Execution & 5-Tier Verification Plan

## Wave Breakdown
- **Wave 1 — Core Architecture, State Engine & Collapsible Dual-Pane Customizer (`/customize`)**
  - Multi-member Club Roster (`/`), Live Profile Routes (`/@[username]`, `/[username]`, plus Page Aliases), and Dual-Pane Studio (`/customize`) with collapsible control sidebar, drag-and-drop 9-slot Asset Uploader, direct URL asset support, persistent Node API (`server/api.mjs`), local fallback, and 1-click JSON config import/export.
- **Wave 2 — Click-to-Enter Splash Screen, Audio Deck & Glassmorphism Engine**
  - Splash overlay with custom prompt, blur, opacity, font, and fade/zoom transition unlocking synchronized video & audio playback.
  - Floating glassmorphic multi-track Audio Player with rotating sleeve art, play/pause, next/prev, shuffle/loop toggles, and volume/mute controls.
  - Real-time Opacity, Blur, Gradient, Swap Box Colors, hex pickers, independent Glow intensity & toggles (Username, Socials, Badges), and animated browser `<title>`.
- **Wave 3 — Particle Canvas Overlays, Username Shaders, Typewriter & Cursor Physics**
  - HTML5 Canvas Rain (with mouse parallax), Snow, Twinkling Stars, Blurred Wallpaper, and VHS Scanline Grain.
  - Username sparkle emitters & chromatic/halation shaders; Typewriter bio loop with Typing Speed, Deletion Speed, and Pause Duration sliders; Custom Cursor + 5 trail physics modes + 3D perspective card tilt.
- **Wave 4 — The 4 Structural Layouts & Second-Tab Rich Widgets (`/premium/layout`)**
  - Instant live switching between `Default`, `Modern` (2-tab), `Simplistic` (Linktree buttons), and `Sleek` (horizontal) with border/corner/avatar/banner radius sliders and live widgets (Spotify, YouTube, Discord Server, Telegram, Roblox, GitHub).
- **Wave 5 — Live Discord Presence (Lanyard WS/REST), 37 Social Platforms & 17 Badges**
  - Real-time `wss://api.lanyard.rest/socket` + REST integration with live Spotify progress bar, elapsed activity timer, avatar sync, and decoration rings.
  - 37 platforms with Link Mode vs. Clipboard Text Mode + drag-and-drop reorder; 17 badges with tooltips, drag reorder, Monochrome toggle, and custom glow.
- **Wave 6 — Templates Marketplace (`/templates`), SEO Metadata (`/premium/metadata`) & Analytics (`/analytics`)**
  - One-click template preview, apply, and publish (`Public`, `Unlisted`, `Private`); live Discord/X OpenGraph card with User Info Overlay composer; interactive Analytics Dashboard with CTR %, device breakdown, referrers, social clicks, and visitor country map.

## 5-Tier Verification Checklist
1. **Tier 1 — Syntax & Type Safety**: `npx tsc -b --noEmit` passes with zero errors.
2. **Tier 2 — Linting**: `npm run lint` (`oxlint`) passes cleanly.
3. **Tier 3 — Automated API & Schema Tests**: `npm test` (`node --test tests/studio.test.mjs`) validates persistent CRUD, aliases, asset upload limits, templates, and analytics telemetry.
4. **Tier 4 — Production Bundle Verification**: `npm run build` compiles cleanly with Vite.
5. **Tier 5 — Live Server & Independent Subagent Audit**: Launch dev server, verify HTTP endpoints & rendered routes, and run independent subagent review.
