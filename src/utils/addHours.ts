export const addHours = (date: Date, hour = 3) => {
  date.setHours(date.getHours() + hour)
  return date
}