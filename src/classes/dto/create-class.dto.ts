export class CreateClassDto {
  name: string;
  description?: string;
  modalityId: string;
  classLevelId: string;
  maxStudents: number;
  teacherId?: string;
}
