import { CreateLeadDto } from 'src/lead/dto/create-lead.dto';

export class CreateTrialStudentDto {
  lead: CreateLeadDto;
  gridItem: {
    id?: string;
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    class: GridClass;
  };
  date: Date;
}

class GridClass {
  id?: string;
  name: string;
  description?: string;
  modalityId: string;
  modality?: Modality;
  teacher?: Teacher;
  teacherId?: string;
  enrollments?: Enrollment[];
  classLevelId: string;
  maxStudents: number;
  classLevel?: ClassLevel;
}

class Modality {
  name: string;
}
class ClassLevel {}
class Teacher {}
class Enrollment {}
