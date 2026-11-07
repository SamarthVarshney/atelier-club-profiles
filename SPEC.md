# SPEC.md — Atelier Club Dossier & Biolink Studio

## 1. Overview
**Atelier Club Dossier & Biolink Studio** is a self-hostable, multi-member interactive biolink platform and modular profile customizer designed for student collectives, engineering clubs, and creative studios. It implements a 5-layer interactive architecture with a **Dark Editorial Studio** aesthetic (warm obsidian surfaces, analog 35mm film grain, bespoke serif/grotesque/monospace typography, zero generic AI gradients).

## 2. Five-Layer Runtime Architecture
1. **Splash Gate Layer**: Customizable Click-to-Enter overlay (headline, subtext, blur, opacity, font, fade/zoom transition) that unlocks browser media autoplay and synchronizes background video and multi-track audio.
2. **Full-Viewport Media & Shader Layer**: Supports video/image wallpapers up to 100 MB plus real-time HTML5 Canvas atmospheric shaders (Rain with mouse parallax, Snow, Twinkling Night Sky, Blurred Cinema Backdrop, and VHS / CRT Scanline Grain).
3. **Glassmorphic Profile Container Layer**: Supports `0%`–`100%` opacity, `0px`–`40px` `backdrop-filter: blur()`, multi-stop linear gradients, Swap Box Colors, customizable borders, 3D mouse-move perspective tilt, and all 4 structural wireframes (`Default`, `Modern` 2-tab, `Simplistic` wide buttons, `Sleek` horizontal).
4. **Live Integrations Layer**: Real-time Lanyard WebSocket (`wss://api.lanyard.rest/socket`) and REST (`https://api.lanyard.rest/v1/users/:id`) Discord Rich Presence (online/idle/dnd/offline indicator, custom status, live Spotify progress bar, elapsed activity timer, avatar sync, and avatar decoration frames) plus Second-Tab Rich Widgets (Spotify, YouTube, Discord Server, Telegram Channel, Roblox Profile, GitHub).
5. **DOM Overlay & Telemetry Layer**: Custom cursors, interactive particle cursor trails (Fairy Dust, Snowflakes, Ghost Cursor, Ink Dots, Bubbles), floating multi-track audio deck (with shuffle/loop/volume/mute), animated browser `<title>`, 37 social/gaming/creator/wallet platforms (Link Mode vs. Clipboard Text Mode + drag-and-drop reorder), 17 customizable badges, Community Templates Marketplace, OpenGraph User Info Overlay composer, Page Aliases, and Profile Analytics.

## 3. Asset Uploader Specification
| Slot | Extensions | Max Size |
| :--- | :--- | :--- |
| Background | `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.mp4`, `.m4v`, `.webm`, `.mov`, `.mkv` | 100 MB |
| Audio Manager | `.mp3`, `.aac` (+ built-in WebAudio analog tape synths) | 10 MB |
| Profile Avatar | `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp` | 5 MB |
| Profile Banner | `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp` | 10 MB |
| Custom Cursor | `.cur`, `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp` | 5 MB |
| Custom Font | `.ttf`, `.otf`, `.woff`, `.woff2` (`FontFace` dynamic injection) | 5 MB |
| Icons & Covers | `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp` | 10 MB |
| Metadata Images | `.png`, `.jpg`, `.jpeg`, `.gif`, `.ico`, `.svg` | 10 MB |
| Custom Badge | `.png`, `.jpg`, `.jpeg`, `.gif`, `.webp`, `.svg` | 10 MB |
