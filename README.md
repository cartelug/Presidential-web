# The Light of a Nation · Forty Years of Transformation · 1986–2026

A cinematic national record for the Republic of Uganda, told as **a film in five acts** —
from darkness (1986) to dawn (2026) — crowned by **the Living Map**: Uganda's silhouette
as a canvas of light where forty years of works ignite region by region as you scroll.

## The five acts
1. **Darkness / 1986** — cold open; the inheritance in three brutal numbers.
2. **The Turn** — title sequence; the President emerges from shadow into key-light.
3. **The Work** — four eras in motion (UPE classroom, coffee economy, expressway, Karuma),
   each with a counting figure; the palette warms era by era.
4. **The Light** — the Living Map comes forward and the nation ignites; every light opens
   its evidence, with an accessible works register below.
5. **The Address** — golden hour: the President among the people, the closing words,
   the signature, and the full sources register.

## Stack
- **Vite + TypeScript, no framework** — a scene graph, not a component tree:
  `main.ts` (choreography) · `map.ts` (Living Map canvas) · `grain.ts` · `data.ts`.
- **GSAP ScrollTrigger** pinned scenes + **Lenis** smooth scroll (`lerp 0.1`); count-ups
  ease on Lenis's own exponential-decay curve so the whole film shares one physics.
- Self-hosted fonts (Fraunces Variable, Schibsted Grotesk). No external requests.

## Craft guarantees
- **Reduced motion**: the film degrades to a composed photo-essay — no pins, no smoothing,
  map fully lit, all values final.
- **No-JS**: every act is readable; the works register and sources are rendered
  from the same data module.
- **Accessibility**: one `h1`, skip link, visible focus, canvas is decorative — keyboard
  users get real buttons (map hit-targets + the works register).
- **Sources**: every figure carries a numbered footnote resolving to the register in Act V.

## Develop
```bash
npm install
npm run dev      # local film
npm run build    # tsc --noEmit + vite build → dist/
```

Deploys to GitHub Pages on push to `main` (`.github/workflows/pages.yml` → `dist/`).
All 13 photographic assets in `public/images/` are in active use across the five acts.
