import { Link } from '@tanstack/react-router';
import { UserCog } from 'lucide-react';

export function ProfileIncompleteCard({ missing }: { missing: string[] }) {
  return (
    <div className="space-y-3 rounded-2xl border border-white/[0.08] bg-[#0c0e12] p-5">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-amber-400/20 bg-amber-400/10 text-amber-400">
          <UserCog className="h-4 w-4" />
        </div>
        <div className="space-y-1">
          <h2 className="text-base font-bold text-zinc-100">Complete seu perfil para calcular sua meta do dia</h2>
          <p className="text-xs text-zinc-400">Falta preencher:</p>
          <ul className="list-disc pl-4 text-xs text-zinc-300">
            {missing.map((field) => (
              <li key={field}>{field}</li>
            ))}
          </ul>
        </div>
      </div>
      <Link
        to="/profile"
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 font-mono text-xs font-bold text-black shadow-lg shadow-amber-400/20 hover:bg-amber-300"
      >
        Completar perfil
      </Link>
    </div>
  );
}
