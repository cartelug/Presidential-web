import { useEffect, useRef } from 'react';
import { gsap, ScrollTrigger, durations, prefersReducedMotion } from '../../lib/motion';

interface Props {
  label: string;
  value1986: string;
  value2026: string;
  value2026Numeric: number;
  unit: string;
  sourceHref: string;
}

function formatNumber(n: number): string {
  const decimals = Number.isInteger(n) ? 0 : 1;
  return n.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
}

/** Parse the 1986 baseline out of its display string ("$330"→330, "60 MW"→60,
 *  "56%"→56, "—"→0) so the count-up sweeps the actual transformation. */
function parseStart(value1986: string): number {
  const m = value1986.replace(/,/g, '').match(/-?\d+(\.\d+)?/);
  return m ? parseFloat(m[0]) : 0;
}

/** Lenis default easing — exponential decay; the shared "feel" across the site. */
function lenisEase(t: number): number {
  return t >= 1 ? 1 : 1.001 - Math.pow(2, -10 * t);
}

/**
 * Ledger figure: serif engraving that count-sweeps from its 1986 baseline to
 * 2026 as it enters, a baseline spark bar fills in sync so the delta is *seen*,
 * and a "View source" affordance makes the (previously bare) link legible.
 */
export default function LedgerFigure({
  label,
  value1986,
  value2026,
  value2026Numeric,
  unit,
  sourceHref,
}: Props) {
  const numRef = useRef<HTMLSpanElement>(null);
  const sparkRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = numRef.current;
    const spark = sparkRef.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      el.textContent = value2026;
      if (spark) spark.style.transform = 'scaleX(1)';
      return;
    }

    const start = parseStart(value1986);
    const state = { p: 0 };
    el.textContent = `${formatNumber(start)}${unit}`;
    if (spark) spark.style.transform = 'scaleX(0)';

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(state, {
          p: 1,
          duration: durations.cinematic,
          ease: lenisEase,
          onUpdate: () => {
            const v = start + (value2026Numeric - start) * state.p;
            el.textContent = `${formatNumber(v)}${unit}`;
            if (spark) spark.style.transform = `scaleX(${state.p.toFixed(3)})`;
          },
          onComplete: () => {
            el.textContent = value2026;
          },
        });
      },
    });

    return () => trigger.kill();
  }, [value1986, value2026, value2026Numeric, unit]);

  return (
    <a
      className="ledger-figure"
      href={sourceHref}
      data-cursor-label="Source"
      aria-label={`${label}: ${value1986} in 1986 to ${value2026} in 2026. View source.`}
    >
      <span className="ledger-eyebrow" aria-hidden="true">
        {value1986} →
      </span>
      <span className="ledger-num data-numeral" ref={numRef} aria-hidden="true">
        {value2026}
      </span>
      <span className="ledger-spark" aria-hidden="true">
        <span className="ledger-spark__fill" ref={sparkRef} />
      </span>
      <span className="ledger-label">{label}</span>
      <span className="ledger-figure__source" aria-hidden="true">
        View source →
      </span>
    </a>
  );
}
