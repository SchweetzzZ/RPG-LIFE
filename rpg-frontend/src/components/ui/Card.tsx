import type { ReactNode } from 'react';

interface CardProps {
  label?: string;
  /** Texto à direita do rótulo (ex.: a data). */
  aside?: string;
  className?: string;
  children: ReactNode;
}

export function Card({ label, aside, className = '', children }: CardProps) {
  return (
    <section className={`rounded-lg border-2 border-line bg-surface p-4 shadow-[0_4px_0_0_#0c0a08] ${className}`}>
      {label && (
        <div className="mb-3 flex items-center justify-between gap-2 text-xs">
          <h2 className="font-semibold uppercase tracking-wider text-ink-dim">{label}</h2>
          {aside && <span className="text-ink-faint">{aside}</span>}
        </div>
      )}
      {children}
    </section>
  );
}
