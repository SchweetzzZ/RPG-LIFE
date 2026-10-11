/** kcal / moedas com separador de milhar (pt-BR), sempre inteiro. */
export function formatNumber(value: number): string {
  return Math.round(value).toLocaleString('pt-BR');
}

/** 'YYYY-MM-DD' (dia do usuário, vindo da API) -> "sáb., 10/10". Sem passar por UTC. */
export function formatDay(isoDate: string): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  return new Date(year, month - 1, day).toLocaleDateString('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: '2-digit',
  });
}

export function pluralize(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function percent(part: number, total: number): number {
  if (total <= 0) return 0;
  return Math.min(100, Math.round((part / total) * 100));
}
