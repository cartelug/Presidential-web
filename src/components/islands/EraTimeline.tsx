import { useEffect, useRef } from 'react';
import { gsap, prefersReducedMotion } from '../../lib/motion';

interface Era {
  id: string;
  year: string;
  label: string;
  note: string;
}

interface Props {
  eras: Era[];
}

/**
 * Vertical scroll drives horizontal era progression (§7 Journey, §9).
 * Falls back to a plain stacked, unpinned layout under reduced motion —
 * every era's copy is always present in the DOM either way.
 */
export default function EraTimeline({ eras }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const wrap = wrapRef.current;
    const track = trackRef.current;
    if (!wrap || !track || prefersReducedMotion()) return;

    const distance = track.scrollWidth - wrap.clientWidth;
    if (distance <= 0) return;

    const tween = gsap.to(track, {
      x: -distance,
      ease: 'none',
      scrollTrigger: {
        trigger: wrap,
        start: 'top top',
        end: () => `+=${distance + wrap.clientWidth}`,
        scrub: true,
        pin: true,
        anticipatePin: 1,
      },
    });

    return () => {
      tween.scrollTrigger?.kill();
      tween.kill();
    };
  }, [eras.length]);

  return (
    <div className="era-timeline" ref={wrapRef} role="group" aria-roledescription="timeline" aria-label="Forty years in eras">
      <div className="era-track" ref={trackRef}>
        {eras.map((era) => (
          <article className="era-slide" key={era.id}>
            <p className="era-year data-numeral">{era.year}</p>
            <h3 className="era-label">{era.label}</h3>
            <p className="era-note">{era.note}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
