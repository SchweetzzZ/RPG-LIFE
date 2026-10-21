import { AlertTriangle, RefreshCw } from 'lucide-react';

/** Carregando: esqueleto de card com blocos acendendo em onda, no lugar de um spinner solto. */
export function LoadingBlock({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="space-y-3 rounded-lg border-2 border-line bg-surface p-4 shadow-[0_4px_0_0_#0c0a08] md:col-span-2"
    >
      <div className="flex items-center gap-3">
        <div className="skel-wave h-12 w-12 shrink-0 rounded-lg bg-raised" />
        <div className="flex-1 space-y-2">
          <div className="skel-wave h-3 w-2/5 rounded-[2px] bg-raised" style={{ animationDelay: '120ms' }} />
          <div className="skel-wave h-3 w-3/5 rounded-[2px] bg-raised" style={{ animationDelay: '240ms' }} />
        </div>
      </div>
      <div className="flex h-3 gap-[2px]" aria-hidden>
        {Array.from({ length: 16 }, (_, i) => (
          <span key={i} className="skel-wave flex-1 rounded-[2px] bg-raised" style={{ animationDelay: `${i * 60}ms` }} />
        ))}
      </div>
      <p className="font-pixel text-xs text-ink-faint">{label}</p>
    </div>
  );
}

interface ErrorBlockProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBlock({ message, onRetry }: ErrorBlockProps) {
  return (
    <div
      role="alert"
      className="flex items-center justify-between gap-3 rounded-lg border-2 border-danger/60 bg-surface p-3 text-sm text-danger shadow-[0_4px_0_0_#0c0a08] md:col-span-2"
    >
      <span className="flex min-w-0 items-start gap-2">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span className="min-w-0">{message}</span>
      </span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-lg border-2 border-danger/60 bg-raised px-3 text-xs font-semibold shadow-[0_3px_0_0_#0c0a08] hover:border-danger active:translate-y-[2px] active:shadow-[0_1px_0_0_#0c0a08]"
        >
          <RefreshCw className="h-3.5 w-3.5" />
          Tentar de novo
        </button>
      )}
    </div>
  );
}
