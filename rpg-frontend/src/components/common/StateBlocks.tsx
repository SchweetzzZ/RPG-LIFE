import { AlertCircle, Loader2, RefreshCw } from 'lucide-react';

export function LoadingBlock({ label = 'Carregando...' }: { label?: string }) {
  return (
    <div className="flex items-center justify-center gap-2 rounded-2xl border border-white/[0.08] bg-[#0c0e12] p-8 font-mono text-xs text-zinc-400">
      <Loader2 className="h-4 w-4 animate-spin" />
      <span>{label}</span>
    </div>
  );
}

interface ErrorBlockProps {
  message: string;
  onRetry?: () => void;
}

export function ErrorBlock({ message, onRetry }: ErrorBlockProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-2xl border border-rose-500/20 bg-rose-500/10 p-4 text-xs text-rose-300">
      <span className="flex items-center gap-2">
        <AlertCircle className="h-4 w-4 shrink-0" />
        {message}
      </span>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="inline-flex items-center gap-1.5 rounded-lg border border-rose-400/30 px-2.5 py-1.5 font-mono font-semibold hover:bg-rose-500/10"
        >
          <RefreshCw className="h-3 w-3" />
          Tentar de novo
        </button>
      )}
    </div>
  );
}
