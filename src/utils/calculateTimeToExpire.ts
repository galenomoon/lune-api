export function calculateTimeToExpire(endDate: string): string {
  const today = new Date();
  const expirationDate = new Date(endDate);

  const diffInMs = expirationDate.getTime() - today.getTime();
  const totalDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

  if (totalDays <= 0) return "Expirado";

  const months = Math.floor(totalDays / 30); // Aproximadamente 30 dias por mês
  const days = totalDays % 30;

  if (months > 0 && days > 0) {
    return `${months} ${months === 1 ? "mês" : "meses"} e ${days} ${days === 1 ? "dia" : "dias"}`;
  } else if (months > 0) {
    return `${months} ${months === 1 ? "mês" : "meses"}`;
  } else {
    return `${days} ${days === 1 ? "dia" : "dias"}`;
  }
}