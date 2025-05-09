export class CreateWorkedHourDto {
  id: string;
  teacherId: string;
  classId: string;
  workedAt: Date;
  startedAt: string;
  endedAt: string;
  priceSnapshot: number;
  status: WorkedHourStatus;
}

enum WorkedHourStatus {
  PENDING = 'PENDING',
  DONE = 'DONE',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  CANCELED = 'CANCELED',
}
