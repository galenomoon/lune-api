export function newBrazilianDate(): Date {
  const brazilianTimeZone = 'America/Sao_Paulo';
  const now = new Date();
  const brazilianDate = new Date(
    now.toLocaleString('en-US', { timeZone: brazilianTimeZone }),
  );
  return brazilianDate;
}
