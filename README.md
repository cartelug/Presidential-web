# Forty Years of Transformation · Republic of Uganda · 1986–2026

A single self-contained cinematic scroll story (`index.html`, no build step, no external requests)
built to the "Pro Max + Extreme Pro Smoothness" master plan (`/docs`… see the uploaded plan PDF).

- **12 chapters:** Opening Seal → Hero → At-a-Glance → Inheritance → National Ledger → Journey →
  Achievements Atlas → Regions (Uganda Evidence Map) → Voices → In Pictures → What's Next → Closing.
- **Scene engine:** a fixed background stage (`.stage`) with layered crossfades driven by
  `body[data-scene]` via IntersectionObserver. Transform/opacity only; no scroll-jacking.
- **Accessibility:** skip link, one h1, semantic sections, visible gold focus, node buttons with
  aria-labels, mobile card fallback for the map, reduced-motion mode, no-JS readable.
- **Performance:** preloaded hero cutout, width/height on all images, lazy below-fold,
  `content-visibility:auto` chapters, embedded fonts/textures, zero external requests.
- **Docs:** `docs/asset-inventory.md`, `docs/data-sources.md`, `docs/launch-checklist.md`.

Deploys to GitHub Pages automatically on push to `main` (`.github/workflows/pages.yml`).
