import type { ElementType, ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  icon: ElementType;
  subtitle?: string;
  /** Conteúdo à direita (ex.: HUD de moedas na Loja). */
  aside?: ReactNode;
}

/** Cabeçalho padrão das telas: ícone em bloco, título na fonte pixel e um HUD opcional à direita. */
export function PageHeader({ title, icon: Icon, subtitle, aside }: PageHeaderProps) {
  return (
    <header className="flex items-center gap-3 px-1 pb-1 pt-1">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border-2 border-line bg-raised text-action shadow-[0_3px_0_0_#0c0a08]">
        <Icon className="h-5 w-5" strokeWidth={2.25} />
      </div>
      <div className="min-w-0 flex-1">
        <h1 className="font-pixel text-2xl leading-none text-ink">{title}</h1>
        {subtitle && <p className="mt-1 text-xs text-ink-faint">{subtitle}</p>}
      </div>
      {aside && <div className="shrink-0">{aside}</div>}
    </header>
  );
}

/** HUD de moedas no estilo "carteira" de jogo: sempre à vista onde se gasta. */
export function CoinHud({ value }: { value: string }) {
  return (
    <div
      className="inline-flex h-10 items-center gap-1.5 rounded-lg border-2 border-coin/60 bg-raised pl-2 pr-3 shadow-[0_3px_0_0_#0c0a08]"
      aria-label={`Moedas: ${value}`}
      title="Moedas"
    >
      {/* Moeda desenhada: disco dourado com aro interno, girando em passos */}
      <span className="coin-spin flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#0c0a08] bg-coin" aria-hidden>
        <span className="h-2.5 w-1 rounded-[1px] bg-[#0c0a08]/45" />
      </span>
      <span className="font-num text-xl leading-none text-coin">{value}</span>
    </div>
  );
}
