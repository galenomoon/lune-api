/**
 * Calcula o salário total de um professor baseado em horas trabalhadas e comissões
 *
 * Fórmula padrão do sistema:
 * Salário Total = (Horas Trabalhadas × Valor por Hora) + (Novas Matrículas × Comissão por Matrícula)
 */
export function calculateTeacherSalary({
  durationInMinutes,
  pricePerHour,
  newEnrollmentsCount,
  commissionPerEnrollment,
}: {
  durationInMinutes: number;
  pricePerHour: number;
  newEnrollmentsCount: number;
  commissionPerEnrollment: number;
}): {
  totalSalary: number;
  salaryFromHours: number;
  salaryFromCommissions: number;
} {
  const hours = durationInMinutes / 60;
  const salaryFromHours = hours * pricePerHour;
  const salaryFromCommissions = newEnrollmentsCount * commissionPerEnrollment;
  const totalSalary = salaryFromHours + salaryFromCommissions;

  return {
    totalSalary,
    salaryFromHours,
    salaryFromCommissions,
  };
}

/**
 * Calcula o total de salários para múltiplos registros de horas trabalhadas
 */
export function calculateTotalTeacherSalaries(
  workedHours: Array<{
    duration: number;
    priceSnapshot: number;
    newEnrollmentsCount: number;
  }>,
  commissionPerEnrollment: number,
): {
  total: number;
  fromHours: number;
  fromCommissions: number;
} {
  return workedHours.reduce(
    (acc, wh) => {
      const { totalSalary, salaryFromHours, salaryFromCommissions } =
        calculateTeacherSalary({
          durationInMinutes: wh.duration,
          pricePerHour: wh.priceSnapshot,
          newEnrollmentsCount: wh.newEnrollmentsCount,
          commissionPerEnrollment,
        });

      return {
        total: acc.total + totalSalary,
        fromHours: acc.fromHours + salaryFromHours,
        fromCommissions: acc.fromCommissions + salaryFromCommissions,
      };
    },
    { total: 0, fromHours: 0, fromCommissions: 0 },
  );
}
