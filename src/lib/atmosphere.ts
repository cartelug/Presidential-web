/*
  The Living Archive — persistent atmosphere layer.

  One fixed, GPU-cheap canvas behind all content (z:-1). It renders slow-drifting
  radial gradient masses + a travelling gold light-leak, its palette lerping per
  chapter (dispatched by chapter-spy as a `chapter:change` event). Colours are
  interpolated in OKLab so gold→navy→cream transitions never pass through mud.

  Runs on the shared gsap.ticker (never a second rAF). Under prefers-reduced-motion
  it never starts — the static CSS gradient on `.atmosphere` is the fallback.
*/
import { gsap, prefersReducedMotion, getLenis } from './motion';

/* ---------- sRGB (hex) ↔ OKLab, per Björn Ottosson ---------- */
type Oklab = { L: number; a: number; b: number };

function srgbToLinear(c: number): number {
  const x = c / 255;
  return x <= 0.04045 ? x / 12.92 : Math.pow((x + 0.055) / 1.055, 2.4);
}
function linearToByte(c: number): number {
  const v = c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
  return Math.round(Math.max(0, Math.min(1, v)) * 255);
}
function hexToOklab(hex: string): Oklab {
  const h = hex.trim().replace('#', '');
  const r = srgbToLinear(parseInt(h.slice(0, 2), 16));
  const g = srgbToLinear(parseInt(h.slice(2, 4), 16));
  const b = srgbToLinear(parseInt(h.slice(4, 6), 16));
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b;
  const l_ = Math.cbrt(l), m_ = Math.cbrt(m), s_ = Math.cbrt(s);
  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}
function oklabToCss({ L, a, b }: Oklab, alpha = 1): string {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;
  const l = l_ ** 3, m = m_ ** 3, s = s_ ** 3;
  const r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const g = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const bl = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  return `rgba(${linearToByte(r)},${linearToByte(g)},${linearToByte(bl)},${alpha})`;
}
function lerpOklab(x: Oklab, y: Oklab, t: number): Oklab {
  return { L: x.L + (y.L - x.L) * t, a: x.a + (y.a - x.a) * t, b: x.b + (y.b - x.b) * t };
}

/* ---------- palette per chapter (real sectionIds → real tokens) ---------- */
type Pal = { base: Oklab; glow: Oklab; leak: Oklab };

function readToken(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

let dawn: Pal, noon: Pal, dusk: Pal;
function buildPalettes(): void {
  const navy = hexToOklab(readToken('--navy') || '#0b0e14');
  const obsidian = hexToOklab(readToken('--obsidian') || '#05070b');
  const cream = hexToOklab(readToken('--cream') || '#efe7d6');
  const gold = hexToOklab(readToken('--gold') || '#c9a227');
  const goldHi = hexToOklab(readToken('--gold-hi') || '#e4c368');
  const goldDeep = hexToOklab(readToken('--gold-deep') || '#a8851c');
  dawn = { base: navy, glow: gold, leak: goldHi };
  noon = { base: obsidian, glow: goldHi, leak: goldHi }; // film gate — darkest
  dusk = { base: cream, glow: goldDeep, leak: goldDeep }; // paper flip
}

const CHAPTER_PAL: Record<string, () => Pal> = {
  opening: () => dawn,
  inheritance: () => dawn,
  ledger: () => dusk,
  journey: () => dawn,
  achievements: () => dawn,
  regions: () => dawn,
  voices: () => dawn,
  pictures: () => noon,
  next: () => dawn,
  record: () => dusk,
};

let started = false;

export function initAtmosphere(): void {
  if (started) return;
  started = true;

  const root = document.querySelector<HTMLElement>('[data-atmosphere]');
  const canvas = root?.querySelector<HTMLCanvasElement>('.atmosphere__canvas');
  if (!root || !canvas) return;

  // Reduced-motion (or reduced-transparency): the static CSS gradient on
  // `.atmosphere` is the whole experience. Never start the loop.
  if (
    prefersReducedMotion() ||
    window.matchMedia('(prefers-reduced-transparency: reduce)').matches
  ) {
    canvas.style.display = 'none';
    return;
  }

  const ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) {
    canvas.style.display = 'none';
    return;
  }

  buildPalettes();

  let w = 0, h = 0, dpr = 1;
  function resize(): void {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth;
    h = window.innerHeight;
    canvas!.width = Math.round(w * dpr);
    canvas!.height = Math.round(h * dpr);
    canvas!.style.width = w + 'px';
    canvas!.style.height = h + 'px';
  }
  resize();
  window.addEventListener('resize', resize, { passive: true });

  // Current + target palette; target snaps on chapter change, current chases it.
  let cur: Pal = { ...dawn };
  let tgt: Pal = { ...dawn };
  document.addEventListener('chapter:change', (e) => {
    const id = (e as CustomEvent<{ id: string }>).detail?.id;
    const p = id && CHAPTER_PAL[id];
    if (p) tgt = p();
  });

  // Three drifting masses, each on its own slow Lissajous path.
  const blobs = [
    { ax: 0.30, ay: 0.22, fx: 0.017, fy: 0.023, px: 0.0, py: 1.1, r: 0.62 },
    { ax: 0.24, ay: 0.30, fx: 0.013, fy: 0.019, px: 2.1, py: 0.4, r: 0.5 },
    { ax: 0.20, ay: 0.18, fx: 0.021, fy: 0.015, px: 4.0, py: 3.2, r: 0.42 },
  ];

  let paused = false;
  document.addEventListener('visibilitychange', () => {
    paused = document.hidden;
  });

  function frame(time: number): void {
    if (paused) return;
    // ease current palette toward target (~cinematic feel)
    cur = {
      base: lerpOklab(cur.base, tgt.base, 0.04),
      glow: lerpOklab(cur.glow, tgt.glow, 0.04),
      leak: lerpOklab(cur.leak, tgt.leak, 0.04),
    };

    const lenis = getLenis();
    const vel = Math.min(Math.abs(lenis?.velocity ?? 0) / 40, 1); // 0..1 scroll energy

    ctx!.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx!.clearRect(0, 0, w, h);

    // base vertical wash
    const g = ctx!.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, oklabToCss(lerpOklab(cur.base, cur.glow, 0.06), 1));
    g.addColorStop(1, oklabToCss({ ...cur.base, L: cur.base.L * 0.82 }, 1));
    ctx!.fillStyle = g;
    ctx!.fillRect(0, 0, w, h);

    // drifting glow masses (additive)
    ctx!.globalCompositeOperation = 'lighter';
    const t = time * 0.001;
    const dim = Math.max(w, h);
    for (const b of blobs) {
      const cx = (0.5 + b.ax * Math.sin(t * b.fx * 6.283 + b.px)) * w;
      const cy = (0.42 + b.ay * Math.sin(t * b.fy * 6.283 + b.py)) * h;
      const rad = b.r * dim * (0.9 + vel * 0.25);
      const rg = ctx!.createRadialGradient(cx, cy, 0, cx, cy, rad);
      rg.addColorStop(0, oklabToCss(cur.glow, 0.1 + vel * 0.06));
      rg.addColorStop(1, oklabToCss(cur.glow, 0));
      ctx!.fillStyle = rg;
      ctx!.fillRect(0, 0, w, h);
    }

    // slow travelling light-leak
    const lp = (t * 0.05) % 1.4 - 0.2; // -0.2..1.2 across the viewport
    const lx = lp * w;
    const ly = h * 0.3;
    const lr = dim * 0.5;
    const lg = ctx!.createRadialGradient(lx, ly, 0, lx, ly, lr);
    lg.addColorStop(0, oklabToCss(cur.leak, 0.07));
    lg.addColorStop(1, oklabToCss(cur.leak, 0));
    ctx!.fillStyle = lg;
    ctx!.fillRect(0, 0, w, h);

    ctx!.globalCompositeOperation = 'source-over';
  }

  gsap.ticker.add(frame);
}
