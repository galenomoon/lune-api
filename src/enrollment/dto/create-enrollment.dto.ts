export class CreateEnrollmentDto {
  student: StudentDto | null;
  emergencyContact?: EmergencyContactDto | null;
  address: AddressDto;
  enrollment: EnrollmentDto;
}

export class StudentDto {
  firstName: string;
  lastName: string;
  rg: string;
  cpf: string;
  birthDate: Date;
  email?: string;
  phone?: string;
  instagram?: string;

  obs?: string;
  password: string;
}

export class EmergencyContactDto {
  name: string;
  description?: string;
  phone: string;
  studentId: string;
}

export class AddressDto {
  street: string;
  number: string;
  city: string;
  neighborhood: string;
  state: string;
  complement?: string;
  cep: string;
  studentId: string;
}

export class EnrollmentDto {
  startDate: Date;
  endDate: Date;
  status: 'active' | 'canceled' | 'pending';
  studentId: string;
  planId: string;
  paymentDay: number;
  classId: string;
  signature?: string;
}
