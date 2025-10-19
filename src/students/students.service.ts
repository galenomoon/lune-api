import { Injectable } from '@nestjs/common';
import { UpdateStudentDto } from './dto/update-student.dto';
import { PrismaService } from 'src/config/prisma.service';
import { getDateRangeByPlanDurationInDays } from 'src/utils/getDateRangeByPlanDurationInDays';
import { createPayments } from 'src/utils/createPayments';
import { getIsOverdue } from 'src/utils/getIsOverdue';
import { formatListStudentsResponse } from 'src/students/utils/format-list-students-response';

@Injectable()
export class StudentsService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    const students = await this.prisma.student.findMany({
      include: {
        enrollments: {
          include: {
            payments: true,
            student: true,
            plan: true,
            class: {
              include: {
                modality: true,
              },
            },
          },
          where: {
            status: {
              notIn: ['archived', 'canceled'],
            },
          },
        },
      },
      orderBy: {
        firstName: 'asc',
      },
      where: {
        enrollments: {
          some: {
            status: {
              notIn: ['archived', 'canceled'],
            },
          },
        },
      },
    });

    return students
      .map(formatListStudentsResponse)
      .filter((student) => student.status !== 'CANCELED');
  }

  async findOneV2(id: string) {
    const student = await this.prisma.student.findUnique({
      where: { id },
    });
    if (!student) throw new Error('Student not found');
    const addresses = await this.prisma.address.findMany({
      where: { studentId: id },
    });
    const payments = await this.prisma.payment.findMany({
      where: { enrollment: { studentId: id, status: { not: 'archived' } } },
      include: {
        enrollment: {
          include: {
            class: {
              include: {
                modality: true,
              },
            },
            plan: true,
          },
        },
      },
      orderBy: {
        dueDate: 'asc',
      },
    });

    const enrollments = await this.prisma.enrollment.findMany({
      where: { studentId: id, status: { not: 'archived' } },
      include: {
        class: {
          include: {
            modality: true,
            classLevel: true,
            gridClasses: true,
            teacher: true,
          },
        },
        plan: true,
      },
      orderBy: {
        status: 'asc',
      },
    });

    const formattedPayments = payments.map((payment) => {
      return {
        ...payment,
        modality: payment.enrollment.class?.modality?.name,
        planName: payment.enrollment.plan?.name,
        status: getIsOverdue(payment) ? 'OVERDUE' : payment.status,
      };
    });

    return {
      personalData: student,
      addresses,
      payments: formattedPayments,
      enrollments,
    };
  }

  async getEnrollmentFormData() {
    const [plans, modalities, classes, teachers, classLevels] =
      await Promise.all([
        this.prisma.plan.findMany({
          where: { status: true },
          orderBy: { name: 'asc' },
        }),
        this.prisma.modality.findMany({
          orderBy: { name: 'asc' },
        }),
        this.prisma.class.findMany({
          include: {
            modality: true,
            classLevel: true,
            gridClasses: true,
            teacher: true,
          },
          orderBy: { name: 'asc' },
        }),
        this.prisma.teacher.findMany({
          orderBy: { firstName: 'asc' },
        }),
        this.prisma.classLevel.findMany({
          orderBy: { name: 'asc' },
        }),
      ]);

    return {
      plans,
      modalities,
      classes,
      teachers,
      classLevels,
    };
  }

  async addEnrollment(
    studentId: string,
    {
      planId,
      classId,
      startDate: st,
      paymentDay,
      durationInDays,
    }: {
      planId: string;
      classId: string;
      startDate: Date;
      paymentDay: number;
      durationInDays: number;
    },
  ) {
    return this.prisma.$transaction(async (prisma) => {
      // ========== HANDLE ERRORS ==========
      const classData = await prisma.class.findFirst({
        where: { id: classId },
      });
      if (!classData) throw new Error('Class not found');

      const planData = await prisma.plan.findFirst({ where: { id: planId } });
      if (!planData) throw new Error('Plan not found');

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
        plan: { ...planData, durationInDays },
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

  async search({ name = '' }) {
    const students = await this.prisma.student.findMany({
      where: {
        OR: name
          ? [
              { firstName: { contains: name, mode: 'insensitive' } },
              { lastName: { contains: name, mode: 'insensitive' } },
            ]
          : undefined,
      },
      include: {
        enrollments: {
          include: {
            class: {
              include: {
                modality: true,
              },
            },
          },
        },
      },
    });

    return students.map((student) => ({
      type: 'STUDENT',
      modalities: student.enrollments
        .map((en) => en.class?.modality?.name)
        .join(', '),
      ...student,
    }));
  }
}
