import { Enrollment } from '@prisma/client';
import { newBrazilianDate } from '../../utils/newBrazilianDate';
import { calculateTimeUntil } from '../../utils/calculateTimeUntil';

export const getDaysToExpire = (enrollments: Enrollment[]) => {
  const nearestEnrollment = enrollments
    .filter((e) => e.endDate > newBrazilianDate())
    .sort((a, b) => a.endDate.getTime() - b.endDate.getTime())[0];

  const daysToExpire = nearestEnrollment
    ? calculateTimeUntil(nearestEnrollment.endDate)
    : null;

  return daysToExpire;
};
