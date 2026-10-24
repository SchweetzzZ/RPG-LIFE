import { useState, type FormEvent } from 'react';
import { Check, Loader2, X } from 'lucide-react';
import { parseKg, weightError } from '@/src/lib/weight';
import { errorMessage } from '@/src/services/http';

interface WeightInputProps {
  /** Valor inicial do campo (ex.: o último peso, ao editar). */
  initialKg?: number | null;
  /** Grava no servidor; deve lançar erro se falhar. */
  onSubmit: (weightKg: number) => Promise<void>;
  onCancel?: () => void;
  submitLabel?: string;
  autoFocus?: boolean;
}

/** Campo de peso (kg, uma casa) com salvar/cancelar. Valida 20–400 kg antes de chamar a API. */
export function WeightInput({ initialKg = null, onSubmit, onCancel, submitLabel = 'Salvar', autoFocus }: WeightInputProps) {
  const [text, setText] = useState(initialKg === null ? '' : String(initialKg).replace('.', ','));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const value = parseKg(text);
    const invalid = weightError(value);
    if (invalid || value === null) return setError(invalid);
    setError(null);
    setSaving(true);
    try {
      await onSubmit(value);
    } catch (err) {
      setError(errorMessage(err instanceof Error ? err : null, 'Não foi possível salvar o peso'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2">
      <div className="flex gap-2">
        <label className="relative min-w-0 flex-1">
          <span className="sr-only">Peso em kg</span>
          <input
            type="text"
            inputMode="decimal"
            autoFocus={autoFocus}
            placeholder="Ex.: 82,4"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="h-11 w-full rounded-lg border-2 border-line bg-raised pl-3 pr-10 font-num text-xl text-ink focus:border-action focus:outline-none"
          />
          <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-sm text-ink-faint">kg</span>
        </label>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex min-h-[44px] shrink-0 items-center gap-1.5 rounded-lg border-2 border-[#0c0a08] bg-action px-3 text-sm font-bold text-[#0c0a08] shadow-[0_3px_0_0_#0c0a08] hover:brightness-110 active:translate-y-[2px] active:shadow-[0_1px_0_0_#0c0a08] disabled:opacity-50"
        >
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            aria-label="Cancelar"
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg border-2 border-line text-ink-dim hover:text-ink"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
      {error && <p role="alert" className="text-sm text-danger">{error}</p>}
    </form>
  );
}
