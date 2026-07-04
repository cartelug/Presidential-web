import { useState } from 'react';

interface Voice {
  id: string;
  name: string;
  role: string;
  place: string;
  quote: string;
}

interface Props {
  voices: Voice[];
}

export default function VoicePanel({ voices }: Props) {
  const [index, setIndex] = useState(0);
  const voice = voices[index];

  const go = (delta: number) => {
    setIndex((i) => (i + delta + voices.length) % voices.length);
  };

  return (
    <div
      className="voice-panel"
      onKeyDown={(e) => {
        if (e.key === 'ArrowRight') go(1);
        if (e.key === 'ArrowLeft') go(-1);
      }}
    >
      <div className="voice-stage" key={voice.id}>
        <span className="voice-silhouette" aria-hidden="true">
          <svg viewBox="0 0 24 24">
            <path d="M12 12a5 5 0 100-10 5 5 0 000 10Zm0 2c-5 0-9 2.6-9 6v2h18v-2c0-3.4-4-6-9-6Z" />
          </svg>
        </span>
        <blockquote>
          <p>“{voice.quote}”</p>
        </blockquote>
        <cite>
          <span className="voice-name">{voice.name}</span>
          <span className="voice-meta">
            {voice.role} · {voice.place}
          </span>
        </cite>
      </div>

      <div className="voice-controls">
        <button type="button" onClick={() => go(-1)} aria-label="Previous voice">
          ← Previous
        </button>
        <p className="voice-progress">
          {index + 1} / {voices.length}
        </p>
        <button type="button" onClick={() => go(1)} aria-label="Next voice">
          Next →
        </button>
      </div>

      {/* Print-only: every voice, since the on-screen panel shows one at a time. */}
      <div className="print-only" style={{ display: 'none' }}>
        {voices.map((v) => (
          <blockquote key={v.id}>
            <p>“{v.quote}”</p>
            <cite>
              {v.name} — {v.role} · {v.place}
            </cite>
          </blockquote>
        ))}
      </div>
    </div>
  );
}
