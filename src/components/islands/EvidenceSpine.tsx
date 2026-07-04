import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger, prefersReducedMotion } from '../../lib/motion';

interface Props {
  /** Section ids in document order, used to place nodes along the spine. */
  sectionIds: string[];
}

const PATH_LENGTH = 1000;

/**
 * The gold transformation spine (§9 signature motion). A single fixed SVG
 * path whose stroke-dashoffset is scrubbed linearly to whole-page scroll
 * progress; a node per chapter brightens as its section becomes active.
 * Fully decorative — aria-hidden — and statically fully-drawn under
 * prefers-reduced-motion.
 */
export default function EvidenceSpine({ sectionIds }: Props) {
  const pathRef = useRef<SVGPathElement>(null);
  const nodeRefs = useRef<(SVGCircleElement | null)[]>([]);
  const reduced = useRef(prefersReducedMotion());

  useEffect(() => {
    const path = pathRef.current;
    if (!path) return;

    if (reduced.current) {
      path.style.strokeDashoffset = '0';
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
        },
      }
    );

    const nodeTriggers = sectionIds.map((id, i) => {
      const section = document.getElementById(id);
      const node = nodeRefs.current[i];
      if (!section || !node) return null;
      return ScrollTrigger.create({
        trigger: section,
        start: 'top center',
        end: 'bottom center',
        onEnter: () => gsap.to(node, { scale: 1.25, duration: 0.3, transformOrigin: 'center' }),
        onLeave: () => gsap.to(node, { scale: 1, duration: 0.3, transformOrigin: 'center' }),
        onEnterBack: () => gsap.to(node, { scale: 1.25, duration: 0.3, transformOrigin: 'center' }),
        onLeaveBack: () => gsap.to(node, { scale: 1, duration: 0.3, transformOrigin: 'center' }),
      });
    });

    return () => {
      scrubTween.scrollTrigger?.kill();
      scrubTween.kill();
      nodeTriggers.forEach((t) => t?.kill());
    };
  }, [sectionIds]);

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
        stroke="var(--gold)"
        strokeWidth={1.5}
        fill="none"
        vectorEffect="non-scaling-stroke"
      />
      {sectionIds.map((id, i) => (
        <circle
          key={id}
          ref={(el) => {
            nodeRefs.current[i] = el;
          }}
          cx={12}
          cy={((i + 0.5) / sectionIds.length) * PATH_LENGTH}
          r={4}
          fill="var(--gold)"
        />
      ))}
    </svg>
  );
}
