import { Enrollment, Payment, Student } from '@prisma/client';
import { getStudentPaymentStatus } from './get-student-payment-status';
import { getDaysToExpire } from './get-days-to-expire';

export interface IStudent {
  id: string;
  firstName: string;
  lastName: string;
  enrollments: (Enrollment & { payments: Payment[]; student: Student })[];
}

export const formatListStudentsResponse = (student: IStudent) => {
  const paymentStatus = getStudentPaymentStatus(student.enrollments);
  const daysToExpire = getDaysToExpire(student.enrollments);
  const studentName = [student.firstName, student.lastName]
    .filter(Boolean)
    .join(' ');

  return {
    ...student,
    daysToExpire,
    studentName,
    status: paymentStatus,
  };
};
