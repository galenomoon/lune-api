/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/prisma.service';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPending() {
    // Busca todas as pendências em paralelo
    const [trialStudentsCount, workedHoursCount, expensesCount] =
      await Promise.all([
        // Aulas avulsas pendentes
        this.prisma.trialStudent.count({
          where: {
            status: 'PENDING_STATUS',
          },
        }),

        // Horas trabalhadas pendentes
        this.prisma.workedHour.count({
          where: {
            status: 'PENDING',
          },
        }),

        // Despesas pendentes ou vencidas
        this.prisma.expense.count({
          where: {
            OR: [{ status: 'PENDING' }, { status: 'OVERDUE' }],
          },
        }),
      ]);

    return {
      trialStudents: trialStudentsCount,
      workedHours: workedHoursCount,
      expenses: expensesCount,
      total: trialStudentsCount + workedHoursCount + expensesCount,
    };
  }
}
