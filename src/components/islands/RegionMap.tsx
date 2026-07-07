import { useEffect, useMemo, useRef, useState } from 'react';
import { gsap, ScrollTrigger, durations, prefersReducedMotion } from '../../lib/motion';

interface Region {
  id: string;
  name: string;
  x: number;
  y: number;
  story: string;
  themes: string[];
}

interface Props {
  regions: Region[];
}

const HUB = { x: 50, y: 45 };

/** Simplified, stylized Uganda outline (editorial map, not surveyed borders). */
const UGANDA_OUTLINE =
  'M18,12 L42,7 L62,9 L80,17 L88,30 L82,42 L86,52 L76,58 L72,68 ' +
  'L58,76 L44,79 L30,75 L20,68 L12,58 L15,44 L9,32 L14,20 Z';

export default function RegionMap({ regions }: Props) {
  const svgRef = useRef<SVGSVGElement>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const [theme, setTheme] = useState<string | null>(null);
  const active = regions.find((r) => r.id === activeId) ?? null;

  const themes = useMemo(
    () => Array.from(new Set(regions.flatMap((r) => r.themes))).sort(),
    [regions]
  );

  const matchesTheme = (r: Region): boolean => !theme || r.themes.includes(theme);

  useEffect(() => {
    const svg = svgRef.current;
    if (!svg || prefersReducedMotion()) return;
    const lines = svg.querySelectorAll<SVGLineElement>('[data-connect-line]');
    lines.forEach((line) => {
      const length = line.getTotalLength ? line.getTotalLength() : 100;
      line.style.strokeDasharray = `${length}`;
      line.style.strokeDashoffset = `${length}`;
    });

    const trigger = ScrollTrigger.create({
      trigger: svg,
      start: 'top 75%',
      once: true,
      onEnter: () => {
        gsap.to(lines, {
          strokeDashoffset: 0,
          duration: durations.slow,
          ease: 'power2.out',
          stagger: 0.08,
        });
      },
    });

    return () => trigger.kill();
  }, [regions.length]);

  const spotlit = hoverId ?? activeId;

  return (
    <div className="region-map">
      {themes.length > 0 && (
        <ul className="region-themes" role="group" aria-label="Filter regions by theme">
          <li>
            <button
              type="button"
              className="region-chip"
              aria-pressed={theme === null}
              onClick={() => setTheme(null)}
            >
              All
            </button>
          </li>
          {themes.map((t) => (
            <li key={t}>
              <button
                type="button"
                className="region-chip"
                aria-pressed={theme === t}
                onClick={() => setTheme(theme === t ? null : t)}
              >
                {t}
              </button>
            </li>
          ))}
        </ul>
      )}

      <svg ref={svgRef} className="region-map-svg" viewBox="0 0 100 100" aria-hidden="true">
        <path d={UGANDA_OUTLINE} fill="var(--navy-raised)" stroke="var(--line)" strokeWidth={0.6} />
        {regions.map((r) => {
          const lit = spotlit === r.id;
          const dim = (theme && !matchesTheme(r)) || (spotlit && spotlit !== r.id && matchesTheme(r) === false);
          return (
            <line
              key={`line-${r.id}`}
              data-connect-line
              x1={HUB.x}
              y1={HUB.y}
              x2={r.x}
              y2={r.y}
              stroke={lit ? 'var(--gold-hi)' : 'var(--gold)'}
              strokeOpacity={dim ? 0.12 : lit ? 0.8 : 0.35}
              strokeWidth={lit ? 0.6 : 0.4}
              style={{ transition: 'stroke-opacity .3s, stroke .3s, stroke-width .3s' }}
            />
          );
        })}
        {regions.map((r) => {
          const lit = spotlit === r.id;
          const off = theme ? !matchesTheme(r) : false;
          return (
            <g
              key={r.id}
              role="button"
              tabIndex={0}
              aria-label={`${r.name} — show region story`}
              aria-pressed={activeId === r.id}
              className="region-node"
              transform={`translate(${r.x} ${r.y})`}
              opacity={off ? 0.3 : 1}
              style={{ transition: 'opacity .3s' }}
              onClick={() => setActiveId(r.id === activeId ? null : r.id)}
              onPointerEnter={() => setHoverId(r.id)}
              onPointerLeave={() => setHoverId((v) => (v === r.id ? null : v))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setActiveId(r.id === activeId ? null : r.id);
                }
              }}
            >
              {lit && <circle r={4.4} fill="var(--gold-hi)" opacity={0.18} />}
              <circle
                r={lit ? 2.6 : 1.8}
                fill={lit ? 'var(--gold-hi)' : 'var(--gold)'}
                style={{ transition: 'r .25s' }}
              />
              {lit && (
                <text
                  x={r.x < 50 ? -3.5 : 3.5}
                  y={0}
                  textAnchor={r.x < 50 ? 'end' : 'start'}
                  dominantBaseline="middle"
                  fill="var(--cream)"
                  fontSize={3.2}
                  style={{ fontFamily: 'var(--font-mono)', letterSpacing: '0.02em' }}
                >
                  {r.name}
                </text>
              )}
            </g>
          );
        })}
      </svg>

      <div className="region-panel" aria-live="polite">
        {active ? (
          <>
            <p className="eyebrow">{active.name}</p>
            <p className="region-story">{active.story}</p>
          </>
        ) : (
          <p className="region-story region-story-placeholder">Select a region to read its story.</p>
        )}
      </div>

      <ul className="region-fallback-list">
        {regions.map((r) => (
          <li key={r.id}>
            <button
              type="button"
              aria-pressed={activeId === r.id}
              onClick={() => setActiveId(r.id === activeId ? null : r.id)}
            >
              {r.name}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
