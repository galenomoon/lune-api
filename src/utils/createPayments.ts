import { planDetailsIndexedByDurationInDays } from 'src/constants';
import { CreatePaymentDto } from 'src/payment/dto/create-payment.dto';
import { addHours } from './addHours';
import { Plan } from '@prisma/client';

export const createPayments = ({
  enrollment,
  plan,
  enrollmentTax = 0,
}: {
  enrollment: {
    id: string;
    startDate: Date;
    paymentDay: number;
  };
  plan: Plan;
  enrollmentTax?: number;
}) => {
  const today = addHours(new Date());

  const { id: enrollmentId, startDate, paymentDay } = enrollment;
  const { durationInDays, price } = plan;

  const payments = [] as CreatePaymentDto[];

  const firstPaymentDate = new Date(startDate);
  firstPaymentDate.setDate(+paymentDay);

  if (
    firstPaymentDate < startDate ||
    firstPaymentDate.getMonth() === today.getMonth()
  ) {
    firstPaymentDate.setMonth(firstPaymentDate.getMonth() + 1);
  }

  const monthsQuantity =
    planDetailsIndexedByDurationInDays[
      durationInDays as keyof typeof planDetailsIndexedByDurationInDays
    ].monthsQuantity;

  for (let i = 0; i < monthsQuantity; i++) {
    const dueDate = new Date(firstPaymentDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    const lastDayOfMonth = new Date(
      dueDate.getFullYear(),
      dueDate.getMonth() + 1,
      0,
    ).getDate();

    if (paymentDay > lastDayOfMonth) {
      dueDate.setDate(lastDayOfMonth);
    } else {
      dueDate.setDate(paymentDay);
    }

    const brDueDate = addHours(dueDate);

    payments.push({
      enrollmentId,
      amount: price,
      dueDate: brDueDate,
      status: 'PENDING',
    });
  }

  if (enrollmentTax) {
    payments.unshift({
      enrollmentId,
      amount: enrollmentTax,
      dueDate: today,
      status: 'PAID',
    });
  }

  return payments;
};
