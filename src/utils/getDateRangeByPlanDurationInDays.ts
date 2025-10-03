import { planDetailsIndexedByDurationInDays } from 'src/constants';

export const getDateRangeByPlanDurationInDays = ({
  startDate,
  durationInDays,
}: {
  startDate: Date;
  durationInDays: number | null;
}) => {
  const durationInDaysNumber = durationInDays || 30;
  const curr =
    planDetailsIndexedByDurationInDays[
      durationInDaysNumber as keyof typeof planDetailsIndexedByDurationInDays
    ];
  const st = new Date(startDate);

  const endDate = new Date(st.setMonth(st.getMonth() + curr.monthsQuantity));

  return {
    startDate,
    endDate,
  };
};
