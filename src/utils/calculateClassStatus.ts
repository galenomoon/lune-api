import { isBefore, isAfter, isSameDay } from 'date-fns';

export function calculateClassStatus(startDateTime: Date, endDateTime: Date, now: Date = new Date()): 'done' | 'now' | 'pending' {
  if (isBefore(endDateTime, now)) return 'done';
  if (isAfter(startDateTime, now)) return 'pending';
  if (isAfter(now, startDateTime) && isBefore(now, endDateTime)) return 'now';
  return 'pending';
}