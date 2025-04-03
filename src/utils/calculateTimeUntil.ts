export function calculateTimeUntil(date: Date): string {
  const today = new Date();
  const diffInMs = date.getTime() - today.getTime();
  const diffInDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

  const isMoreThanOne = (value: number) => value > 1;

  if (diffInDays < 7)
    return isMoreThanOne(diffInDays)
      ? `${diffInDays} dias`
      : `${diffInDays} dia`;

  if (diffInDays < 30)
    return isMoreThanOne(Math.floor(diffInDays / 7))
      ? `${Math.floor(diffInDays / 7)} semanas`
      : `${Math.floor(diffInDays / 7)} semana`;

  return isMoreThanOne(Math.floor(diffInDays / 30))
    ? `${Math.floor(diffInDays / 30)} meses`
    : `${Math.floor(diffInDays / 30)} mês`;
}
