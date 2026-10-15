import { useRef, type KeyboardEvent } from 'react';

export interface Choice<T extends string = string> {
  value: T;
  label: string;
  /** Linha de apoio (só aparece no layout stack). */
  hint?: string;
}

interface ChoiceChipsProps<T extends string> {
  value: T | '' | null;
  options: Choice<T>[];
  onChange: (value: T) => void;
  /** wrap = chips que quebram linha; fill = segmentado de larguras iguais; stack = cartões empilhados (textos longos). */
  layout?: 'wrap' | 'fill' | 'stack';
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

/** Escolha única com as opções à vista (listas curtas, onde um dropdown só esconde o que cabe na tela). */
export function ChoiceChips<T extends string>({
  value,
  options,
  onChange,
  layout = 'wrap',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: ChoiceChipsProps<T>) {
  const refs = useRef<(HTMLButtonElement | null)[]>([]);
  const selectedIndex = options.findIndex((o) => o.value === value);

  // Setas trocam a escolha, como num grupo de rádio nativo.
  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>, index: number) {
    const dir = e.key === 'ArrowRight' || e.key === 'ArrowDown' ? 1 : e.key === 'ArrowLeft' || e.key === 'ArrowUp' ? -1 : 0;
    if (dir === 0) return;
    e.preventDefault();
    const next = (index + dir + options.length) % options.length;
    onChange(options[next].value);
    refs.current[next]?.focus();
  }

  const groupClass = layout === 'wrap' ? 'flex flex-wrap gap-1.5' : layout === 'fill' ? 'grid gap-1.5' : 'space-y-2';

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      className={groupClass}
      style={layout === 'fill' ? { gridTemplateColumns: `repeat(${options.length}, minmax(0, 1fr))` } : undefined}
    >
      {options.map((option, index) => {
        const on = option.value === value;
        const tabbable = selectedIndex >= 0 ? index === selectedIndex : index === 0;
        const common = {
          type: 'button' as const,
          role: 'radio',
          'aria-checked': on,
          tabIndex: tabbable ? 0 : -1,
          onClick: () => onChange(option.value),
          onKeyDown: (e: KeyboardEvent<HTMLButtonElement>) => handleKeyDown(e, index),
        };

        if (layout === 'stack') {
          return (
            <button
              key={option.value}
              ref={(el) => {
                refs.current[index] = el;
              }}
              {...common}
              className={`flex min-h-[44px] w-full items-center gap-3 rounded-lg border-2 bg-raised p-2.5 text-left transition-colors focus:outline-none focus-visible:border-action ${
                on ? 'border-action' : 'border-line hover:border-ink-faint'
              }`}
            >
              <span
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-[4px] border-2 ${on ? 'border-action' : 'border-line'}`}
                aria-hidden
              >
                {on && <span className="h-2 w-2 rounded-[1px] bg-action" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className={`block text-sm font-semibold ${on ? 'text-ink' : 'text-ink-dim'}`}>{option.label}</span>
                {option.hint && <span className="block text-xs text-ink-faint">{option.hint}</span>}
              </span>
            </button>
          );
        }

        return (
          <button
            key={option.value}
            ref={(el) => {
              refs.current[index] = el;
            }}
            {...common}
            className={`min-h-[44px] min-w-0 truncate rounded-lg border-2 bg-raised px-3 text-sm font-semibold transition-colors focus:outline-none focus-visible:border-action ${
              on ? 'border-action text-action' : 'border-line text-ink-dim hover:border-ink-faint hover:text-ink'
            }`}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}
