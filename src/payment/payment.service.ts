/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/prisma.service';
import { CreatePaymentDto } from './dto/create-payment.dto';
import { getIsOverdue } from 'src/utils/getIsOverdue';
import { calculateTotalTeacherSalaries } from 'src/utils/calculateTeacherSalary';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

  async getFinancialDashboard({
    month,
    year,
  }: {
    month?: number;
    year?: number;
  }) {
    const now = new Date();
    const targetMonth = month ?? now.getMonth() + 1;
    const targetYear = year ?? now.getFullYear();

    const start = new Date(targetYear, targetMonth - 1, 1);
    const end = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    const paymentsThisMonth = await this.prisma.payment.findMany({
      include: {
        enrollment: {
          select: {
            student: {
              select: {
                firstName: true,
                lastName: true,
                cpf: true,
                phone: true,
              },
            },
            class: {
              select: {
                modality: true,
                description: true,
              },
            },
            plan: {
              select: {
                durationInDays: true,
              },
            },
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
      where: {
        dueDate: {
          gte: start,
          lte: end,
        },
        NOT: {
          status: 'CANCELED',
        },
      },
    });

    const activeEnrollments = await this.prisma.enrollment.findMany({
      where: {
        status: 'active',
      },
      include: {
        student: {
          select: {
            firstName: true,
            lastName: true,
            cpf: true,
          },
        },
        class: {
          select: {
            modality: true,
            description: true,
          },
        },
        plan: {
          select: {
            durationInDays: true,
          },
        },
      },
    });

    const classes = await this.prisma.class.findMany({
      where: {
        enrollments: {
          some: {
            status: 'active',
          },
        },
      },
      include: {
        enrollments: {
          where: {
            status: 'active',
          },
          include: {
            student: {
              select: {
                firstName: true,
                lastName: true,
                cpf: true,
              },
            },
          },
        },
      },
    });
    const trialClasses = await this.prisma.gridItem.findMany({
      where: {
        trialStudents: {
          some: {
            date: {
              gte: start,
              lte: end,
            },
          },
        },
      },
    });

    const totalToReceive = paymentsThisMonth
      .filter((p) => p.status === 'PENDING')
      .reduce((sum, p) => sum + p.amount, 0);
    const totalReceived = paymentsThisMonth
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);

    const formatted = start.toLocaleString('pt-BR', {
      month: 'long',
      year: 'numeric',
    });

    return {
      paymentsThisMonth,
      totalToReceive,
      totalReceived,
      classes,
      activeEnrollments: activeEnrollments.length,
      trialClasses: trialClasses.length,
      month: formatted,
    };
  }

  async getFinancialDashboardV2({
    month,
    year,
  }: {
    month?: number;
    year?: number;
  }) {
    const now = new Date();
    const targetMonth = month ?? now.getMonth() + 1;
    const targetYear = year ?? now.getFullYear();

    const start = new Date(targetYear, targetMonth - 1, 1);
    const end = new Date(targetYear, targetMonth, 0, 23, 59, 59, 999);

    // Pagamentos do mês atual (inclui OVERDUE, PENDING e PAID, exceto CANCELED)
    const paymentsThisMonth = await this.prisma.payment.findMany({
      include: {
        enrollment: {
          select: {
            student: {
              select: {
                firstName: true,
                lastName: true,
                cpf: true,
                phone: true,
              },
            },
            class: {
              select: {
                modality: true,
                description: true,
              },
            },
            plan: {
              select: {
                durationInDays: true,
              },
            },
          },
        },
      },
      where: {
        dueDate: {
          gte: start,
          lte: end,
        },
        NOT: {
          status: 'CANCELED',
        },
      },
    });

    // Buscar configurações (para comissão e preço da trial class)
    const settings = await this.prisma.settings.findFirst();
    const commissionPerEnrollment = settings
      ? Number(settings.teacherCommissionPerEnrollment)
      : 0;
    const trialClassPrice = settings?.trialClassPrice || 0;

    // Buscar worked hours DONE do mês para calcular custos com professores
    const workedHoursThisMonth = await this.prisma.workedHour.findMany({
      where: {
        workedAt: {
          gte: start,
          lte: end,
        },
        status: 'DONE',
      },
    });

    // Buscar despesas do mês (independente do status)
    const expensesThisMonth = await this.prisma.expense.findMany({
      where: {
        createdAt: {
          gte: start,
          lte: end,
        },
      },
    });

    // Buscar trial classes agendadas do mês (apenas com status SCHEDULED)
    const scheduledTrialClasses = await this.prisma.trialStudent.count({
      where: {
        date: {
          gte: start,
          lte: end,
        },
        status: 'SCHEDULED',
      },
    });

    // Buscar trial classes realizadas do mês (status diferente de SCHEDULED e CANCELLED)
    const completedTrialClasses = await this.prisma.trialStudent.count({
      where: {
        date: {
          gte: start,
          lte: end,
        },
        NOT: {
          status: {
            in: ['SCHEDULED', 'CANCELLED'],
          },
        },
      },
    });

    // Pagamentos dos últimos 4 meses para comparação
    const last4MonthsData: Array<{ date: string; revenue: number }> = [];
    for (let i = 0; i < 4; i++) {
      const monthStart = new Date(targetYear, targetMonth - 1 - i, 1);
      const monthEnd = new Date(
        targetYear,
        targetMonth - i,
        0,
        23,
        59,
        59,
        999,
      );

      const monthPayments = await this.prisma.payment.findMany({
        where: {
          dueDate: {
            gte: monthStart,
            lte: monthEnd,
          },
          status: 'PAID',
        },
      });

      const monthCompletedTrialClasses = await this.prisma.trialStudent.count({
        where: {
          date: {
            gte: monthStart,
            lte: monthEnd,
          },
          NOT: {
            status: {
              in: ['SCHEDULED', 'CANCELLED'],
            },
          },
        },
      });

      const totalRevenue = monthPayments.reduce((sum, p) => sum + p.amount, 0);
      const trialClassesRevenue = monthCompletedTrialClasses * trialClassPrice;

      last4MonthsData.push({
        date: monthStart.toISOString().slice(0, 7), // YYYY-MM format
        revenue: totalRevenue + trialClassesRevenue,
      });
    }

    // Calcular estatísticas
    const pendingPayments = paymentsThisMonth
      .filter((p) => p.status !== 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);

    const expectedFromTrialClasses = scheduledTrialClasses * trialClassPrice;

    const totalToReceive = pendingPayments + expectedFromTrialClasses;

    const totalReceived = paymentsThisMonth
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);

    const revenueFromTrialClasses = completedTrialClasses * trialClassPrice;

    const currentMonthRevenue = totalReceived + revenueFromTrialClasses;

    // Calcular custos do mês usando a fórmula padrão do sistema
    const teacherSalaries = calculateTotalTeacherSalaries(
      workedHoursThisMonth.map((wh) => ({
        duration: wh.duration,
        priceSnapshot: wh.priceSnapshot,
        newEnrollmentsCount: wh.newEnrollmentsCount as number,
      })),
      commissionPerEnrollment,
    );

    const teacherCosts = teacherSalaries.total;

    const expensesCosts = expensesThisMonth.reduce(
      (sum, expense) => sum + expense.amount,
      0,
    );

    const totalCosts = teacherCosts + expensesCosts;
    const profit = currentMonthRevenue - totalCosts;

    // Contar matrículas ativas e turmas
    const activeEnrollments = await this.prisma.enrollment.count({
      where: {
        status: 'active',
      },
    });

    const activeClasses = await this.prisma.class.count({
      where: {
        enrollments: {
          some: {
            status: 'active',
          },
        },
      },
    });

    // Contar aulas avulsas (trial classes) do mês
    const trialClasses = await this.prisma.trialStudent.count({
      where: {
        date: {
          gte: start,
          lte: end,
        },
        NOT: {
          status: 'CANCELLED',
        },
      },
    });

    // Total de trial classes agendadas e realizadas separadamente
    const trialClassesScheduled = scheduledTrialClasses;
    const trialClassesCompleted = completedTrialClasses;

    // Receita total do mês anterior
    const previousMonth = new Date(targetYear, targetMonth - 2, 1);
    const previousMonthEnd = new Date(
      targetYear,
      targetMonth - 1,
      0,
      23,
      59,
      59,
      999,
    );

    // Pagamentos do mês anterior
    const previousMonthPayments = await this.prisma.payment.findMany({
      where: {
        dueDate: {
          gte: previousMonth,
          lte: previousMonthEnd,
        },
        NOT: {
          status: 'CANCELED',
        },
      },
    });

    const previousPendingPayments = previousMonthPayments
      .filter((p) => p.status !== 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);

    const previousScheduledTrialClasses = await this.prisma.trialStudent.count({
      where: {
        date: {
          gte: previousMonth,
          lte: previousMonthEnd,
        },
        status: 'SCHEDULED',
      },
    });

    const previousCompletedTrialClasses = await this.prisma.trialStudent.count({
      where: {
        date: {
          gte: previousMonth,
          lte: previousMonthEnd,
        },
        NOT: {
          status: {
            in: ['SCHEDULED', 'CANCELLED'],
          },
        },
      },
    });

    const previousExpectedFromTrialClasses =
      previousScheduledTrialClasses * trialClassPrice;
    const previousTotalToReceive =
      previousPendingPayments + previousExpectedFromTrialClasses;

    const previousTotalReceived = previousMonthPayments
      .filter((p) => p.status === 'PAID')
      .reduce((sum, p) => sum + p.amount, 0);

    const previousRevenueFromTrialClasses =
      previousCompletedTrialClasses * trialClassPrice;

    const previousMonthRevenue =
      previousTotalReceived + previousRevenueFromTrialClasses;

    // Calcular custos do mês anterior usando a fórmula padrão do sistema
    const previousWorkedHours = await this.prisma.workedHour.findMany({
      where: {
        workedAt: {
          gte: previousMonth,
          lte: previousMonthEnd,
        },
        status: 'DONE',
      },
    });

    const previousTeacherSalaries = calculateTotalTeacherSalaries(
      previousWorkedHours.map((wh) => ({
        duration: wh.duration,
        priceSnapshot: wh.priceSnapshot,
        newEnrollmentsCount: wh.newEnrollmentsCount as number,
      })),
      commissionPerEnrollment,
    );

    const previousTeacherCosts = previousTeacherSalaries.total;

    const previousExpenses = await this.prisma.expense.findMany({
      where: {
        createdAt: {
          gte: previousMonth,
          lte: previousMonthEnd,
        },
      },
    });

    const previousExpensesCosts = previousExpenses.reduce(
      (sum, expense) => sum + expense.amount,
      0,
    );

    const previousTotalCosts = previousTeacherCosts + previousExpensesCosts;
    const previousProfit = previousMonthRevenue - previousTotalCosts;

    // Matrículas e turmas do mês anterior
    const previousActiveEnrollments = await this.prisma.enrollment.count({
      where: {
        status: 'active',
        updatedAt: {
          lte: previousMonthEnd,
        },
      },
    });

    const previousActiveClasses = await this.prisma.class.count({
      where: {
        enrollments: {
          some: {
            status: 'active',
            updatedAt: {
              lte: previousMonthEnd,
            },
          },
        },
      },
    });

    // Aulas avulsas do mês anterior
    const previousTrialClasses = await this.prisma.trialStudent.count({
      where: {
        date: {
          gte: previousMonth,
          lte: previousMonthEnd,
        },
      },
    });

    // Cálculo das tendências reais
    function calcTrend(current: number, previous: number) {
      if (previous === 0) {
        if (current === 0) return { value: 0, isPositive: true };
        return { value: 100, isPositive: true };
      }
      const diff = current - previous;
      const percent = (diff / previous) * 100;
      return { value: Math.abs(percent), isPositive: percent >= 0 };
    }

    const totalRevenueTrend = calcTrend(
      currentMonthRevenue,
      previousMonthRevenue,
    );
    const totalToReceiveTrend = calcTrend(
      totalToReceive,
      previousTotalToReceive,
    );
    const profitTrend = calcTrend(profit, previousProfit);

    // Média de alunos por turma
    const currentAvg =
      activeClasses > 0 ? activeEnrollments / activeClasses : 0;
    const previousAvg =
      previousActiveClasses > 0
        ? previousActiveEnrollments / previousActiveClasses
        : 0;
    const enrollmentsToClassesTrend = calcTrend(currentAvg, previousAvg);

    const trialClassesTrend = calcTrend(trialClasses, previousTrialClasses);

    // Ordenar pagamentos por prioridade (atrasados > pendentes > pagos)
    const remappedPayments = paymentsThisMonth.map((payment) => {
      const isOverdue = getIsOverdue(payment);
      return {
        ...payment,
        status: isOverdue ? 'OVERDUE' : payment.status,
      };
    });

    const sortedPayments = remappedPayments.sort((a, b) => {
      const statusPriority = {
        OVERDUE: 0,
        PENDING: 1,
        PAID: 2,
        CANCELED: 3,
      };
      const aPriority =
        statusPriority[a.status as keyof typeof statusPriority] ?? 3;
      const bPriority =
        statusPriority[b.status as keyof typeof statusPriority] ?? 3;

      if (aPriority !== bPriority) {
        return aPriority - bPriority;
      }

      // Se ambos são pagos, ordenar por data de pagamento (mais recente primeiro)
      if (a.status === 'PAID' && b.status === 'PAID') {
        return (
          new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
        );
      }

      // Para pendentes, ordenar por data de vencimento
      return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
    });

    const formatted = start.toLocaleString('pt-BR', {
      month: 'long',
      year: 'numeric',
    });

    // Dados das modalidades para pie chart
    const modalitiesData = await this.getModalitiesStats(start, end);

    return {
      cards: {
        totalRevenue: {
          value: currentMonthRevenue,
          fromEnrollments: totalReceived,
          fromTrialClasses: revenueFromTrialClasses,
          trend: {
            value: totalRevenueTrend.value,
            isPositive: totalRevenueTrend.isPositive,
          },
        },
        profit: {
          value: profit,
          teacherCosts: teacherCosts,
          expensesCosts: expensesCosts,
          trend: {
            value: profitTrend.value,
            isPositive: profitTrend.isPositive,
          },
        },
        totalToReceive: {
          value: totalToReceive,
          fromEnrollments: pendingPayments,
          fromTrialClasses: expectedFromTrialClasses,
          trend: {
            value: totalToReceiveTrend.value,
            isPositive: totalToReceiveTrend.isPositive,
          },
        },
        enrollmentsToClasses: {
          value: currentAvg.toFixed(2),
          enrollments: activeEnrollments,
          classes: activeClasses,
          trend: {
            value: enrollmentsToClassesTrend.value,
            isPositive: enrollmentsToClassesTrend.isPositive,
          },
        },
        trialClasses: {
          value: trialClasses,
          scheduled: trialClassesScheduled,
          completed: trialClassesCompleted,
          trend: {
            value: trialClassesTrend.value,
            isPositive: trialClassesTrend.isPositive,
          },
        },
      },
      chart: last4MonthsData.reverse(),
      payments: sortedPayments,
      modalities: modalitiesData,
      month: formatted,
    };
  }

  async getModalitiesStats(startDate?: Date, endDate?: Date) {
    const modalities = await this.prisma.modality.findMany({
      include: {
        classes: {
          include: {
            enrollments: {
              where: {
                status: 'active',
              },
            },
            gridClasses: {
              include: {
                trialStudents: {
                  where: {
                    ...(startDate &&
                      endDate && {
                        date: {
                          gte: startDate,
                          lte: endDate,
                        },
                      }),
                    NOT: {
                      status: 'CANCELLED',
                    },
                  },
                },
              },
            },
          },
        },
      },
    });

    return modalities.map((modality) => {
      const activeClasses = modality.classes.filter(
        (cls) => cls.enrollments.length > 0,
      );
      const totalEnrollments = modality.classes.reduce(
        (sum, cls) => sum + cls.enrollments.length,
        0,
      );

      // Contar aulas experimentais por modalidade (excluindo canceladas)
      const totalTrialClasses = modality.classes.reduce((sum, cls) => {
        return (
          sum +
          cls.gridClasses.reduce((gridSum, gridItem) => {
            return gridSum + gridItem.trialStudents.length;
          }, 0)
        );
      }, 0);

      // Calcular média de alunos por turma (enrollments + trial classes)
      const totalStudents = totalEnrollments + totalTrialClasses;
      const avgStudentsPerClass =
        activeClasses.length > 0 ? totalStudents / activeClasses.length : 0;

      return {
        id: modality.id,
        name: modality.name,
        classes: activeClasses.length,
        enrollments: totalEnrollments,
        trialClasses: totalTrialClasses,
        totalStudents: totalStudents,
        avgStudentsPerClass: avgStudentsPerClass.toFixed(2),
        // Para o pie chart, usar a média de alunos por turma como valor
        value: avgStudentsPerClass,
      };
    });
  }

  async findAll() {
    return await this.prisma.payment.findMany({
      include: {
        enrollment: {
          include: {
            student: {
              select: {
                firstName: true,
                lastName: true,
                cpf: true,
              },
            },
            class: {
              select: {
                modality: true,
                description: true,
                teacher: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
            plan: {
              select: {
                durationInDays: true,
              },
            },
          },
        },
      },
    });
  }

  async markPaymentAsPaid(paymentId: string) {
    const payment = await this.prisma.payment.findUnique({
      where: { id: paymentId },
    });

    const newStatus = payment?.status === 'PAID' ? 'PENDING' : 'PAID';

    return await this.prisma.payment.update({
      where: { id: paymentId },
      data: { status: newStatus },
    });
  }

  async update(id: string, data: CreatePaymentDto) {
    const payment = await this.prisma.payment.findUnique({
      where: { id },
    });

    if (!payment) {
      throw new Error('Payment not found');
    }

    return await this.prisma.payment.update({
      where: { id },
      data,
      include: {
        enrollment: {
          select: {
            student: {
              select: {
                firstName: true,
                lastName: true,
                cpf: true,
              },
            },
            class: {
              select: {
                modality: true,
                description: true,
              },
            },
            plan: {
              select: {
                durationInDays: true,
              },
            },
          },
        },
      },
    });
  }

  async delete(id: string) {
    return await this.prisma.payment.delete({
      where: { id },
      include: {
        enrollment: {
          select: {
            student: {
              select: {
                firstName: true,
                lastName: true,
                cpf: true,
              },
            },
            class: {
              select: {
                modality: true,
                description: true,
              },
            },
            plan: {
              select: {
                durationInDays: true,
              },
            },
          },
        },
      },
    });
  }
}
