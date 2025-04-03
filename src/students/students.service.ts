import { Injectable } from '@nestjs/common';
import { UpdateStudentDto } from './dto/update-student.dto';
import { PrismaService } from 'src/config/prisma.service';
import { calculateTimeUntil } from 'src/utils/calculateTimeUntil';
import { planDetailsIndexedByDurationInDays } from 'src/constants';
import { getDateRangeByPlanDurationInDays } from 'src/utils/getDateRangeByPlanDurationInDays';
import { createPayments } from 'src/utils/createPayments';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll({
    name,
    status,
    planId,
    paymentDay,
  }: {
    name: string;
    status: string;
    planId: string;
    paymentDay: number;
  }) {
    const students = await this.prisma.student.findMany({
      include: {
        enrollments: {
          where: {
            status: { not: 'archived' },
          },
          orderBy: {
            createdAt: 'asc',
          },
          include: {
            plan: true,
            payments: true,
            class: {
              include: {
                modality: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    const today = new Date();
    today.setHours(today.getHours() - 3);

    return students.map((student) => {
      const enrollments = student.enrollments.map((enrollment) => {
        // Filtra os pagamentos futuros, pega o mais próximo
        let paymentId = '';

        let nextPayment = enrollment.payments
          .filter((p) => p.dueDate > today && p.status !== 'PAID')
          .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())[0];

        let paymentStatus = nextPayment ? nextPayment.status : 'NONE';

        const hasOverduePayment = enrollment.payments.filter(
          (p) => p.status !== 'PAID' && p.dueDate < today,
        );

        const hasCanceledPayment = enrollment.payments.filter(
          (p) => p.status === 'CANCELED',
        );

        if (hasOverduePayment.length) {
          paymentStatus = 'OVERDUE';
          const mostOverduePaymentDate = hasOverduePayment.sort(
            (a, b) => a.dueDate.getTime() - b.dueDate.getTime(),
          )[0];
          nextPayment = mostOverduePaymentDate;
        }

        if (hasCanceledPayment.length) {
          paymentStatus = 'CANCELED';
          const mostCanceledPaymentDate = hasCanceledPayment.sort(
            (a, b) => a.dueDate.getTime() - b.dueDate.getTime(),
          )[0];
          nextPayment = mostCanceledPaymentDate;
        }

        paymentId = nextPayment?.id;

        const [year, month, day] =
          nextPayment?.dueDate?.toISOString()?.split('T')?.[0]?.split('-') ||
          [];
        const nextPaymentValue = [day, month, year].join('/');

        return {
          paymentId,
          paymentStatus,
          student,
          id: enrollment.id,
          nextPayment: nextPayment ? nextPaymentValue : null,
          modality: enrollment.class?.modality.name,
          payments: enrollment.payments
            .sort((a, b) => a.dueDate.getTime() - b.dueDate.getTime())
            .map((payment) => {
              return {
                ...payment,
                status:
                  payment.dueDate < today && payment.status !== 'PAID'
                    ? 'OVERDUE'
                    : payment.status,
              };
            }),
          planName:
            planDetailsIndexedByDurationInDays[enrollment!.plan!.durationInDays]
              .name,
          planId: enrollment!.plan.id,
          enrollment
        };
      });

      // Determina a matrícula mais próxima do vencimento
      const nearestEnrollment = student.enrollments
        .filter((e) => e.endDate > today)
        .sort((a, b) => a.endDate.getTime() - b.endDate.getTime())[0];

      const daysToExpire = nearestEnrollment
        ? calculateTimeUntil(nearestEnrollment.endDate)
        : null;

      // Verifica se há pagamentos pendentes apenas do mês atual
      const hasPendingPayments = student.enrollments.some((enrollment) =>
        enrollment.payments.some(
          (p) =>
            p.status === 'PENDING' &&
            p.dueDate.getMonth() === today.getMonth() &&
            p.dueDate.getFullYear() === today.getFullYear(),
        ),
      );

      const hasOverduePayments = enrollments.some(
        (enrollment) => enrollment.paymentStatus === 'OVERDUE',
      );
      const hasOnlyCanceledPayments = enrollments.filter(
        (enrollment) => enrollment.paymentStatus === 'CANCELED',
      ).length === enrollments.length;

      return {
        id: student.id,
        studentName: [student.firstName, student.lastName]
          .filter(Boolean)
          .join(' '),
        daysToExpire,
        status: enrollments.length
          ? 
          hasOnlyCanceledPayments ? 'CANCELED' :
             hasOverduePayments
              ? 'OVERDUE'
              : hasPendingPayments
                ? 'PENDING'
                : 'PAID'
          : 'NONE',
        phone: student.phone,
        instagram: student.instagram,
        enrollments,
        student
      };
    });
  }

  async addEnrollment(
    studentId: string,
    { planId, classId, startDate: st, paymentDay },
  ) {
    return this.prisma.$transaction(async (prisma) => {
      // ========== HANDLE ERRORS ==========
      const classData = await prisma.class.findFirst({ where: { id: classId }});
      if (!classData) throw new Error('Class not found');

      const planData = await prisma.plan.findFirst({ where: { id: planId } });
      if (!planData) throw new Error('Plan not found');
      const { durationInDays } = planData;

      // ========== CREATE ENROLLMENT ==========

      const { startDate, endDate } = getDateRangeByPlanDurationInDays({
        startDate: st,
        durationInDays,
      });

      const newEnrollment = await prisma.enrollment.create({
        data: {
          student: { connect: { id: studentId } },
          plan: { connect: { id: planId } },
          class: { connect: { id: classId } },
          startDate,
          endDate,
          paymentDay: +paymentDay,
          status: 'active',
        },
      });

      // ========== CREATE PAYMENTS ==========

      const payments = createPayments({
        enrollment: newEnrollment,
        plan: planData,
        enrollmentTax: 50
      });

      await prisma.payment.createMany({ data: payments });

      return newEnrollment;
    });
  }

  async update(id: string, updateStudentDto: UpdateStudentDto) {
    return await this.prisma.student.update({
      where: { id },
      data: updateStudentDto,
    });
  }

  async remove(id: string) {
    return await this.prisma.student.delete({
      where: { id },
    });
  }
}
