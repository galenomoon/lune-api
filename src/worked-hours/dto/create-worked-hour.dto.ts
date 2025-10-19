import { WorkedHourStatus } from '@prisma/client';

export class CreateWorkedHourDto {
  teacherId: string;
  classId: string;
  workedAt: Date;
  newEnrollmentsCount?: number;
  status?: WorkedHourStatus;
}
