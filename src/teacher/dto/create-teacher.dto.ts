export class CreateTeacherDto {
  firstName: string;
  lastName: string;
  birthDate: Date;
  cpf: string;
  rg: string;
  phone: string;
  email?: string;
  instagram?: string;
  password: string;
  priceHour: number;
}
