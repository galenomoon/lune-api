import { Injectable } from '@nestjs/common';
import { CreateEnrollmentDto, StudentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { PrismaService } from 'src/config/prisma.service';

@Injectable()
export class EnrollmentService {
  constructor(private prisma: PrismaService) {}

  async create(createEnrollmentDto: CreateEnrollmentDto) {
    // ========== HANDLE ERRORS ==========

    const currentClass = await this.prisma.class.findFirst({
      where: { id: createEnrollmentDto.classId },
    });
    if (!currentClass?.id) {
      throw new Error('Class not found');
    }

    const currentPlan = await this.prisma.plan.findFirst({
      where: { id: createEnrollmentDto.planId },
    });
    if (!currentPlan?.id) {
      throw new Error('Plan not found');
    }

    // ========== CREATE STUDENT ==========

    const { student } = createEnrollmentDto;
    const {
      firstName,
      lastName,
      birthDate,
      cpf,
      rg,
      phone,
      instagram,
      email,
      obs,
      password,
    } = student as StudentDto;

    const currentStudent = await this.prisma.student.create({
      data: {
        firstName,
        lastName,
        birthDate,
        cpf,
        rg,
        phone,
        instagram,
        email,
        obs,
        password,
      },
    });

    if (!currentStudent?.id) {
      throw new Error('Student not found');
    }

    return await this.prisma.enrollment.create({
      data: {
        startDate: createEnrollmentDto.startDate,
        endDate: createEnrollmentDto.endDate,
        status: createEnrollmentDto.status,
        studentId: currentStudent.id,
        planId: createEnrollmentDto.planId,
        paymentDay: createEnrollmentDto.paymentDay,
        classId: createEnrollmentDto.classId,
      },
    });
  }

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
    return await this.prisma.enrollment.findMany({
      orderBy: {
        updatedAt: 'desc',
      },
      include: {
        class: true,
        plan: true,
        student: true,
      },
      where: {
        student: {
          OR: name
            ? [
                { firstName: { contains: name, mode: 'insensitive' } },
                { lastName: { contains: name, mode: 'insensitive' } },
              ]
            : undefined,
        },
        status: status ? { equals: status } : undefined,
        planId: planId ? { equals: planId } : undefined,
        paymentDay: paymentDay ? { equals: paymentDay } : undefined,
      },
    });
  }

  async findOne(id: string) {
    return await this.prisma.enrollment.findUnique({ where: { id } });
  }

  async update(id: string, updateEnrollmentDto: UpdateEnrollmentDto) {
    // ========== HANDLE ERRORS ==========

    const currentEnrollment = await this.prisma.enrollment.findUnique({
      where: { id },
    });

    if (!currentEnrollment) {
      throw new Error('Enrollment not found');
    }

    const currentClass = await this.prisma.class.findFirst({
      where: { id: updateEnrollmentDto.classId },
    });

    if (!currentClass?.id) {
      throw new Error('Class not found');
    }

    const currentPlan = await this.prisma.plan.findFirst({
      where: { id: updateEnrollmentDto.planId },
    });

    if (!currentPlan?.id) {
      throw new Error('Plan not found');
    }

    // ========== UPDATE STUDENT ==========

    const { student } = updateEnrollmentDto;

    if (student) {
      const {
        firstName,
        lastName,
        birthDate,
        cpf,
        rg,
        phone,
        instagram,
        email,
        obs,
        password,
      } = student as StudentDto;

      await this.prisma.student.update({
        where: { id: updateEnrollmentDto.studentId },
        data: {
          firstName,
          lastName,
          birthDate,
          cpf,
          rg,
          phone,
          instagram,
          email,
          obs,
          password,
        },
      });
    }

    // ========== UPDATE ENROLLMENT ==========

    return await this.prisma.enrollment.update({
      where: { id },
      data: {
        startDate: updateEnrollmentDto.startDate,
        endDate: updateEnrollmentDto.endDate,
        status: updateEnrollmentDto.status,
        studentId: updateEnrollmentDto.studentId,
        planId: updateEnrollmentDto.planId,
        paymentDay: updateEnrollmentDto.paymentDay,
        classId: updateEnrollmentDto.classId,
      },
    });
  }

  async remove(id: string) {
    return await this.prisma.enrollment.delete({ where: { id } });
  }
}
