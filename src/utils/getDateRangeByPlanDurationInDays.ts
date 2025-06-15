import { planDetailsIndexedByDurationInDays } from 'src/constants';

export const getDateRangeByPlanDurationInDays = ({
  startDate,
  durationInDays,
}) => {
  const durationInDaysNumber = durationInDays || 30
  const curr = planDetailsIndexedByDurationInDays[durationInDaysNumber]
  const st = new Date(startDate);

  const endDate = new Date(st.setMonth(st.getMonth() + curr.monthsQuantity));

  return {
    startDate,
    endDate
  }
};
