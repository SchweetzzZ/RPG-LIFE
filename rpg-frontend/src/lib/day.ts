/**
 * Aritmética de calendário em 'YYYY-MM-DD' (o "hoje" vem do servidor, no fuso do usuário).
 * Faz a conta em UTC ao meio-dia, então o fuso e o horário de verão do navegador não interferem.
 */
export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 12));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}
