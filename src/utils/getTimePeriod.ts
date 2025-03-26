export const getTimePeriod = (startTime: string) => {
  const [hours] = startTime.split(':').map(Number);

  if (hours >= 5 && hours < 12) {
    return 'Manhã';
  } else if (hours >= 12 && hours < 18) {
    return 'Tarde';
  } else {
    return 'Noite';
  }
};
