import { planDetailsIndexedByDurationInDays } from 'src/constants';

export const getDateRangeByPlanDurationInDays = ({
  startDate,
  durationInDays,
}) => {
  const st = new Date(startDate);

  const endDate = new Date(
    st.setMonth(
      st.getMonth() +
        planDetailsIndexedByDurationInDays[durationInDays].monthsQuantity,
    ),
  );

  return {
    startDate,
    endDate
  }
};
