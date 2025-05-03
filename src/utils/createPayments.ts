import { planDetailsIndexedByDurationInDays } from 'src/constants';
import { CreatePaymentDto } from 'src/payment/dto/create-payment.dto';
import { addHours } from './addHours';

export const createPayments = ({ enrollment, plan, enrollmentTax = 100 }) => {
  const today = addHours(new Date());

  const { id: enrollmentId, startDate, paymentDay } = enrollment;
  const { durationInDays, price } = plan;

  let payments = [] as CreatePaymentDto[];

  let firstPaymentDate = new Date(startDate);
  firstPaymentDate.setDate(+paymentDay);

  if (
    firstPaymentDate < startDate ||
    firstPaymentDate.getMonth() === today.getMonth()
  ) {
    firstPaymentDate.setMonth(firstPaymentDate.getMonth() + 1);
  }

  const monthsQuantity =
    planDetailsIndexedByDurationInDays[durationInDays].monthsQuantity;

  for (let i = 0; i < monthsQuantity; i++) {
    let dueDate = new Date(firstPaymentDate);
    dueDate.setMonth(dueDate.getMonth() + i);

    let lastDayOfMonth = new Date(
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
