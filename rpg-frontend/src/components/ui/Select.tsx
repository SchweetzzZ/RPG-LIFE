import { useEffect, useId, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, motion } from 'motion/react';
import { Check, ChevronDown } from 'lucide-react';

export interface SelectOption<T extends string = string> {
  value: T;
  label: string;
  /** Linha de apoio abaixo do rótulo (ex.: categoria, data). */
  hint?: string;
  /** Selo curto à esquerda, na fonte de números (ex.: "N", "1/3"). */
  badge?: string;
  /** Marcador em destaque à direita (ex.: "treino do dia"). */
  tag?: string;
  disabled?: boolean;
}

interface SelectProps<T extends string> {
  value: T | '' | null;
  options: SelectOption<T>[];
  onChange: (value: T) => void;
  placeholder?: string;
  /** sm = 36px (cards densos); md = 44px (padrão dos campos). */
  size?: 'sm' | 'md';
  /** Fundo do botão: raised (padrão) ou surface, quando o select fica sobre um bloco raised. */
  tone?: 'raised' | 'surface';
  disabled?: boolean;
  className?: string;
  'aria-label'?: string;
  'aria-labelledby'?: string;
}

interface Position {
  left: number;
  width: number;
  top?: number;
  bottom?: number;
  maxHeight: number;
  placement: 'down' | 'up';
}

const MAX_LIST_HEIGHT = 264;
const MIN_LIST_WIDTH = 200;
const GAP = 6;
const EDGE = 8;

/** Remove acento e caixa para a busca por letra digitada. */
function fold(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function Badge({ text, size, on }: { text: string; size: 'sm' | 'md'; on: boolean }) {
  return (
    <span
      className={`flex shrink-0 items-center justify-center rounded border-2 font-num leading-none ${
        size === 'sm' ? 'h-5 min-w-5 px-1 text-sm' : 'h-6 min-w-6 px-1 text-base'
      } ${on ? 'border-action/60 text-action' : 'border-line text-ink-dim'}`}
    >
      {text}
    </span>
  );
}

function Tag({ text }: { text: string }) {
  return (
    <span className="shrink-0 rounded border-2 border-action/50 px-1.5 text-[11px] font-semibold uppercase leading-4 tracking-wider text-action">
      {text}
    </span>
  );
}

/**
 * Dropdown no visual do Hub (substitui o <select> nativo, cuja lista aberta é desenhada pelo sistema).
 * Botão = campo padrão; lista = mesmo painel do menu ⋯ (surface, borda 2px, sombra dura).
 * Lista vai num portal com posição fixa: não é cortada por sheets com overflow e abre para cima se faltar espaço.
 */
export function Select<T extends string>({
  value,
  options,
  onChange,
  placeholder = 'Selecione',
  size = 'md',
  tone = 'raised',
  disabled = false,
  className = '',
  'aria-label': ariaLabel,
  'aria-labelledby': ariaLabelledBy,
}: SelectProps<T>) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [pos, setPos] = useState<Position | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const typed = useRef({ text: '', at: 0 });
  const baseId = useId();
  const listId = `${baseId}-list`;
  const optionId = (index: number) => `${baseId}-opt-${index}`;

  const selectedIndex = options.findIndex((o) => o.value === value);
  const selected = selectedIndex >= 0 ? options[selectedIndex] : null;

  function step(from: number, dir: 1 | -1): number {
    for (let i = from + dir; i >= 0 && i < options.length; i += dir) {
      if (!options[i].disabled) return i;
    }
    return from;
  }
  const first = () => step(-1, 1);
  const last = () => step(options.length, -1);

  function measure() {
    const el = triggerRef.current;
    if (!el) return;
    const r = el.getBoundingClientRect();
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const below = vh - r.bottom - GAP - EDGE;
    const above = r.top - GAP - EDGE;
    const down = below >= Math.min(MAX_LIST_HEIGHT, 200) || below >= above;
    const width = Math.min(Math.max(r.width, MIN_LIST_WIDTH), vw - EDGE * 2);
    const left = Math.max(EDGE, Math.min(r.left, vw - width - EDGE));
    setPos(
      down
        ? { left, width, top: r.bottom + GAP, maxHeight: Math.min(MAX_LIST_HEIGHT, below), placement: 'down' }
        : { left, width, bottom: vh - r.top + GAP, maxHeight: Math.min(MAX_LIST_HEIGHT, above), placement: 'up' },
    );
  }

  function openList() {
    if (disabled || options.length === 0) return;
    setActive(selectedIndex >= 0 ? selectedIndex : first());
    setOpen(true);
  }

  function close() {
    setOpen(false);
  }

  function choose(index: number) {
    const option = options[index];
    if (!option || option.disabled) return;
    if (option.value !== value) onChange(option.value);
    setOpen(false);
    triggerRef.current?.focus();
  }

  // Posição: mede ao abrir e acompanha scroll/resize.
  useLayoutEffect(() => {
    if (!open) return;
    measure();
    const update = () => measure();
    window.addEventListener('resize', update);
    window.addEventListener('scroll', update, true);
    return () => {
      window.removeEventListener('resize', update);
      window.removeEventListener('scroll', update, true);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  // Clique fora fecha.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(e: PointerEvent) {
      const target = e.target as Node;
      if (triggerRef.current?.contains(target) || listRef.current?.contains(target)) return;
      setOpen(false);
    }
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  // Mantém a opção ativa visível.
  useEffect(() => {
    if (!open || active < 0) return;
    document.getElementById(optionId(active))?.scrollIntoView({ block: 'nearest' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, active, pos !== null]);

  function typeahead(key: string) {
    const now = Date.now();
    const text = now - typed.current.at > 600 ? key : typed.current.text + key;
    typed.current = { text, at: now };
    const needle = fold(text);
    const found = options.findIndex((o) => !o.disabled && fold(o.label).startsWith(needle));
    if (found < 0) return;
    if (!open) {
      setOpen(true);
    }
    setActive(found);
  }

  function handleKeyDown(e: KeyboardEvent<HTMLButtonElement>) {
    switch (e.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        e.preventDefault();
        if (!open) openList();
        else setActive((i) => step(i, e.key === 'ArrowDown' ? 1 : -1));
        return;
      }
      case 'Home':
      case 'End': {
        if (!open) return;
        e.preventDefault();
        setActive(e.key === 'Home' ? first() : last());
        return;
      }
      case 'Enter':
      case ' ': {
        e.preventDefault();
        if (open && active >= 0) choose(active);
        else if (!open) openList();
        return;
      }
      case 'Escape': {
        if (!open) return;
        e.preventDefault();
        e.stopPropagation();
        close();
        return;
      }
      case 'Tab': {
        if (open) close();
        return;
      }
      default: {
        if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) typeahead(e.key);
      }
    }
  }

  const sizeClass = size === 'sm' ? 'h-9 gap-2 pl-2.5 pr-2 text-sm' : 'h-11 gap-2 px-3 text-base';
  const toneClass = tone === 'surface' ? 'bg-surface' : 'bg-raised';
  const borderClass = open ? 'border-action' : 'border-line hover:border-ink-faint focus:border-action';

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        role="combobox"
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-activedescendant={open && active >= 0 ? optionId(active) : undefined}
        aria-label={ariaLabel}
        aria-labelledby={ariaLabelledBy}
        disabled={disabled}
        onClick={() => (open ? close() : openList())}
        onKeyDown={handleKeyDown}
        // Espaço ativa o botão no keyup; já tratado no keydown.
        onKeyUp={(e) => {
          if (e.key === ' ') e.preventDefault();
        }}
        className={`flex w-full min-w-0 items-center rounded-lg border-2 text-left transition-colors focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${sizeClass} ${toneClass} ${borderClass} ${className}`}
      >
        {selected?.badge && <Badge text={selected.badge} size={size} on={false} />}
        <span className={`min-w-0 flex-1 truncate ${selected ? 'text-ink' : 'text-ink-faint'}`}>
          {selected ? selected.label : placeholder}
        </span>
        {selected?.tag && <Tag text={selected.tag} />}
        <ChevronDown
          className={`h-4 w-4 shrink-0 transition-transform duration-150 ${open ? 'rotate-180 text-action' : 'text-ink-faint'}`}
          aria-hidden
        />
      </button>

      {createPortal(
        <AnimatePresence>
          {open && pos && (
            <motion.div
              key="list"
              ref={listRef}
              id={listId}
              role="listbox"
              aria-label={ariaLabel}
              aria-labelledby={ariaLabelledBy}
              initial={{ opacity: 0, y: pos.placement === 'down' ? -4 : 4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: pos.placement === 'down' ? -4 : 4 }}
              transition={{ duration: 0.12, ease: 'easeOut' }}
              style={{ position: 'fixed', left: pos.left, width: pos.width, top: pos.top, bottom: pos.bottom, maxHeight: pos.maxHeight }}
              className="z-[80] space-y-0.5 overflow-y-auto overscroll-contain rounded-lg border-2 border-line bg-surface p-1.5 shadow-[0_4px_0_0_#0c0a08]"
            >
              {options.map((option, index) => {
                const isSelected = index === selectedIndex;
                const isActive = index === active;
                return (
                  <div
                    key={option.value}
                    id={optionId(index)}
                    role="option"
                    aria-selected={isSelected}
                    aria-disabled={option.disabled || undefined}
                    onMouseEnter={() => !option.disabled && setActive(index)}
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => choose(index)}
                    className={`flex min-h-[44px] items-center gap-2 rounded-lg px-2 py-1.5 ${
                      option.disabled ? 'cursor-not-allowed opacity-40' : 'cursor-pointer'
                    } ${isActive ? 'bg-raised' : ''}`}
                  >
                    {option.badge && <Badge text={option.badge} size="md" on={isSelected} />}
                    <span className="min-w-0 flex-1">
                      <span className={`block truncate text-sm font-semibold ${isSelected ? 'text-action' : 'text-ink'}`}>
                        {option.label}
                      </span>
                      {option.hint && <span className="block truncate text-xs text-ink-faint">{option.hint}</span>}
                    </span>
                    {option.tag && <Tag text={option.tag} />}
                    {isSelected ? (
                      <Check className="h-4 w-4 shrink-0 text-action" aria-hidden />
                    ) : (
                      <span className="w-4 shrink-0" aria-hidden />
                    )}
                  </div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>,
        document.body,
      )}
    </>
  );
}
