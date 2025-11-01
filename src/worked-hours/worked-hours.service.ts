/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unnecessary-type-assertion */
import { ForbiddenException, Injectable } from '@nestjs/common';
import { PrismaService } from '../config/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WorkedHourStatus } from '@prisma/client';
import { CreateWorkedHourDto } from './dto/create-worked-hour.dto';
import { startOfMonth, endOfMonth, subMonths } from 'date-fns';
import { calculateTotalTeacherSalaries } from '../utils/calculateTeacherSalary';
import { newBrazilianDate } from '../utils/newBrazilianDate';

@Injectable()
export class WorkedHoursService {
  constructor(private readonly prismaService: PrismaService) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    timeZone: 'America/Sao_Paulo',
  })
  async createBatch() {
    const dateBrazilian = newBrazilianDate();
    const weekday = dateBrazilian.getDay();

    const startOfDayBrazilian = new Date(dateBrazilian);
    startOfDayBrazilian.setHours(0, 0, 0, 0);
    const endOfDayBrazilian = new Date(dateBrazilian);
    endOfDayBrazilian.setHours(23, 59, 59, 999);

    const workedHoursToday = await this.prismaService.workedHour.findMany({
      where: {
        workedAt: {
          gte: startOfDayBrazilian,
          lte: endOfDayBrazilian,
        },
      },
    });
    if (workedHoursToday.length > 0) {
      console.log('Worked hours already created for today:', workedHoursToday);
      return;
    }

    const gridItems = await this.prismaService.gridItem.findMany({
      where: {
        dayOfWeek: {
          0: 'sunday',
          1: 'monday',
          2: 'tuesday',
          3: 'wednesday',
          4: 'thursday',
          5: 'friday',
          6: 'saturday',
        }[weekday],
        classId: {
          not: null,
        },
        class: {
          teacherId: {
            not: null,
          },
        },
      },
      include: {
        class: {
          include: {
            teacher: true,
            modality: true,
            classLevel: true,
            enrollments: {
              where: {
                status: 'active',
              },
            },
          },
        },
        trialStudents: {
          where: {
            date: {
              gte: startOfDayBrazilian,
              lte: endOfDayBrazilian,
            },
          },
        },
      },
    });

    const workedHours = gridItems
      .map((gridItem) => {
        // Criar data base no timezone brasileiro para o dia correto
        const workedAtDateBrazilian = new Date(startOfDayBrazilian);

        // Usar o método existente para converter horários string para Date
        const startedAt = this.convertStringTimeToDate(
          gridItem.startTime,
          workedAtDateBrazilian,
        );
        const endedAt = this.convertStringTimeToDate(
          gridItem.endTime,
          workedAtDateBrazilian,
        );

        // Se o horário de término for menor que o de início, significa que termina no dia seguinte
        if (endedAt.getTime() <= startedAt.getTime()) {
          endedAt.setDate(endedAt.getDate() + 1);
        }

        const duration = (endedAt.getTime() - startedAt.getTime()) / 1000 / 60;

        const enrolledStudentsCount = gridItem.class?.enrollments?.length || 0;
        const trialStudentsCount = gridItem.trialStudents?.length || 0;

        return {
          teacherId: gridItem.class?.teacherId || '',
          classId: gridItem.classId || '',
          workedAt: workedAtDateBrazilian,
          startedAt,
          endedAt,
          priceSnapshot: gridItem.class?.teacher?.priceHour || 0,
          status: WorkedHourStatus.PENDING,
          duration,
          teacherNameSnapshot: `${gridItem.class?.teacher?.firstName || ''} ${gridItem.class?.teacher?.lastName || ''}`,
          modalityNameSnapshot: gridItem.class?.modality?.name || '',
          classLevelSnapshot: gridItem.class?.classLevel?.name || null,
          classDescriptionSnapshot: gridItem.class?.description || null,
          enrolledStudentsCount,
          trialStudentsCount,
          totalStudentsCount: enrolledStudentsCount + trialStudentsCount,
          newEnrollmentsCount: 0, // Será atualizado depois quando matriculas forem criadas
        };
      })
      .filter((workedHour) => {
        // Só cria registro se houver ao menos 1 matrícula ativa OU 1 aula experimental
        return workedHour.totalStudentsCount > 0;
      });

    if (workedHours.length === 0) {
      console.log('No classes with students today');
      return { count: 0 };
    }

    const createdWorkedHours = await this.prismaService.workedHour.createMany({
      data: workedHours,
    });
    console.log('Created worked hours:', createdWorkedHours);
    return createdWorkedHours;
  }

  async create(createWorkedHourDto: CreateWorkedHourDto) {
    // Buscar informações da turma e professor
    const classData = await this.prismaService.class.findUnique({
      where: { id: createWorkedHourDto.classId },
      include: {
        teacher: true,
        modality: true,
        classLevel: true,
        enrollments: {
          where: { status: 'active' },
        },
      },
    });

    if (!classData) {
      throw new Error('Turma não encontrada');
    }

    // Buscar grid item para pegar horários
    const gridItem = await this.prismaService.gridItem.findFirst({
      where: { classId: createWorkedHourDto.classId },
    });

    if (!gridItem) {
      throw new Error('Horário da turma não encontrado na grade');
    }

    // Converter para o timezone de São Paulo para evitar problemas de fuso horário
    const workedDate = new Date(
      new Date(createWorkedHourDto.workedAt).toLocaleString('en-US', {
        timeZone: 'America/Sao_Paulo',
      }),
    );
    const startTime = this.convertStringTimeToDate(
      gridItem.startTime,
      workedDate,
    );
    const endTime = this.convertStringTimeToDate(gridItem.endTime, workedDate);
    const duration =
      ((startTime.getTime() - endTime.getTime()) / 1000 / 60) * -1;

    // Contar trial students naquele dia
    const startOfDay = new Date(workedDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(workedDate);
    endOfDay.setHours(23, 59, 59, 999);

    const trialStudentsCount = await this.prismaService.trialStudent.count({
      where: {
        gridItemId: gridItem.id,
        date: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
    });

    return await this.prismaService.workedHour.create({
      data: {
        teacherId: createWorkedHourDto.teacherId,
        classId: createWorkedHourDto.classId,
        workedAt: createWorkedHourDto.workedAt,
        startedAt: startTime,
        endedAt: endTime,
        duration,
        priceSnapshot: classData.teacher!.priceHour,
        status: createWorkedHourDto.status || WorkedHourStatus.DONE,
        teacherNameSnapshot: `${classData.teacher!.firstName} ${classData.teacher!.lastName}`,
        modalityNameSnapshot: classData.modality.name,
        classLevelSnapshot: classData.classLevel?.name || null,
        classDescriptionSnapshot: classData.description || null,
        enrolledStudentsCount: classData.enrollments.length,
        trialStudentsCount,
        totalStudentsCount: classData.enrollments.length + trialStudentsCount,
        newEnrollmentsCount: (createWorkedHourDto.newEnrollmentsCount ??
          0) as number,
      },
    });
  }

  async findAll(month: string, year: string) {
    // Criar data corretamente para evitar problemas de timezone
    // Date constructor usa mês base 0 (0 = janeiro, 11 = dezembro)
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const startDate = startOfMonth(date);
    const endDate = endOfMonth(date);

    // Buscar configurações para obter a comissão por matrícula
    const settings = await this.prismaService.settings.findFirst();
    const commissionPerEnrollment = settings
      ? Number(settings.teacherCommissionPerEnrollment)
      : 0;

    // Buscar mês anterior para comparação
    const previousDate = subMonths(date, 1);
    const previousStartDate = startOfMonth(previousDate);
    const previousEndDate = endOfMonth(previousDate);

    // Buscar todas as worked hours do mês (otimizado - usa snapshots)
    const workedHours = await this.prismaService.workedHour.findMany({
      where: {
        workedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        class: {
          include: {
            enrollments: {
              where: {
                status: 'active',
              },
              select: {
                id: true,
                student: {
                  select: {
                    id: true,
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        workedAt: 'desc',
      },
    });

    // Buscar worked hours do mês anterior para comparação (apenas DONE)
    const previousWorkedHours = await this.prismaService.workedHour.findMany({
      where: {
        workedAt: {
          gte: previousStartDate,
          lte: previousEndDate,
        },
        status: WorkedHourStatus.DONE,
      },
    });

    // Calcular métricas do mês atual (apenas DONE)
    const doneWorkedHours = workedHours.filter(
      (wh) => wh.status === WorkedHourStatus.DONE,
    );

    // Calcular salários usando a fórmula padrão do sistema
    const salaryBreakdown = calculateTotalTeacherSalaries(
      doneWorkedHours.map((wh) => ({
        duration: wh.duration,
        priceSnapshot: wh.priceSnapshot,
        newEnrollmentsCount: wh.newEnrollmentsCount as number,
      })),
      commissionPerEnrollment,
    );

    const totalToPay = salaryBreakdown.total;

    // Calcular total do mês anterior (apenas DONE) usando a fórmula padrão
    const previousSalaries = calculateTotalTeacherSalaries(
      previousWorkedHours.map((wh) => ({
        duration: wh.duration,
        priceSnapshot: wh.priceSnapshot,
        newEnrollmentsCount: wh.newEnrollmentsCount as number,
      })),
      commissionPerEnrollment,
    );

    const previousTotalToPay = previousSalaries.total;

    // Calcular variação percentual (invertida: menor é melhor = positivo)
    const paymentChange =
      previousTotalToPay > 0
        ? ((previousTotalToPay - totalToPay) / previousTotalToPay) * 100
        : 0;

    // Total de novas matrículas no mês (apenas DONE)
    const totalNewEnrollments: number = doneWorkedHours.reduce(
      (sum, wh) => sum + (wh.newEnrollmentsCount as number),
      0,
    );

    const previousNewEnrollments: number = previousWorkedHours.reduce(
      (sum, wh) => sum + (wh.newEnrollmentsCount as number),
      0,
    );

    const enrollmentsChange =
      previousNewEnrollments > 0
        ? ((totalNewEnrollments - previousNewEnrollments) /
            previousNewEnrollments) *
          100
        : totalNewEnrollments > 0
          ? 100
          : 0;

    // Calcular métricas por professor (apenas DONE)
    const teacherStatsMap = new Map<
      string,
      {
        teacherName: string;
        totalCost: number;
        totalClasses: number;
        uniqueEnrolledStudents: Set<string>;
        totalTrialStudents: number;
        newEnrollments: number;
      }
    >();

    doneWorkedHours.forEach((wh) => {
      const teacherId = wh.teacherId;
      if (!teacherStatsMap.has(teacherId)) {
        teacherStatsMap.set(teacherId, {
          teacherName: wh.teacherNameSnapshot as string,
          totalCost: 0,
          totalClasses: 0,
          uniqueEnrolledStudents: new Set<string>(),
          totalTrialStudents: 0,
          newEnrollments: 0,
        });
      }

      const stats = teacherStatsMap.get(teacherId)!;

      // Usar a fórmula padrão do sistema para calcular salário
      const { total: salaryTotal } = calculateTotalTeacherSalaries(
        [
          {
            duration: wh.duration,
            priceSnapshot: wh.priceSnapshot,
            newEnrollmentsCount: wh.newEnrollmentsCount as number,
          },
        ],
        commissionPerEnrollment,
      );

      stats.totalCost += salaryTotal;
      stats.totalClasses += 1;
      stats.totalTrialStudents += wh.trialStudentsCount as number;
      stats.newEnrollments += wh.newEnrollmentsCount as number;

      // Adicionar alunos matriculados únicos
      if (wh.class?.enrollments) {
        wh.class.enrollments.forEach((enrollment) => {
          stats.uniqueEnrolledStudents.add(enrollment.student.id);
        });
      }
    });

    // Converter para formato final
    const teacherStats: Record<
      string,
      {
        teacherName: string;
        totalCost: number;
        totalClasses: number;
        totalStudents: number;
        newEnrollments: number;
      }
    > = {};

    teacherStatsMap.forEach((stats, teacherId) => {
      teacherStats[teacherId] = {
        teacherName: stats.teacherName,
        totalCost: stats.totalCost,
        totalClasses: stats.totalClasses,
        totalStudents:
          stats.uniqueEnrolledStudents.size + stats.totalTrialStudents,
        newEnrollments: stats.newEnrollments,
      };
    });

    // Encontrar professor com menor custo e maior quantidade de aulas/alunos
    const bestTeacher = Object.entries(teacherStats).reduce(
      (best, [teacherId, stats]) => {
        const score =
          stats.totalStudents / (stats.totalCost > 0 ? stats.totalCost : 1);
        if (score > best.score) {
          return { teacherId, ...stats, score };
        }
        return best;
      },
      {
        teacherId: '',
        teacherName: 'N/A',
        totalCost: 0,
        totalClasses: 0,
        totalStudents: 0,
        newEnrollments: 0,
        score: 0,
      },
    );

    return {
      cards: {
        totalToPay: {
          value: totalToPay,
          fromHours: salaryBreakdown.fromHours,
          fromEnrollments: salaryBreakdown.fromCommissions,
          trend: {
            value: Math.abs(paymentChange),
            isPositive: paymentChange >= 0, // Invertido: custo menor é positivo
          },
        },
        newEnrollments: {
          value: totalNewEnrollments,
          trend: {
            value: Math.abs(enrollmentsChange),
            isPositive: enrollmentsChange >= 0,
          },
        },
        bestTeacher: {
          name: bestTeacher.teacherName,
          totalCost: bestTeacher.totalCost,
          totalClasses: bestTeacher.totalClasses,
          totalStudents: bestTeacher.totalStudents,
        },
      },
      workedHours: workedHours.map((wh) => ({
        id: wh.id,
        workedAt: wh.workedAt,
        startedAt: wh.startedAt,
        endedAt: wh.endedAt,
        duration: wh.duration,
        teacherId: wh.teacherId,
        teacherName: wh.teacherNameSnapshot as string,
        modalityName: wh.modalityNameSnapshot as string,
        classLevel: wh.classLevelSnapshot as string | null,
        classDescription: wh.classDescriptionSnapshot as string | null,
        enrolledStudentsCount: wh.enrolledStudentsCount as number,
        trialStudentsCount: wh.trialStudentsCount as number,
        totalStudentsCount: wh.totalStudentsCount as number,
        newEnrollmentsCount: wh.newEnrollmentsCount as number,
        priceSnapshot: wh.priceSnapshot,
        status: wh.status,
        students: wh.class?.enrollments?.map((e) => ({
          id: e.student.id,
          firstName: e.student.firstName,
          lastName: e.student.lastName,
        })),
      })),
    };
  }

  async findOne(
    id: string,
    month: string, // "YYYY-MM"
  ) {
    const date = new Date(month);
    const startDate = startOfMonth(date);
    const endDate = endOfMonth(date);

    const teacher = await this.prismaService.teacher.findUnique({
      where: {
        id,
      },
      include: {
        WorkedHour: {
          where: {
            workedAt: {
              gte: startDate,
              lte: endDate,
            },
          },
          include: {
            class: true,
          },
        },
      },
    });

    if (!teacher) return null;

    const totalMinutes = teacher.WorkedHour.reduce(
      (sum, wh) => sum + wh.duration,
      0,
    );
    const totalHours = totalMinutes / 60;

    return {
      ...teacher,
      totalHours,
      workedDetails: teacher.WorkedHour,
    };
  }

  async updateStatus(
    id: string,
    updateWorkedHourStatus: WorkedHourStatus,
    userId: string,
  ) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
    });

    const teacher = await this.prismaService.teacher.findUnique({
      where: {
        id: userId,
      },
    });

    // se n for admin
    if (!user) {
      const workedHour = await this.prismaService.workedHour.findUnique({
        where: {
          id,
        },
      });
      // se for professor e n for dono daquela worked hour
      if (workedHour?.teacherId !== teacher?.id) {
        return new ForbiddenException('No authorized');
      }
    }

    return await this.prismaService.workedHour.update({
      where: {
        id,
      },
      data: {
        status: updateWorkedHourStatus,
      },
    });
  }

  async update(
    id: string,
    updateData: {
      teacherId?: string;
      classId?: string;
      workedAt?: Date;
      newEnrollmentsCount?: number;
      status?: WorkedHourStatus;
      priceSnapshot?: number;
    },
  ) {
    const workedHour = await this.prismaService.workedHour.findUnique({
      where: { id },
    });

    if (!workedHour) {
      throw new Error('Worked hour not found');
    }

    const updatePayload: {
      teacherId?: string;
      teacherNameSnapshot?: string;
      priceSnapshot?: number;
      classId?: string;
      startedAt?: Date;
      endedAt?: Date;
      duration?: number;
      modalityNameSnapshot?: string;
      classLevelSnapshot?: string | null;
      classDescriptionSnapshot?: string | null;
      enrolledStudentsCount?: number;
      workedAt?: Date;
      newEnrollmentsCount?: number;
      status?: WorkedHourStatus;
    } = {};

    // Se mudou o professor, atualizar snapshot
    if (updateData.teacherId && updateData.teacherId !== workedHour.teacherId) {
      const teacher = await this.prismaService.teacher.findUnique({
        where: { id: updateData.teacherId },
      });

      if (!teacher) {
        throw new Error('Teacher not found');
      }

      updatePayload.teacherId = updateData.teacherId;
      updatePayload.teacherNameSnapshot = `${teacher.firstName} ${teacher.lastName}`;
      updatePayload.priceSnapshot = teacher.priceHour;
    }

    // Se mudou a turma, atualizar snapshots
    if (updateData.classId && updateData.classId !== workedHour.classId) {
      const classData = await this.prismaService.class.findUnique({
        where: { id: updateData.classId },
        include: {
          modality: true,
          classLevel: true,
          enrollments: {
            where: { status: 'active' },
          },
        },
      });

      if (!classData) {
        throw new Error('Class not found');
      }

      // Buscar grid item para pegar horários
      const gridItem = await this.prismaService.gridItem.findFirst({
        where: { classId: updateData.classId },
      });

      if (!gridItem) {
        throw new Error('Grid item not found');
      }

      const workedDate = updateData.workedAt
        ? new Date(updateData.workedAt)
        : new Date(workedHour.workedAt);
      const startTime = this.convertStringTimeToDate(
        gridItem.startTime,
        workedDate,
      );
      const endTime = this.convertStringTimeToDate(
        gridItem.endTime,
        workedDate,
      );
      const duration =
        ((startTime.getTime() - endTime.getTime()) / 1000 / 60) * -1;

      updatePayload.classId = updateData.classId;
      updatePayload.startedAt = startTime;
      updatePayload.endedAt = endTime;
      updatePayload.duration = duration;
      updatePayload.modalityNameSnapshot = classData.modality.name;
      updatePayload.classLevelSnapshot = classData.classLevel?.name || null;
      updatePayload.classDescriptionSnapshot = classData.description || null;
      updatePayload.enrolledStudentsCount = classData.enrollments.length;
    }

    // Atualizar outros campos
    if (updateData.workedAt) {
      updatePayload.workedAt = new Date(updateData.workedAt);
    }

    if (updateData.newEnrollmentsCount !== undefined) {
      updatePayload.newEnrollmentsCount = updateData.newEnrollmentsCount;
    }

    if (updateData.status) {
      updatePayload.status = updateData.status;
    }

    if (updateData.priceSnapshot !== undefined) {
      updatePayload.priceSnapshot = updateData.priceSnapshot;
    }

    return await this.prismaService.workedHour.update({
      where: { id },
      data: updatePayload,
    });
  }

  async updateTeacher(id: string, teacherId: string) {
    const workedHour = await this.prismaService.workedHour.findUnique({
      where: { id },
    });

    if (!workedHour) {
      throw new Error('Worked hour not found');
    }

    // Buscar informações do novo professor
    const teacher = await this.prismaService.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      throw new Error('Teacher not found');
    }

    // Atualizar worked hour com novo professor e snapshot
    return await this.prismaService.workedHour.update({
      where: { id },
      data: {
        teacherId,
        teacherNameSnapshot: `${teacher.firstName} ${teacher.lastName}`,
        priceSnapshot: teacher.priceHour,
      },
    });
  }

  async remove(id: string) {
    const workedHour = await this.prismaService.workedHour.findUnique({
      where: { id },
    });

    if (!workedHour) {
      throw new Error('Worked hour not found');
    }

    return await this.prismaService.workedHour.delete({
      where: { id },
    });
  }

  async getPendingCount() {
    const count = await this.prismaService.workedHour.count({
      where: {
        status: WorkedHourStatus.PENDING,
      },
    });

    return { count };
  }

  async findAllByTeacher(month: string, year: string) {
    // Criar data corretamente para evitar problemas de timezone
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    const startDate = startOfMonth(date);
    const endDate = endOfMonth(date);

    // Buscar configurações para obter a comissão por matrícula
    const settings = await this.prismaService.settings.findFirst();
    const commissionPerEnrollment = settings
      ? Number(settings.teacherCommissionPerEnrollment)
      : 0;

    // Buscar todas as worked hours do mês com status DONE
    const workedHours = await this.prismaService.workedHour.findMany({
      where: {
        workedAt: {
          gte: startDate,
          lte: endDate,
        },
        status: WorkedHourStatus.DONE,
      },
      include: {
        teacher: {
          select: {
            pixKey: true,
          },
        },
      },
    });

    // Agrupar por professor
    const teacherMap = new Map<
      string,
      {
        teacherId: string;
        teacherName: string;
        totalClasses: number;
        totalHours: number;
        newEnrollments: number;
        priceHour: number;
        totalToPay: number;
        modalities: Set<string>;
        pixKey: string | null;
      }
    >();

    workedHours.forEach((wh) => {
      const teacherId = wh.teacherId;

      if (!teacherMap.has(teacherId)) {
        teacherMap.set(teacherId, {
          teacherId,
          teacherName: wh.teacherNameSnapshot,
          totalClasses: 0,
          totalHours: 0,
          newEnrollments: 0,
          priceHour: wh.priceSnapshot,
          totalToPay: 0,
          modalities: new Set<string>(),
          pixKey: wh.teacher?.pixKey || null,
        });
      }

      const teacher = teacherMap.get(teacherId)!;
      const hours = wh.duration / 60;

      // Usar a fórmula padrão do sistema para calcular salário
      const { total: salaryTotal } = calculateTotalTeacherSalaries(
        [
          {
            duration: wh.duration,
            priceSnapshot: wh.priceSnapshot,
            newEnrollmentsCount: wh.newEnrollmentsCount,
          },
        ],
        commissionPerEnrollment,
      );

      teacher.totalClasses += 1;
      teacher.totalHours += hours;
      teacher.newEnrollments += wh.newEnrollmentsCount;
      teacher.totalToPay += salaryTotal;
      teacher.modalities.add(wh.modalityNameSnapshot);
    });

    // Converter para array e transformar Set em array
    const teachers = Array.from(teacherMap.values()).map((teacher) => ({
      teacherId: teacher.teacherId,
      teacherName: teacher.teacherName,
      totalClasses: teacher.totalClasses,
      totalHours: teacher.totalHours,
      newEnrollments: teacher.newEnrollments,
      priceHour: teacher.priceHour,
      totalToPay: teacher.totalToPay,
      modalities: Array.from(teacher.modalities),
      pixKey: teacher.pixKey,
    }));

    // Ordenar por total a pagar (decrescente)
    teachers.sort((a, b) => b.totalToPay - a.totalToPay);

    return { teachers };
  }

  convertStringTimeToDate(time: string, date: Date): Date {
    const _date = new Date(date);
    const [hour, min] = time.split(':').map(Number);
    _date.setHours(hour, min, 0, 0);
    return _date;
  }
}
