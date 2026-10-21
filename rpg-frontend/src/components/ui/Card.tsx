import type { ElementType, ReactNode } from 'react';

interface CardProps {
  label?: string;
  /** Ícone pequeno antes do rótulo. */
  icon?: ElementType;
  /** Texto à direita do rótulo (ex.: a data). */
  aside?: string;
  /** Destaque de estado: coin = pronto para resgatar, action = concluído. */
  highlight?: 'coin' | 'action';
  className?: string;
  children: ReactNode;
}

const HIGHLIGHT = {
  coin: 'border-coin/70',
  action: 'border-action/70',
};

export function Card({ label, icon: Icon, aside, highlight, className = '', children }: CardProps) {
  return (
    <section
      className={`rounded-lg border-2 bg-surface p-4 shadow-[0_4px_0_0_#0c0a08] ${highlight ? HIGHLIGHT[highlight] : 'border-line'} ${className}`}
    >
      {label && (
        <div className="mb-3 flex items-center justify-between gap-2">
          <h2 className="inline-flex items-center gap-1.5 font-pixel text-[13px] uppercase leading-none text-ink-dim">
            {Icon && <Icon className="h-3.5 w-3.5" aria-hidden />}
            {label}
          </h2>
          {aside && <span className="text-xs text-ink-faint">{aside}</span>}
        </div>
      )}
      {children}
    </section>
  );
}
