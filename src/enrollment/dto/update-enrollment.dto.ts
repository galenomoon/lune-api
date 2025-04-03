export class UpdateEnrollmentDto {
  startDate: Date;
  endDate: Date;
  status: 'active' | 'canceled' | 'pending' | 'archived' ;
  studentId: string;
  planId: string;
  paymentDay: number;
  classId: string;
}
