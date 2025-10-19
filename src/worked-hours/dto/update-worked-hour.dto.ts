import { WorkedHourStatus } from '@prisma/client';

export class UpdateWorkedHourDto {
  teacherId?: string;
  classId?: string;
  workedAt?: Date;
  newEnrollmentsCount?: number;
  status?: WorkedHourStatus;
  priceSnapshot?: number;
}

export class UpdateWorkedHourTeacherDto {
  teacherId: string;
}

export class UpdateWorkedHourStatusDto {
  status: WorkedHourStatus;
}
