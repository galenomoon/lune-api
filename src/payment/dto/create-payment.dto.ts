export class CreatePaymentDto {
  enrollmentId: string;
  amount: number;
  dueDate: Date;
  status: "PENDING" | "PAID" | "CANCELED";
}
