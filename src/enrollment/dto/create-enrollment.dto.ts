export class CreateEnrollmentDto {
  startDate: Date;
  endDate: Date;
  status: 'active' | 'canceled' | 'pending';
  studentId: string;
  student?: StudentDto | null;
  planId: string;
  paymentDay: number;
  classId: string;
}

export class StudentDto {
  firstName: string;
  lastName: string;
  birthDate: Date;
  cpf: string;
  rg: string;
  phone?: string;
  instagram?: string;
  email?: string;
  obs?: string;
  password: string;
}
