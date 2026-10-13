import { Button } from '../ui/Button';

interface ExerciseDeleteConfirmProps {
  name: string;
  busy: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Confirmação inline de apagar exercício: remove das rotinas E o histórico inteiro. */
export function ExerciseDeleteConfirm({ name, busy, onConfirm, onCancel }: ExerciseDeleteConfirmProps) {
  return (
    <div role="alertdialog" aria-label="Confirmar exclusão" className="space-y-2 rounded-lg border-2 border-danger/60 bg-raised p-3">
      <p className="text-sm text-ink">
        Apagar «{name}»? Ele sai de todas as rotinas e o histórico de cargas dele será removido. Isso não pode ser desfeito.
      </p>
      <div className="grid grid-cols-2 gap-2">
        <Button variant="secondary" onClick={onCancel} disabled={busy}>
          Cancelar
        </Button>
        <Button variant="secondary" className="!border-danger/60 !text-danger" onClick={onConfirm} disabled={busy}>
          {busy ? 'Apagando...' : 'Apagar tudo'}
        </Button>
      </div>
    </div>
  );
}
