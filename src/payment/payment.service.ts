import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/prisma.service';

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
              },
            },
            class: {
              select: {
                modality: true,
                description: true,
              }
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
          status: 'CANCELED'
        }
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
          }
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


    const totalToReceive = paymentsThisMonth.filter((p) => p.status === 'PENDING').reduce(
      (sum, p) => sum + p.amount,
      0,
    );
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
      month: formatted,
    };
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

  async update(id: string, data: any) {
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
              }
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
              }
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
