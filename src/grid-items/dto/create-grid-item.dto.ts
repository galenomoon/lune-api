export class CreateGridItemDto {
  id?: string
  gridItems: GridItem[]
  class: GridClass;
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

class GridItem {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
}
class Modality {
  name: string
}
class ClassLevel {}
class Teacher {}
class Enrollment {}

