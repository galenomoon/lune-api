import { newBrazilianDate } from './newBrazilianDate';
import { addDays } from 'date-fns';

interface Payment {
  dueDate: Date;
  status: string;
}

export const getIsOverdue = (payment: Payment) => {
  const dueDateOneDayFowardAtBrazilianMidnight = addDays(payment.dueDate, 1);
  return (
    dueDateOneDayFowardAtBrazilianMidnight < newBrazilianDate() &&
    payment.status === 'PENDING'
  );
};
