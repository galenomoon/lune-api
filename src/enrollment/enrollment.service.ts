import { Injectable } from '@nestjs/common';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { PrismaService } from 'src/config/prisma.service';
import { CreateStudentDto } from 'src/students/dto/create-student.dto';
import { CreatePaymentDto } from 'src/payment/dto/create-payment.dto';
import { planDetailsIndexedByDurationInDays } from 'src/constants';
import { createPayments } from 'src/utils/createPayments';
import { getDateRangeByPlanDurationInDays } from 'src/utils/getDateRangeByPlanDurationInDays';

@Injectable()
export class EnrollmentService {
  constructor(private prisma: PrismaService) {}

  async create(createEnrollmentDto: CreateEnrollmentDto) {
    const { student, emergencyContact, address, enrollment } =
      createEnrollmentDto;

    return this.prisma.$transaction(async (prisma) => {
      // ========== HANDLE ERRORS ==========
      const classData = await prisma.class.findFirst({
        where: { id: enrollment.classId },
      });
      if (!classData) throw new Error('Class not found');

      const planData = await prisma.plan.findFirst({
        where: { id: enrollment.planId },
      });
      if (!planData) throw new Error('Plan not found');

      const { durationInDays } = planData;

      // ========== CREATE STUDENT ==========
      const createdStudent = await prisma.student.create({
        data: student as CreateStudentDto,
      });
      const studentId = createdStudent.id;

      // ========== CREATE EMERGENCY CONTACT ==========
      if (emergencyContact?.name) {
        await prisma.emergencyContact.create({
          data: { ...emergencyContact, studentId },
        });
      }

      // ========== CREATE ADDRESS ==========
      await prisma.address.create({ data: { ...address, studentId } });

      // ========== CREATE ENROLLMENT ==========

      const { startDate, endDate } = getDateRangeByPlanDurationInDays({
        startDate: enrollment.startDate,
        durationInDays,
      });

      const createdEnrollment = await prisma.enrollment.create({
        data: {
          student: { connect: { id: studentId } },
          plan: { connect: { id: planData.id } },
          class: { connect: { id: classData.id } },
          startDate,
          endDate,
          paymentDay: +enrollment.paymentDay,
          status: 'active',
          signature: enrollment.signature,
        },
      });

      // ========== CREATE PAYMENTS ==========
      const payments = createPayments({
        enrollment: createdEnrollment,
        plan: planData,
      });

      await prisma.payment.createMany({ data: payments });

      return createdEnrollment;
    });
  }

  async update(id: string, updateEnrollmentDto: UpdateEnrollmentDto) {
    return await this.prisma.enrollment.update({
      where: { id },
      data: {
        classId: updateEnrollmentDto?.classId,
      },
    });
  }

  async renew(enrollmentId: string, planId: string) {
    return this.prisma.$transaction(async (prisma) => {
      // ========== VERIFICAR MATRÍCULA ATUAL ==========
      const currentEnrollment = await prisma.enrollment.findFirst({
        where: { id: enrollmentId, status: 'active' },
        include: { payments: true },
      });

      if (!currentEnrollment) throw new Error('No active enrollment found');

      // ========== VERIFICAR PAGAMENTOS PENDENTES ==========
      const hasPendingPayments = currentEnrollment.payments.some(
        (payment) => payment.status !== 'PAID' && payment.dueDate < new Date(),
      );

      if (hasPendingPayments) {
        throw new Error('Cannot renew: There are pending payments.');
      }

      // ========== RECUPERAR DADOS DO NOVO PLANO ==========
      const planData = await prisma.plan.findFirst({ where: { id: planId } });
      if (!planData) throw new Error('Plan not found');

      const { durationInDays, price } = planData;
      const monthsQuantity =
        planDetailsIndexedByDurationInDays[durationInDays].monthsQuantity;

      // ========== CRIAR NOVA MATRÍCULA ==========
      const startDate = new Date();
      let endDate = new Date(startDate);
      endDate.setMonth(endDate.getMonth() + monthsQuantity);

      const newEnrollment = await prisma.enrollment.create({
        data: {
          student: { connect: { id: currentEnrollment.studentId } },
          plan: { connect: { id: planData.id } },
          class: { connect: { id: currentEnrollment.classId as string } }, // Mantém a mesma turma
          startDate,
          endDate,
          paymentDay: currentEnrollment.paymentDay,
          status: 'active',
        },
      });

      await prisma.enrollment.update({
        where: { id: currentEnrollment.id },
        data: { status: 'archived' },
      });

      // ========== GERAR NOVOS PAGAMENTOS ==========
      let payments = [] as CreatePaymentDto[];
      let firstPaymentDate = new Date(startDate);
      firstPaymentDate.setDate(currentEnrollment.paymentDay - 1);

      if (firstPaymentDate < startDate) {
        firstPaymentDate.setMonth(firstPaymentDate.getMonth() + 1);
      }

      for (let i = 0; i < monthsQuantity; i++) {
        let dueDate = new Date(firstPaymentDate);
        dueDate.setMonth(dueDate.getMonth() + i);

        let lastDayOfMonth = new Date(
          dueDate.getFullYear(),
          dueDate.getMonth() + 1,
          0,
        ).getDate();

        if (currentEnrollment.paymentDay > lastDayOfMonth) {
          dueDate.setDate(lastDayOfMonth);
        } else {
          dueDate.setDate(currentEnrollment.paymentDay - 1);
        }

        payments.push({
          enrollmentId: newEnrollment.id,
          amount: price,
          dueDate,
          status: 'PENDING',
        });
      }

      await prisma.payment.createMany({ data: payments });

      return newEnrollment;
    });
  }

  async cancelEnrollment(enrollmentId: string) {
    return this.prisma.$transaction(async (prisma) => {
      const enrollment = await prisma.enrollment.findFirst({
        where: { id: enrollmentId, status: 'active' },
        include: { payments: true },
      });

      if (!enrollment) throw new Error('No active enrollment found');

      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: { status: 'canceled' },
      });

      // Cancela os pagamentos futuros, mas mantém os já pagos
      await prisma.payment.updateMany({
        where: { enrollmentId, status: 'PENDING' },
        data: { status: 'CANCELED' },
      });

      return { message: 'Enrollment canceled successfully' };
    });
  }

  async findOne(id: string) {
    return await this.prisma.enrollment.findUnique({
      where: { id },
      include: {
        payments: {
          orderBy: {
            id: 'asc'
          }
        },
        class: {
          include: {
            modality: true,
            classLevel: true
          }
        }
      },
    });
  }

  async remove(id: string) {
    return await this.prisma.enrollment.delete({ where: { id } });
  }
}
