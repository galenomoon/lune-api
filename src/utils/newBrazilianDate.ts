export function newBrazilianDate(): Date {
  const now = new Date();
  const utc = now.getTime() + now.getTimezoneOffset() * 60000; // volta para UTC
  const brazilianOffset = -6; // Brasília = UTC-3
  const brazilianTime = new Date(utc + 3600000 * brazilianOffset);

  return brazilianTime;
}
