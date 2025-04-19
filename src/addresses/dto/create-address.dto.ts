export class CreateAddressDto {
  street: string;
  number: string;
  city: string;
  neighborhood: string;
  state: string;
  cep: string;
  studentId: string;
  complement?: string;
}