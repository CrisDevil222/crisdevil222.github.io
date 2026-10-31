# Phạm Hoàng Sơn — Developer & Information Security Portfolio

Personal portfolio website hosted at **[crisdevil222.github.io](https://crisdevil222.github.io/)**.  
Designed in a **minimalist, modern Dark Indigo aesthetic (`#07080d` / `#3d4dff`)** with a spacious layout focused on **Projects (with technical Case Studies)**, **CTF Writeups**, and **Competitions**. Built with **100% vanilla HTML5, CSS3, and JavaScript** — zero frameworks, zero build steps, and ready for direct deployment on GitHub Pages.

---

## ✨ Key Features

- **Minimalist Dark Indigo Design:** Clean dark-only palette (`--bg: #07080d`, `--surface: #0e1017`, `--primary: #3d4dff`, `--primary-soft: #6a74ff`), pill-shaped primary buttons, static SVG star/circle accents, and WCAG AA contrast compliance.
- **Self-Hosted Three.js Hero Wireframe (`r187` / `0.187.0`) & Controlled 2D/3D Effects (`hero3d.js` + `effects.js` <= 15KB):**
  - Renders a dual counter-rotating icosahedron wireframe with glowing vertex nodes, an `AdditiveBlending` particle field (~300 points desktop / ~120 mobile), a fake glow outer shell (zero post-processing), a 900ms `easeOutCubic` intro scale/fade, scroll-linked rotation/shift/fade, and pointer-proximity vertex brightening in `/assets/js/hero3d.js` using self-hosted **Three.js `0.187.0` (`r187`)** in `/assets/vendor/three/three.module.min.js` (MIT License).
  - Controlled 2D page effects in `/assets/js/effects.js`: 2px top scroll progress bar (CSS `animation-timeline: scroll()` with passive scroll fallback), pointer spotlight on Hero and cards (`--mx` / `--my` on `hover: hover`), one-time 600ms text decode on headings (preserving `aria-label` & DOM spans), 60ms staggered card reveal (max 6 per batch), and one-time number counters for `site.json` project/writeup counts.
  - Configurable via `"effects": { "level": "rich" }` (`"off" | "subtle" | "rich"`) in `site.json`, plus a user-controllable `"Effects: On/Off"` button in the footer (`localStorage`), and automatic `"off"` fallback when `prefers-reduced-motion: reduce` is enabled.
  - Loaded lazily via dynamic `import()` after `window.load` + `requestIdleCallback` so HTML, CSS, and Hero text render first (`CLS = 0`).
- **Projects + Native HTML Case Studies:** Each project card includes a native `<details><summary>View case study</summary>...</details>` expandable breakdown (`Problem`, `Approach`, `Key decisions`, `Result`, `What I learned`) that works without JavaScript and via keyboard. Any field marked `"TODO"` in `site.json` is automatically hidden.
- **CTF Writeups & Dynamic Event Counters:** Filterable writeups from **Hacktheon Sejong 2026** and **BKISC CTF 2026** with automatic per-contest counters, category/contest filters, language badges (`EN` / `VI`), and safe links to Notion writeups (zero flags, IPs, or raw payloads exposed).
- **Single Source of Truth (`site.json`) & Bilingual (`EN` / `VI`):** All profile text, projects, case studies, writeups, contests, and tech stack cards are driven by `/assets/data/site.json` and `/assets/data/i18n.json`, with static HTML fallbacks when JavaScript is disabled.
- **Privacy & Anti-Scraping:** Only publicizes name, email (`crishoang09@gmail.com`), and GitHub. Email address is assembled dynamically via JavaScript with one-click clipboard copy.

---

## 📁 Directory Structure

```text
.
├── index.html                  # Main portfolio page (9 sections in exact order)
├── 404.html                    # Minimalist dark indigo 404 page
├── favicon.svg                 # Monogram "S" SVG icon
├── og-image.png                # 1200x630 Open Graph preview image
├── robots.txt                  # Search engine crawler rules
├── sitemap.xml                 # XML sitemap
├── README.md                   # Documentation
├── .gitignore                  # Ignored local/OS files
├── .github/
│   └── workflows/
│       └── check.yml           # CI workflow: html-validate + lychee (notion.com excluded)
└── assets/
    ├── css/
    │   ├── base.css            # Design tokens, Space Grotesk/Inter/JetBrains Mono, reset
    │   ├── layout.css          # Utility bar, sticky navbar, grids, multi-column footer
    │   └── components.css      # Pill buttons, 3D hero stage, project cards, case studies, writeups
    ├── js/
    │   ├── main.js             # Data rendering, writeup filters, i18n, lazy 3D loader
    │   ├── hero3d.js           # Three.js icosahedron wireframe, particles, fake glow & lifecycle
    │   └── effects.js          # Controlled 2D effects (scroll bar, spotlight, decode, stagger, counters)
    ├── vendor/
    │   └── three/
    │       ├── three.module.min.js  # Self-hosted Three.js 0.187.0 (r187) core module
    │       └── LICENSE              # Three.js MIT License
    ├── data/
    │   ├── site.json           # Profile, links, projects + caseStudy, writeups, contests, stack
    │   └── i18n.json           # English & Vietnamese UI strings
    └── img/
        └── og-image.svg        # Vector source for og-image.png
```
