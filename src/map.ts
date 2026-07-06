import { NODES, UGANDA_PATH, LAKE_PATH, VIEWBOX } from './data';

/**
 * THE LIVING MAP — Uganda's silhouette as a canvas of light.
 *
 * Starts as a dark outline (1986). As `progress` advances, evidence points
 * ignite in year order; by progress 1 the nation is a constellation. The
 * canvas is purely visual (aria-hidden); interaction happens on DOM buttons
 * positioned by the same fit math via getContentRect(), so keyboard and
 * screen-reader users get first-class access rather than a canvas hit-test.
 */

interface NodeState {
  threshold: number; // progress at which this node ignites
  lit: number;       // eased 0..1 ignition amount
  phase: number;     // per-node flicker phase
}

const IGNITE_START = 0.06;
const IGNITE_END = 0.94;
const FADE = 0.07; // progress-width of one node's ignition ramp

function smoothstep(t: number): number {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

export class LivingMap {
  private ctx: CanvasRenderingContext2D;
  private outline = new Path2D(UGANDA_PATH);
  private lake = new Path2D(LAKE_PATH);
  private nodes: NodeState[];
  private progress = 0;
  private selected = -1;
  private raf = 0;
  private last = 0;
  private time = 0;
  private fit = { scale: 1, ox: 0, oy: 0 };
  private reduced: boolean;

  constructor(private canvas: HTMLCanvasElement, reducedMotion: boolean) {
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('canvas 2d unavailable');
    this.ctx = ctx;
    this.reduced = reducedMotion;

    // Ignition thresholds: year order, spread across the sweep window.
    const years = NODES.map((n) => n.year);
    const min = Math.min(...years);
    const max = Math.max(...years);
    this.nodes = NODES.map((n, i) => ({
      threshold: IGNITE_START + ((n.year - min) / (max - min)) * (IGNITE_END - IGNITE_START - FADE),
      lit: 0,
      phase: i * 1.7,
    }));

    this.resize();
    if (this.reduced) {
      this.progress = 1;
      this.nodes.forEach((n) => (n.lit = 1));
      this.draw(); // single static frame
    } else {
      this.raf = requestAnimationFrame((t) => this.loop(t));
    }
  }

  setProgress(p: number): void {
    this.progress = Math.min(1, Math.max(0, p));
    if (this.reduced) this.draw();
  }

  setSelected(i: number): void {
    this.selected = i;
    if (this.reduced) this.draw();
  }

  /** How many nodes are currently ≥90% lit (drives the evidence auto-advance). */
  litCount(): number {
    return this.nodes.filter((n) => n.lit > 0.9).length;
  }

  /** The fitted content rect of the 480×460 viewBox inside the canvas, in CSS px. */
  getContentRect(): { left: number; top: number; width: number; height: number } {
    const { scale, ox, oy } = this.fit;
    return { left: ox, top: oy, width: VIEWBOX.w * scale, height: VIEWBOX.h * scale };
  }

  resize(): void {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const w = this.canvas.clientWidth;
    const h = this.canvas.clientHeight;
    if (!w || !h) return;
    this.canvas.width = w * dpr;
    this.canvas.height = h * dpr;
    const pad = Math.min(w, h) * 0.06;
    const scale = Math.min((w - pad * 2) / VIEWBOX.w, (h - pad * 2) / VIEWBOX.h);
    this.fit = { scale, ox: (w - VIEWBOX.w * scale) / 2, oy: (h - VIEWBOX.h * scale) / 2 };
    if (this.reduced) this.draw();
  }

  destroy(): void {
    cancelAnimationFrame(this.raf);
  }

  private loop(t: number): void {
    this.raf = requestAnimationFrame((n) => this.loop(n));
    if (t - this.last < 33) return; // ~30fps is plenty for embers
    this.time = t / 1000;
    this.last = t;
    // ease each node toward its target ignition
    for (const n of this.nodes) {
      const target = smoothstep((this.progress - n.threshold) / FADE);
      n.lit += (target - n.lit) * 0.08;
    }
    this.draw();
  }

  private draw(): void {
    const { ctx, canvas } = this;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, canvas.clientWidth, canvas.clientHeight);

    const { scale, ox, oy } = this.fit;
    ctx.save();
    ctx.translate(ox, oy);
    ctx.scale(scale, scale);

    const p = this.progress;

    // Land: near-invisible in darkness, warms as the record fills in.
    ctx.fillStyle = `rgba(201, 151, 59, ${0.02 + p * 0.05})`;
    ctx.fill(this.outline);

    // Lake Victoria — a held breath of cool against the embers.
    ctx.fillStyle = `rgba(58, 84, 110, ${0.10 + p * 0.14})`;
    ctx.fill(this.lake);

    // The border, drawn like a filament catching current.
    ctx.lineWidth = 1.5 / scale + 0.9;
    ctx.strokeStyle = `rgba(232, 192, 106, ${0.22 + p * 0.5})`;
    ctx.shadowColor = 'rgba(201, 151, 59, 0.55)';
    ctx.shadowBlur = 6 + p * 14;
    ctx.stroke(this.outline);
    ctx.shadowBlur = 0;

    // Evidence lights.
    NODES.forEach((node, i) => {
      const s = this.nodes[i];
      if (s.lit <= 0.005) return;
      const flicker = this.reduced ? 1 : 0.86 + 0.14 * Math.sin(this.time * 2.1 + s.phase);
      const a = s.lit * flicker;
      const r = 3 + s.lit * 5;

      const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 4.5);
      glow.addColorStop(0, `rgba(232, 192, 106, ${0.55 * a})`);
      glow.addColorStop(0.4, `rgba(201, 151, 59, ${0.22 * a})`);
      glow.addColorStop(1, 'rgba(201, 151, 59, 0)');
      ctx.fillStyle = glow;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r * 4.5, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = `rgba(255, 242, 214, ${0.95 * a})`;
      ctx.beginPath();
      ctx.arc(node.x, node.y, r * 0.55, 0, Math.PI * 2);
      ctx.fill();

      if (i === this.selected) {
        const ring = 10 + (this.reduced ? 0 : Math.sin(this.time * 3) * 1.5);
        ctx.lineWidth = 1.4 / scale + 0.6;
        ctx.strokeStyle = `rgba(255, 242, 214, ${0.9 * Math.max(a, 0.4)})`;
        ctx.beginPath();
        ctx.arc(node.x, node.y, ring, 0, Math.PI * 2);
        ctx.stroke();
      }
    });

    ctx.restore();
  }
}
