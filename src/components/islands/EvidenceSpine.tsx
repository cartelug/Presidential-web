import { useEffect, useRef, useState } from 'react';
import { gsap, ScrollTrigger, prefersReducedMotion, getLenis } from '../../lib/motion';

interface Props {
  /** Section ids in document order, used to place nodes along the spine. */
  sectionIds: string[];
}

const PATH_LENGTH = 1000;

/**
 * The gold transformation spine — the site's signature minimap. Its stroke is a
 * gradient that draws + thickens with page progress, a glowing head rides the
 * drawn tip, and each node sits at its section's *real document position* (not
 * array index). Node active state is driven by the shared `chapter:change`
 * event, so the spine, the atmosphere and the nav all agree. Nodes are
 * clickable (smooth-scroll). Statically fully-drawn under reduced motion.
 */
export default function EvidenceSpine({ sectionIds }: Props) {
  const pathRef = useRef<SVGPathElement>(null);
  const headRef = useRef<SVGCircleElement>(null);
  const nodeRefs = useRef<(SVGCircleElement | null)[]>([]);
  const reduced = useRef(prefersReducedMotion());
  // Fractions (0..1) of each node's document position; measured after mount.
  const [pos, setPos] = useState<number[]>(() => sectionIds.map((_, i) => (i + 0.5) / sectionIds.length));

  // Measure real document positions so the progress marker doesn't lie.
  useEffect(() => {
    const measure = (): void => {
      const total = document.documentElement.scrollHeight || 1;
      setPos(
        sectionIds.map((id) => {
          const el = document.getElementById(id);
          if (!el) return 0;
          const top = el.getBoundingClientRect().top + window.scrollY;
          return Math.min(Math.max((top + el.offsetHeight / 2) / total, 0), 1);
        })
      );
    };
    measure();
    window.addEventListener('resize', measure, { passive: true });
    const onRefresh = (): void => measure();
    ScrollTrigger.addEventListener('refresh', onRefresh);
    return () => {
      window.removeEventListener('resize', measure);
      ScrollTrigger.removeEventListener('refresh', onRefresh);
    };
  }, [sectionIds]);

  useEffect(() => {
    const path = pathRef.current;
    const head = headRef.current;
    if (!path) return;

    if (reduced.current) {
      path.style.strokeDashoffset = '0';
      if (head) head.style.opacity = '0';
      return;
    }

    path.style.strokeDasharray = `${PATH_LENGTH}`;
    path.style.strokeDashoffset = `${PATH_LENGTH}`;

    const main = document.getElementById('main');
    if (!main) return;

    const scrubTween = gsap.fromTo(
      path,
      { strokeDashoffset: PATH_LENGTH },
      {
        strokeDashoffset: 0,
        ease: 'none',
        scrollTrigger: {
          trigger: main,
          start: 'top top',
          end: 'bottom bottom',
          scrub: true,
          onUpdate: (self) => {
            const p = self.progress;
            path.style.strokeWidth = `${1.2 + p * 1.6}`; // thickens as eras pass
            if (head) {
              head.setAttribute('cy', `${p * PATH_LENGTH}`);
              head.style.opacity = p > 0.005 && p < 0.995 ? '1' : '0';
            }
          },
        },
      }
    );

    // Unify with chapter-spy: brighten the node for the active chapter.
    const onChapter = (e: Event): void => {
      const id = (e as CustomEvent<{ id: string }>).detail?.id;
      const idx = sectionIds.indexOf(id ?? '');
      nodeRefs.current.forEach((node, i) => {
        if (!node) return;
        const active = i === idx;
        gsap.to(node, {
          scale: active ? 1.9 : 1,
          duration: 0.35,
          transformOrigin: 'center',
          overwrite: true,
        });
        node.setAttribute('fill', active ? 'var(--gold-hi)' : 'var(--gold)');
        node.style.filter = active ? 'url(#spine-glow)' : 'none';
      });
    };
    document.addEventListener('chapter:change', onChapter);

    return () => {
      scrubTween.scrollTrigger?.kill();
      scrubTween.kill();
      document.removeEventListener('chapter:change', onChapter);
    };
  }, [sectionIds]);

  const scrollTo = (id: string): void => {
    const el = document.getElementById(id);
    if (!el) return;
    const lenis = getLenis();
    if (lenis) lenis.scrollTo(el, { offset: -80 });
    else el.scrollIntoView({ behavior: reduced.current ? 'auto' : 'smooth' });
  };

  return (
    <svg
      className="evidence-spine"
      aria-hidden="true"
      viewBox={`0 0 24 ${PATH_LENGTH}`}
      preserveAspectRatio="none"
      style={{
        position: 'fixed',
        right: 'clamp(12px, 3vw, 40px)',
        top: 0,
        height: '100dvh',
        width: '24px',
        zIndex: 'var(--z-spine)' as unknown as number,
        pointerEvents: 'none',
      }}
    >
      <defs>
        <linearGradient id="spine-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--gold-deep)" />
          <stop offset="0.5" stopColor="var(--gold)" />
          <stop offset="1" stopColor="var(--gold-hi)" />
        </linearGradient>
        <filter id="spine-glow" x="-300%" y="-300%" width="700%" height="700%">
          <feGaussianBlur stdDeviation="2.4" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>
      <path
        d={`M12,0 L12,${PATH_LENGTH}`}
        stroke="var(--line)"
        strokeWidth={1}
        fill="none"
        vectorEffect="non-scaling-stroke"
      />
      <path
        ref={pathRef}
        d={`M12,0 L12,${PATH_LENGTH}`}
        stroke="url(#spine-grad)"
        strokeWidth={1.5}
        fill="none"
        vectorEffect="non-scaling-stroke"
      />
      <circle
        ref={headRef}
        cx={12}
        cy={0}
        r={3}
        fill="var(--gold-hi)"
        style={{ opacity: 0, filter: 'url(#spine-glow)' }}
      />
      {sectionIds.map((id, i) => (
        <circle
          key={id}
          ref={(el) => {
            nodeRefs.current[i] = el;
          }}
          cx={12}
          cy={pos[i] * PATH_LENGTH}
          r={4}
          fill="var(--gold)"
          style={{ pointerEvents: 'auto', cursor: 'pointer' }}
          onClick={() => scrollTo(id)}
        />
      ))}
    </svg>
  );
}
