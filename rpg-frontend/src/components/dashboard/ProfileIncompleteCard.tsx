import { UserCog } from 'lucide-react';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export function ProfileIncompleteCard({ missing }: { missing: string[] }) {
  return (
    <Card>
      <div className="space-y-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-line bg-raised text-ink">
            <UserCog className="h-5 w-5" />
          </div>
          <div className="space-y-1">
            <h2 className="text-base font-bold text-ink">Complete seu perfil para calcular sua meta do dia</h2>
            <p className="text-sm text-ink-dim">Falta preencher:</p>
            <ul className="list-disc pl-4 text-sm text-ink">
              {missing.map((field) => (
                <li key={field}>{field}</li>
              ))}
            </ul>
          </div>
        </div>
        <Button to="/profile">Completar perfil</Button>
      </div>
    </Card>
  );
}
