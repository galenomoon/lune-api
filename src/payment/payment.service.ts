import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/prisma.service';

@Injectable()
export class PaymentService {
  constructor(private prisma: PrismaService) {}

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

  async delete(id: string) {
    return await this.prisma.payment.delete({
      where: { id },
    });
  }
}
