import { isBefore, isAfter } from 'date-fns';
import { newBrazilianDate } from './newBrazilianDate';

export function calculateClassStatus(
  startDateTime: Date,
  endDateTime: Date,
): 'done' | 'now' | 'pending' {
  const now = newBrazilianDate()
  if (isBefore(endDateTime, now)) return 'done';
  if (isAfter(now, startDateTime) && isBefore(now, endDateTime)) return 'now';
  if (isAfter(startDateTime, now)) return 'pending';
  return 'pending';
}
