/**
 * Animated film grain — a 144px noise tile regenerated at ~6fps and pattern-
 * filled across the viewport. Reduced-motion gets a single static frame; the
 * texture stays (it is part of the film's material), only the shimmer stops.
 */
export function initGrain(canvas: HTMLCanvasElement, reducedMotion: boolean): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  const TILE = 144;
  const tile = document.createElement('canvas');
  tile.width = TILE;
  tile.height = TILE;
  const tctx = tile.getContext('2d');
  if (!tctx) return;

  function regenerate(): void {
    const img = tctx!.createImageData(TILE, TILE);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      d[i] = v;
      d[i + 1] = v;
      d[i + 2] = v;
      d[i + 3] = 26; // ~10% alpha inside the tile; layer opacity does the rest
    }
    tctx!.putImageData(img, 0, 0);
  }

  function resize(): void {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    paint();
  }

  function paint(): void {
    regenerate();
    const pattern = ctx!.createPattern(tile, 'repeat');
    if (!pattern) return;
    ctx!.clearRect(0, 0, canvas.width, canvas.height);
    ctx!.fillStyle = pattern;
    ctx!.fillRect(0, 0, canvas.width, canvas.height);
  }

  window.addEventListener('resize', resize, { passive: true });
  resize();

  if (!reducedMotion) {
    setInterval(() => {
      if (!document.hidden) paint();
    }, 166);
  }
}
