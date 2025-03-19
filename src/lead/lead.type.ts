export interface ILead {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  findUsBy: string;
  obs?: string;
  modalityOfInterest: string;
  preferencePeriod: string;
  age: number;
  city?: string;
  email: string;
  score: number;
  status: number;
  createdAt: Date;
  updatedAt: Date;
}
