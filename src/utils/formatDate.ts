export function formatDate(isoDate: string | Date): string {
  const date = new Date(isoDate);
  
  const day = String(date.getUTCDate()).padStart(2, '0');
  const month = String(date.getUTCMonth() + 1).padStart(2, '0'); // Mês começa do zero, então +1
  const year = date.getUTCFullYear();

  return `${day}/${month}/${year}`;
}