import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkedHourDto } from './create-worked-hour.dto';
import { WorkedHourStatus } from '@prisma/client';

export class UpdateWorkedHourDto {
  teacherId?: string;
  classId?: string;
  workedAt?: Date;
  newEnrollmentsCount?: number;
  status?: WorkedHourStatus;
}

export class UpdateWorkedHourTeacherDto {
  teacherId: string;
}

export class UpdateWorkedHourStatusDto {
  status: WorkedHourStatus;
}
