import {
  Enrollment,
  Payment,
  Student,
  Plan,
  Class,
  Modality,
} from '@prisma/client';
import { getStudentPaymentStatus } from './get-student-payment-status';
import { getDaysToExpire } from './get-days-to-expire';

export interface IStudent {
  id: string;
  firstName: string;
  lastName: string;
  enrollments: (Enrollment & {
    payments: Payment[];
    student: Student;
    plan?: Plan | null;
    class?: (Class & { modality?: Modality | null }) | null;
  })[];
}

export const formatListStudentsResponse = (student: IStudent) => {
  const paymentStatus = getStudentPaymentStatus(student.enrollments);
  const daysToExpire = getDaysToExpire(student.enrollments);
  const studentName = [student.firstName, student.lastName]
    .filter(Boolean)
    .join(' ');

  // Extract unique plans and modalities from active enrollments
  const plans = [
    ...new Set(
      student.enrollments
        .filter((enrollment) => enrollment.plan)
        .map((enrollment) => enrollment.plan!.name),
    ),
  ];

  const modalities = [
    ...new Set(
      student.enrollments
        .filter((enrollment) => enrollment.class?.modality)
        .map((enrollment) => enrollment.class!.modality!.name),
    ),
  ];

  return {
    ...student,
    daysToExpire,
    studentName,
    status: paymentStatus,
    plans,
    modalities,
  };
};
