import '@fontsource-variable/fraunces';
import '@fontsource/schibsted-grotesk/400.css';
import '@fontsource/schibsted-grotesk/700.css';
import './styles.css';

import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import { LivingMap } from './map';
import { initGrain } from './grain';
import { NODES, SOURCES, VIEWBOX, CATEGORY_LABEL } from './data';

document.documentElement.classList.replace('no-js', 'js');

const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
const isMobile = matchMedia('(max-width: 900px)').matches;

/* Lenis's own default easing — exponential decay. Verified against the
   library's source earlier in this project; reused for every count-up so
   scroll and number share one physical feel. */
const lenisEase = (t: number): number => (t >= 1 ? 1 : 1.001 - Math.pow(2, -10 * t));

/* ============ SOURCES REGISTER (data-driven) ============ */
const sourceList = document.getElementById('sourceList')!;
for (const s of SOURCES) {
  const li = document.createElement('li');
  li.id = `src-${s.n}`;
  li.innerHTML = `<b>${s.n}</b><span></span>`;
  li.querySelector('span')!.textContent = s.body;
  sourceList.appendChild(li);
}

/* ============ EVIDENCE PANEL + WORKS REGISTER ============ */
const evKicker = document.getElementById('evKicker')!;
const evTitle = document.getElementById('evTitle')!;
const evProof = document.getElementById('evProof')!;
const evSrc = document.getElementById('evSrc') as HTMLAnchorElement;
const register = document.getElementById('register')!;

const byYear = NODES.map((n, i) => ({ n, i })).sort((a, b) => a.n.year - b.n.year);
let selected = byYear[byYear.length - 1].i;

const registerButtons: HTMLButtonElement[] = [];
for (const { n, i } of byYear) {
  const li = document.createElement('li');
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.setAttribute('aria-pressed', 'false');
  btn.innerHTML = `<span class="r-year">${n.year}</span><span class="r-label"></span><span class="r-meta">${CATEGORY_LABEL[n.category]} · ${n.region} region</span>`;
  btn.querySelector('.r-label')!.textContent = n.label;
  btn.addEventListener('click', () => select(i));
  li.appendChild(btn);
  register.appendChild(li);
  registerButtons[i] = btn;
}

function select(i: number): void {
  selected = i;
  const n = NODES[i];
  evKicker.textContent = `${CATEGORY_LABEL[n.category]} · ${n.region} · ${n.year}`;
  evTitle.textContent = n.label;
  evProof.textContent = n.proof;
  evSrc.href = `#src-${n.source}`;
  evSrc.textContent = `Source [${n.source}]`;
  registerButtons.forEach((b, j) => b.setAttribute('aria-pressed', j === i ? 'true' : 'false'));
  map?.setSelected(i);
  hitButtons.forEach((b, j) => b.classList.toggle('on', j === i));
}

function step(dir: 1 | -1): void {
  const pos = byYear.findIndex((e) => e.i === selected);
  const next = byYear[(pos + dir + byYear.length) % byYear.length];
  select(next.i);
}
document.getElementById('evPrev')!.addEventListener('click', () => step(-1));
document.getElementById('evNext')!.addEventListener('click', () => step(1));

/* ============ THE LIVING MAP ============ */
const mapCanvas = document.getElementById('mapCanvas') as HTMLCanvasElement;
const mapStage = document.getElementById('mapStage')!;
const mapHits = document.getElementById('mapHits')!;
let map: LivingMap | null = null;
const hitButtons: HTMLButtonElement[] = [];

try {
  map = new LivingMap(mapCanvas, reduced);
} catch {
  /* canvas unavailable — the register below remains the full record */
}

if (map) {
  mapHits.style.pointerEvents = 'none';
  NODES.forEach((n, i) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'map-hit';
    b.setAttribute('aria-label', `${n.label} — ${n.region} region, ${n.year}`);
    b.style.left = `${(n.x / VIEWBOX.w) * 100}%`;
    b.style.top = `${(n.y / VIEWBOX.h) * 100}%`;
    b.addEventListener('click', () => select(i));
    mapHits.appendChild(b);
    hitButtons[i] = b;
  });

  const placeHits = (): void => {
    const r = map!.getContentRect();
    const c = mapCanvas.getBoundingClientRect();
    const s = mapStage.getBoundingClientRect();
    mapHits.style.left = `${c.left - s.left + r.left}px`;
    mapHits.style.top = `${c.top - s.top + r.top}px`;
    mapHits.style.width = `${r.width}px`;
    mapHits.style.height = `${r.height}px`;
  };
  placeHits();
  addEventListener('resize', () => {
    map!.resize();
    placeHits();
  }, { passive: true });
}

/* Ignition bookkeeping: which lights are on, for hit-targets + auto-advance. */
const yearEl = document.getElementById('lightYear')!;
let lastLit = -1;
function applyIgnition(p: number): void {
  map?.setProgress(p);
  const year = Math.round(1986 + p * (2026 - 1986));
  yearEl.textContent = String(year);
  let litCount = 0;
  byYear.forEach(({ n, i }, order) => {
    const lit = n.year <= year;
    hitButtons[i]?.classList.toggle('lit', lit);
    if (lit) litCount = order + 1;
  });
  if (litCount > 0 && litCount - 1 !== lastLit) {
    lastLit = litCount - 1;
    select(byYear[lastLit].i);
  }
}

/* ============ GRAIN ============ */
initGrain(document.getElementById('grainCanvas') as HTMLCanvasElement, reduced);

/* ============ COUNT-UPS ============ */
function animateCount(el: HTMLElement): void {
  if (el.dataset.done) return;
  el.dataset.done = '1';
  const to = parseFloat(el.dataset.to!);
  const suffix = el.dataset.suffix ?? '';
  const final = () => { el.textContent = to.toLocaleString('en-US') + suffix; };
  if (reduced) { final(); return; }
  const t0 = performance.now();
  const dur = 1400;
  const tick = (now: number): void => {
    const p = Math.min((now - t0) / dur, 1);
    el.textContent = Math.round(to * lenisEase(p)).toLocaleString('en-US') + suffix;
    if (p < 1) requestAnimationFrame(tick);
    else final();
  };
  requestAnimationFrame(tick);
}
const countIO = new IntersectionObserver((es) => {
  es.forEach((e) => {
    if (e.isIntersecting) {
      animateCount(e.target as HTMLElement);
      countIO.unobserve(e.target);
    }
  });
}, { threshold: 0.6 });
document.querySelectorAll<HTMLElement>('.count[data-to]').forEach((el) => countIO.observe(el));

/* ============ SKY + ACT TRACKER ============ */
const skyLayers = new Map<string, HTMLElement>();
document.querySelectorAll<HTMLElement>('.sky-layer').forEach((l) => skyLayers.set(l.dataset.sky!, l));
function setSky(name: string): void {
  skyLayers.forEach((layer, key) => { layer.style.opacity = key === name ? '1' : '0'; });
}
const ACTS: { sel: string; act: string; label: string }[] = [
  { sel: '#darkness', act: '1', label: 'Act I · Darkness' },
  { sel: '#turn', act: '2', label: 'Act II · The Turn' },
  { sel: '#work', act: '3', label: 'Act III · The Work' },
  { sel: '#light, .act-register', act: '4', label: 'Act IV · The Light' },
  { sel: '#address', act: '5', label: 'Act V · The Address' },
];
const creditAct = document.getElementById('creditAct')!;

/* ============ REDUCED MOTION / NO-PIN PATH ============ */
if (reduced) {
  document.body.classList.add('lit');
  document.body.dataset.act = '4';
  setSky('gold');
  applyIgnition(1);
  select(byYear[byYear.length - 1].i);
  const skyIO = new IntersectionObserver((es) => {
    es.forEach((e) => {
      if (!e.isIntersecting) return;
      const sky = (e.target as HTMLElement).dataset.sky;
      if (sky) setSky(sky);
      const act = ACTS.find((a) => (e.target as HTMLElement).matches(a.sel));
      if (act) { document.body.dataset.act = act.act; creditAct.textContent = act.label; }
    });
  }, { rootMargin: '-40% 0px -40% 0px' });
  document.querySelectorAll<HTMLElement>('[data-sky]').forEach((s) => { if (!s.classList.contains('sky-layer')) skyIO.observe(s); });
} else {
  /* ============ THE FILM (full motion) ============ */
  gsap.registerPlugin(ScrollTrigger);

  const lenis = new Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);

  /* Sky + act tracking driven by section proximity. Windows are deliberately
     tight (40%) so the dawn never bleeds into Act IV's pinned ignition. */
  document.querySelectorAll<HTMLElement>('main [data-sky]').forEach((section) => {
    ScrollTrigger.create({
      trigger: section,
      start: 'top 40%',
      end: 'bottom 40%',
      onToggle: (self) => { if (self.isActive) setSky(section.dataset.sky!); },
    });
  });
  ACTS.forEach(({ sel, act, label }) => {
    document.querySelectorAll(sel).forEach((section) => {
      ScrollTrigger.create({
        trigger: section,
        start: 'top 40%',
        end: 'bottom 40%',
        onToggle: (self) => {
          if (self.isActive) { document.body.dataset.act = act; creditAct.textContent = label; }
        },
      });
    });
  });

  /* --- ACT I · cold open ---
     The year burns in on its own the moment the film starts (a cold open
     never waits for the audience); only the figures + exit ride the scrub. */
  gsap.from('.year-mark', { opacity: 0, filter: 'brightness(3) blur(12px)', duration: 1.8, ease: 'power2.out', delay: 0.25 });
  gsap.from('.lightline', { scaleX: 0, transformOrigin: 'left center', duration: 1.4, ease: 'power3.out', delay: 0.45 });
  const act1 = gsap.timeline({
    scrollTrigger: {
      trigger: '#darkness',
      start: 'top top',
      end: `+=${isMobile ? 140 : 200}%`,
      pin: '.act-darkness .pinbox',
      scrub: 0.6,
    },
  });
  act1
    .from('.ruin-figures li', { opacity: 0, y: 34, stagger: 0.08, duration: 0.26 }, 0.1)
    .from('.ruin-line', { opacity: 0, y: 20, duration: 0.2 }, 0.52)
    .to('.darkness-inner', { opacity: 0.25, y: -50, duration: 0.2 }, 0.84);

  /* --- ACT II · title sequence --- */
  gsap.set('#portrait', { clipPath: 'inset(100% 0% 0% 0%)', filter: 'brightness(0.1) saturate(0)' });
  gsap.set('.film-title .w', { yPercent: 112, rotate: 3 });
  gsap.set('.thesis, .byline', { opacity: 0, y: 24 });
  const act2 = gsap.timeline({
    scrollTrigger: {
      trigger: '#turn',
      start: 'top top',
      end: `+=${isMobile ? 170 : 240}%`,
      pin: '.act-turn .pinbox',
      scrub: 0.6,
      onEnter: () => document.body.classList.add('lit'),
    },
  });
  act2
    .to('#portrait', { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.4 })
    .to('#portrait', { filter: 'brightness(1) saturate(0.94)', duration: 0.42 }, 0.14)
    .to('.film-title .w', { yPercent: 0, rotate: 0, stagger: 0.07, duration: 0.34, ease: 'power2.out' }, 0.3)
    .to('.thesis', { opacity: 1, y: 0, duration: 0.16 }, 0.68)
    .to('.byline', { opacity: 1, y: 0, duration: 0.14 }, 0.78)
    .to('.scroll-cue', { opacity: 0.9, duration: 0.1 }, 0.85);
  gsap.set('.scroll-cue', { opacity: 0 });

  /* --- ACT III · era reveals --- */
  document.querySelectorAll<HTMLElement>('.era').forEach((era) => {
    const els = era.querySelectorAll('.era-year, .era-copy h3, .era-claim, .era-figure');
    gsap.set(els, { opacity: 0, y: 40 });
    gsap.set(era.querySelector('.era-media'), { opacity: 0, y: 60 });
    ScrollTrigger.create({
      trigger: era,
      start: 'top 72%',
      once: true,
      onEnter: () => {
        gsap.to(era.querySelector('.era-media'), { opacity: 1, y: 0, duration: 1.1, ease: 'power3.out' });
        gsap.to(els, { opacity: 1, y: 0, stagger: 0.09, duration: 0.8, ease: 'power3.out', clearProps: 'transform' });
      },
    });
  });

  /* --- Lerped parallax on [data-speed] media (Lenis-matched lerp 0.1) --- */
  const pEls = [...document.querySelectorAll<HTMLElement>('[data-speed]')].map((el) => ({
    el, speed: parseFloat(el.dataset.speed!), cur: 0, tgt: 0,
  }));
  const updateTargets = (): void => {
    const vh = innerHeight;
    for (const p of pEls) {
      const root = p.el.closest<HTMLElement>('[data-speed-root]') ?? p.el;
      const r = root.getBoundingClientRect();
      p.tgt = -(r.top + r.height / 2 - vh / 2) * p.speed;
    }
  };
  addEventListener('scroll', updateTargets, { passive: true });
  addEventListener('resize', updateTargets, { passive: true });
  updateTargets();
  gsap.ticker.add(() => {
    for (const p of pEls) {
      p.cur += (p.tgt - p.cur) * 0.1;
      p.el.style.setProperty('--py', `${p.cur.toFixed(2)}px`);
    }
  });

  /* --- ACT IV · the ignition --- */
  const mapIn = gsap.timeline({
    scrollTrigger: {
      trigger: '#light',
      start: 'top top',
      end: `+=${isMobile ? 260 : 380}%`,
      pin: '.act-light .pinbox',
      scrub: 0.6,
      onUpdate: (self) => {
        // 0–0.2: map travels to centre stage · 0.2–0.95: ignition sweep
        const sweep = Math.min(1, Math.max(0, (self.progress - 0.2) / 0.75));
        applyIgnition(0.1 + sweep * 0.9);
      },
      onLeave: () => applyIgnition(1),
    },
  });
  mapIn.to('.map-stage', {
    x: 0,
    scale: isMobile ? 1 : 1.06,
    opacity: 1,
    duration: 0.2,
    ease: 'power2.inOut',
  }, 0);

  /* Baseline: pre-ignition embers while Acts I–III play out */
  applyIgnition(0.1);

  /* --- ACT V · address reveals --- */
  const addressReveals: [string, number][] = [
    ['.address-copy .eyebrow', 0],
    ['.address-copy h2', 0.06],
    ['.address-lead', 0.12],
  ];
  gsap.set(addressReveals.map(([s]) => s), { opacity: 0, y: 36 });
  ScrollTrigger.create({
    trigger: '.address-copy',
    start: 'top 74%',
    once: true,
    onEnter: () => {
      addressReveals.forEach(([sel, delay]) => {
        gsap.to(sel, { opacity: 1, y: 0, duration: 0.9, delay, ease: 'power3.out' });
      });
    },
  });
  const lateReveals = ['.next-chapter', '.signature', '.sources'];
  lateReveals.forEach((sel) => {
    gsap.set(sel, { opacity: 0, y: 44 });
    ScrollTrigger.create({
      trigger: sel,
      start: 'top 80%',
      once: true,
      onEnter: () => gsap.to(sel, { opacity: 1, y: 0, duration: 1, ease: 'power3.out' }),
    });
  });

  /* Anchor links (sources, skip) work with Lenis */
  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((a) => {
    a.addEventListener('click', (e) => {
      const target = document.querySelector(a.getAttribute('href')!);
      if (!target) return;
      e.preventDefault();
      lenis.scrollTo(target as HTMLElement, { offset: -20 });
    });
  });

  /* The sky/act triggers above are created before the pin timelines, so their
     start positions were computed without the pins' spacer heights. Sorting
     the refresh order and re-measuring once everything exists is the
     documented cure for out-of-creation-order pins. */
  ScrollTrigger.sort();
  ScrollTrigger.refresh();
}

/* Initial selection for the evidence panel */
select(byYear[byYear.length - 1].i);
