import { set } from 'date-fns';
import { calculateClassStatus } from './calculateClassStatus';
import { getDayLabel } from './getDayLabel';

export function buildScheduleWithStatus(
  gridItems: any[],
  referenceDate: Date,
  setFirstAsNext: boolean = false
): any[] {
  const classesWithStatus = gridItems.map((item) => {
    const [startHour, startMinute] = item.startTime.split(':').map(Number);
    const [endHour, endMinute] = item.endTime.split(':').map(Number);

    const startDateTime = set(new Date(referenceDate), {
      hours: startHour,
      minutes: startMinute,
      seconds: 0,
      milliseconds: 0,
    });

    const endDateTime = set(new Date(referenceDate), {
      hours: endHour,
      minutes: endMinute,
      seconds: 0,
      milliseconds: 0,
    });

    const status = calculateClassStatus(startDateTime, endDateTime);

    return {
      id: item.id,
      status,
      modality: item.class.modality.name,
      classLevel: item.class.classLevel.name,
      startTime: item.startTime,
      endTime: item.endTime,
      startDateTime,
      dayLabel: getDayLabel(referenceDate),
    };
  });

  const sorted = classesWithStatus.sort(
    (a, b) => a.startDateTime.getTime() - b.startDateTime.getTime()
  );

  let indexToMarkNext: number | null = null;

  const nowIndex = sorted.findIndex((item) => item.status === 'now');
  if (nowIndex !== -1 && nowIndex + 1 < sorted.length) {
    indexToMarkNext = nowIndex + 1;
  } else {
    const lastDoneIndex = [...sorted]
      .map((item, i) => (item.status === 'done' ? i : -1))
      .filter((i) => i !== -1)
      .pop();

    if (lastDoneIndex !== undefined && lastDoneIndex + 1 < sorted.length) {
      indexToMarkNext = lastDoneIndex + 1;
    }
  }

  if (indexToMarkNext !== null) {
    (sorted[indexToMarkNext].status as any) = 'next';
  } else if (setFirstAsNext && sorted.length > 0) {
    (sorted[0].status as any) = 'next';
  }

  return sorted;
}