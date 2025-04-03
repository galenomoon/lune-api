export class CreateGridItemDto {
  gridItems: GridItem[]
  class: Class;
}

class Class {
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

class GridItem {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}
class Modality {}
class ClassLevel {}
class Teacher {}
class Enrollment {}

