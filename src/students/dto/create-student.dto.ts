export class CreateStudentDto {
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