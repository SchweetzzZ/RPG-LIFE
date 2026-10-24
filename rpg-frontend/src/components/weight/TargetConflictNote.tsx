import { AlertTriangle } from 'lucide-react';

/** Aviso discreto de meta incoerente com o objetivo. Só informa: não bloqueia salvar. */
export function TargetConflictNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <p className="flex items-start gap-1.5 text-xs text-xp">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      {message}
    </p>
  );
}
