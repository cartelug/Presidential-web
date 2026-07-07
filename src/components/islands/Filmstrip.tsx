import { useEffect, useRef, useState } from 'react';

interface Frame {
  id: string;
  frame: string;
  place: string;
  year: string;
  caption: string;
  src: string;
  srcMobile: string;
  alt: string;
}

interface Props {
  frames: Frame[];
}

const DRAG_THRESHOLD = 6; // px moved before a press counts as a drag (suppresses click)

export default function Filmstrip({ frames }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const frameRefs = useRef<(HTMLElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [lightbox, setLightbox] = useState<number | null>(null);

  const drag = useRef({ startX: 0, startScroll: 0, dragging: false, moved: 0, lastX: 0, vel: 0, lastT: 0 });
  const momentum = useRef<number | null>(null);

  // Continuous distance-to-center focus: centred frame is full, neighbours recede.
  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    const focus = (): void => {
      raf = 0;
      const rect = track.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      let best = 0;
      let bestDist = Infinity;
      frameRefs.current.forEach((el, i) => {
        if (!el) return;
        const r = el.getBoundingClientRect();
        const d = Math.abs(r.left + r.width / 2 - cx);
        const norm = Math.min(d / (rect.width / 2), 1); // 0 centred → 1 edge
        const scale = 1 - norm * 0.14;
        const opacity = 1 - norm * 0.5;
        const sat = 1 - norm * 0.7;
        el.style.setProperty('--focus-scale', scale.toFixed(3));
        el.style.setProperty('--focus-opacity', opacity.toFixed(3));
        el.style.setProperty('--focus-sat', sat.toFixed(3));
        if (d < bestDist) {
          bestDist = d;
          best = i;
        }
      });
      setActiveIndex(best);
    };
    const onScroll = (): void => {
      if (!raf) raf = requestAnimationFrame(focus);
    };
    focus();
    track.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    return () => {
      track.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [frames.length]);

  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === 'Escape') setLightbox(null);
      if (e.key === 'ArrowRight') setLightbox((v) => (v === null ? v : Math.min(v + 1, frames.length - 1)));
      if (e.key === 'ArrowLeft') setLightbox((v) => (v === null ? v : Math.max(v - 1, 0)));
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [lightbox, frames.length]);

  const scrollByFrame = (delta: number): void => {
    const target = frameRefs.current[Math.min(Math.max(activeIndex + delta, 0), frames.length - 1)];
    target?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  const stopMomentum = (): void => {
    if (momentum.current !== null) {
      cancelAnimationFrame(momentum.current);
      momentum.current = null;
    }
  };

  const startMomentum = (): void => {
    const track = trackRef.current;
    if (!track) return;
    let v = drag.current.vel;
    const step = (): void => {
      v *= 0.94; // friction
      track.scrollLeft -= v * 16;
      // rubber-band clamp at the ends
      if (track.scrollLeft <= 0 || track.scrollLeft >= track.scrollWidth - track.clientWidth) v *= 0.5;
      if (Math.abs(v) > 0.02) momentum.current = requestAnimationFrame(step);
      else momentum.current = null;
    };
    if (Math.abs(v) > 0.05) momentum.current = requestAnimationFrame(step);
  };

  return (
    <div className="filmstrip" role="region" aria-roledescription="carousel" aria-label="The national archive filmstrip">
      <div
        className="filmstrip-track"
        ref={trackRef}
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') scrollByFrame(1);
          if (e.key === 'ArrowLeft') scrollByFrame(-1);
        }}
        onPointerDown={(e) => {
          const track = trackRef.current;
          if (!track) return;
          stopMomentum();
          drag.current = {
            startX: e.clientX,
            startScroll: track.scrollLeft,
            dragging: true,
            moved: 0,
            lastX: e.clientX,
            vel: 0,
            lastT: performance.now(),
          };
          track.setPointerCapture(e.pointerId);
          track.classList.add('is-dragging');
        }}
        onPointerMove={(e) => {
          const track = trackRef.current;
          const d = drag.current;
          if (!track || !d.dragging) return;
          const dx = e.clientX - d.startX;
          d.moved = Math.max(d.moved, Math.abs(dx));
          track.scrollLeft = d.startScroll - dx;
          const now = performance.now();
          const dt = now - d.lastT || 16;
          d.vel = (e.clientX - d.lastX) / dt; // px per ms
          d.lastX = e.clientX;
          d.lastT = now;
        }}
        onPointerUp={(e) => {
          const track = trackRef.current;
          drag.current.dragging = false;
          track?.classList.remove('is-dragging');
          // A tap (negligible movement) opens the frame under the pointer. We do
          // this here rather than on figure.onClick because setPointerCapture on
          // the track redirects the click away from the figure.
          if (drag.current.moved <= DRAG_THRESHOLD) {
            const el = document.elementFromPoint(e.clientX, e.clientY) as Element | null;
            const fig = el?.closest('.filmstrip-frame');
            if (fig) {
              const idx = frameRefs.current.findIndex((f) => f === fig);
              if (idx !== -1) {
                setLightbox(idx);
                return;
              }
            }
          }
          startMomentum();
        }}
      >
        {frames.map((f, i) => (
          <figure
            key={f.id}
            ref={(el) => {
              frameRefs.current[i] = el;
            }}
            className={`filmstrip-frame${i === activeIndex ? ' is-active' : ''}`}
            role="button"
            tabIndex={0}
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${frames.length} — enlarge`}
            data-cursor-label="View"
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                setLightbox(i);
              }
            }}
          >
            <picture>
              <source media="(max-width: 720px)" srcSet={f.srcMobile} />
              <img src={f.src} alt={f.alt} loading={i === 0 ? 'eager' : 'lazy'} decoding="async" width={960} height={640} />
            </picture>
            <figcaption>
              <span className="frame-stamp data-numeral">
                {f.frame} · UGANDA · {f.year}
              </span>
              <span className="frame-caption">
                {f.place} · {f.caption}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="filmstrip-controls">
        <button type="button" onClick={() => scrollByFrame(-1)} aria-label="Previous frame">←</button>
        <p className="filmstrip-counter data-numeral">
          {String(activeIndex + 1).padStart(3, '0')} / {String(frames.length).padStart(3, '0')}
        </p>
        <button type="button" onClick={() => scrollByFrame(1)} aria-label="Next frame">→</button>
      </div>

      {lightbox !== null && (
        <div
          className="filmstrip-lightbox"
          role="dialog"
          aria-modal="true"
          aria-label={`${frames[lightbox].place} · ${frames[lightbox].caption}`}
          onClick={() => setLightbox(null)}
        >
          <button type="button" className="filmstrip-lightbox__close" aria-label="Close" onClick={() => setLightbox(null)}>
            ✕
          </button>
          <figure onClick={(e) => e.stopPropagation()}>
            <img src={frames[lightbox].src} alt={frames[lightbox].alt} decoding="async" />
            <figcaption>
              <span className="data-numeral">{frames[lightbox].frame} · UGANDA · {frames[lightbox].year}</span>
              <span>{frames[lightbox].place} · {frames[lightbox].caption}</span>
            </figcaption>
          </figure>
        </div>
      )}
    </div>
  );
}
