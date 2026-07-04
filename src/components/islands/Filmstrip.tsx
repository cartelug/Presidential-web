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

export default function Filmstrip({ frames }: Props) {
  const trackRef = useRef<HTMLDivElement>(null);
  const frameRefs = useRef<(HTMLElement | null)[]>([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const drag = useRef<{ startX: number; startScroll: number; dragging: boolean }>({
    startX: 0,
    startScroll: 0,
    dragging: false,
  });

  useEffect(() => {
    const track = trackRef.current;
    if (!track || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const mostVisible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (mostVisible) {
          const idx = frameRefs.current.findIndex((el) => el === mostVisible.target);
          if (idx !== -1) setActiveIndex(idx);
        }
      },
      { root: track, threshold: [0.6] }
    );

    frameRefs.current.forEach((el) => el && observer.observe(el));
    return () => observer.disconnect();
  }, [frames.length]);

  const scrollByFrame = (delta: number) => {
    const target = frameRefs.current[Math.min(Math.max(activeIndex + delta, 0), frames.length - 1)];
    target?.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
  };

  return (
    <div
      className="filmstrip"
      role="region"
      aria-roledescription="carousel"
      aria-label="The national archive filmstrip"
    >
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
          drag.current = { startX: e.clientX, startScroll: track.scrollLeft, dragging: true };
          track.setPointerCapture(e.pointerId);
        }}
        onPointerMove={(e) => {
          const track = trackRef.current;
          if (!track || !drag.current.dragging) return;
          track.scrollLeft = drag.current.startScroll - (e.clientX - drag.current.startX);
        }}
        onPointerUp={() => {
          drag.current.dragging = false;
        }}
      >
        {frames.map((f, i) => (
          <figure
            key={f.id}
            ref={(el) => {
              frameRefs.current[i] = el;
            }}
            className={`filmstrip-frame${i === activeIndex ? ' is-active' : ''}`}
            role="group"
            aria-roledescription="slide"
            aria-label={`${i + 1} of ${frames.length}`}
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
    </div>
  );
}
