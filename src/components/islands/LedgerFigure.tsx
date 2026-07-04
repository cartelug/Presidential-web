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

/** Ledger figure: serif engraving + count-up once on enter (§7 Ledger, §9). */
export default function LedgerFigure({ label, value1986, value2026, value2026Numeric, unit, sourceHref }: Props) {
  const numRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = numRef.current;
    if (!el) return;

    if (prefersReducedMotion()) {
      el.textContent = value2026;
      return;
    }

    el.textContent = `0${unit}`;
    const counter = { value: 0 };

    const trigger = ScrollTrigger.create({
      trigger: el,
      start: 'top 85%',
      once: true,
      onEnter: () => {
        gsap.to(counter, {
          value: value2026Numeric,
          duration: durations.slow,
          ease: 'power1.out',
          onUpdate: () => {
            el.textContent = `${formatNumber(counter.value)}${unit}`;
          },
          onComplete: () => {
            el.textContent = value2026;
          },
        });
      },
    });

    return () => trigger.kill();
  }, [value2026, value2026Numeric, unit]);

  return (
    <a className="ledger-figure" href={sourceHref}>
      <span className="ledger-eyebrow">{value1986} → </span>
      <span className="ledger-num data-numeral" ref={numRef} aria-label={`${value2026} in 2026`}>
        {value2026}
      </span>
      <span className="ledger-label">{label}</span>
    </a>
  );
}
