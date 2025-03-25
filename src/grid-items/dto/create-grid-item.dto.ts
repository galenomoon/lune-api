export class CreateGridItemDto {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  class: Class;
}

class Class {
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

class Modality {}
class ClassLevel {}
class Teacher {}
class Enrollment {}

