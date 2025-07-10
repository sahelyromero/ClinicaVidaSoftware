export const calculateMonthlyHours = (mes: number, año: number): number => {
  // Corregir: para obtener los días del mes actual, usar mes + 1
  const daysInMonth = new Date(año, mes + 1, 0).getDate()

  const colombianHolidays = {
    1: [1, 6],
    3: [24],
    4: [17, 18],
    5: [1],
    6: [2, 23, 30],
    7: [20],
    8: [7, 18],
    10: [13],
    11: [3, 17],
    12: [8, 25]
  }

  let sundays = 0
  let holidays = 0
  let holidaysOnSunday = 0

  // Corregir: usar mes + 1 para los festivos también
  const holidaysInMonth = colombianHolidays[mes + 1] || []

  for (let day = 1; day <= daysInMonth; day++) {
    // Esta línea está correcta - usa mes tal como viene (base 0)
    const date = new Date(año, mes, day)
    const isSunday = date.getDay() === 0
    const isHoliday = holidaysInMonth.includes(day)

    if (isSunday) sundays++
    if (isHoliday) holidays++
    if (isSunday && isHoliday) holidaysOnSunday++
  }

  const workingDays = daysInMonth - sundays - holidays + holidaysOnSunday
  const minimumHours = Math.round(workingDays * (44 / 6))

  console.log(`Mes ${mes + 1}/${año}:`, {
    daysInMonth,
    sundays,
    holidays,
    holidaysOnSunday,
    workingDays,
    minimumHours
  })

  return minimumHours
}
