import { Payment, Enrollment, Student } from '@prisma/client';
import { getIsOverdue } from '../../utils/getIsOverdue';
import { newBrazilianDate } from '../../utils/newBrazilianDate';

type EnrollementWithPayments = Enrollment & {
  payments: Payment[];
  student: Student;
};

export const getStudentPaymentStatus = (
  enrollments: EnrollementWithPayments[],
) => {
  const {
    hasPendingPayments,
    hasOverduePayments,
    isAllPaymentCanceled,
    isAllPaymentsPaid,
  } = enrollments.reduce(
    (acc, enrollment) => {
      const hasPendingPayments = enrollment.payments.some(
        (p) =>
          p.status === 'PENDING' &&
          p.dueDate.getMonth() === newBrazilianDate().getMonth() &&
          p.dueDate.getFullYear() === newBrazilianDate().getFullYear(),
      );
      const hasOverduePayments = enrollment.payments.some(getIsOverdue);
      const isAllPaymentCanceled = enrollment.payments.every(
        (p) => p.status === 'CANCELED',
      );
      const isAllPaymentsPaid = enrollment.payments.every(
        (p) => p.status === 'PAID',
      );
      return {
        hasPendingPayments: acc.hasPendingPayments || hasPendingPayments,
        hasOverduePayments: acc.hasOverduePayments || hasOverduePayments,
        isAllPaymentCanceled: acc.isAllPaymentCanceled || isAllPaymentCanceled,
        isAllPaymentsPaid: acc.isAllPaymentsPaid || isAllPaymentsPaid,
      };
    },
    {
      hasPendingPayments: false,
      hasOverduePayments: false,
      isAllPaymentCanceled: false,
      isAllPaymentsPaid: false,
    },
  );

  if (isAllPaymentCanceled) {
    return 'CANCELED';
  }

  if (hasOverduePayments) {
    return 'OVERDUE';
  }

  if (hasPendingPayments) {
    return 'PENDING';
  }

  if (isAllPaymentsPaid) {
    return 'RENEW';
  }

  return 'PAID';
};
