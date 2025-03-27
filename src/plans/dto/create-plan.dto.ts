export class CreatePlanDto {
  id: string;
  name: string;
  weeklyClasses: number;
  description?: string;
  recurrence: string;
  price: number;
  durationInDays: number;
  status: boolean;
}
