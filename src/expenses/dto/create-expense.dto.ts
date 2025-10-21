export class CreateExpenseDto {
  name: string;
  description?: string;
  amount: number;
  dueDay: number; // Dia do mês (1-31)
}
