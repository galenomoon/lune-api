import { Injectable } from '@nestjs/common';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { PrismaService } from 'src/config/prisma.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';
import {
  addDays,
  endOfWeek,
  format,
  isSameDay,
  parseISO,
  startOfWeek,
  startOfMonth,
  endOfMonth,
  isTomorrow,
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getDayLabel } from 'src/utils/getDayLabel';
import { buildScheduleWithStatus } from 'src/utils/buildScheduleWithStatus';
import { newBrazilianDate } from 'src/utils/newBrazilianDate';
import { calculateTotalTeacherSalaries } from '../utils/calculateTeacherSalary';
import { WorkedHourStatus } from '@prisma/client';

@Injectable()
export class TeacherService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTeacherDto: CreateTeacherDto) {
    const salt = crypto.randomInt(0, 10);
    const hashed_password = await bcrypt.hash(
      createTeacherDto.cpf.replace(/\D/g, '')?.slice(0, 4),
      salt,
    );

    return await this.prisma.teacher.create({
      data: { ...createTeacherDto, password: hashed_password },
    });
  }

  async getTeacherSchedule(teacherId: string, targetDate?: string) {
    const baseDate = targetDate ? parseISO(targetDate) : newBrazilianDate();
    let currentDate = baseDate;
    let gridItems: any[] = [];

    for (let i = 0; i < 7; i++) {
      const weekDay = currentDate
        .toLocaleDateString('en-US', { weekday: 'long' })
        .toLowerCase();

      const fetchedItems = await this.prisma.gridItem.findMany({
        where: {
          dayOfWeek: weekDay,
          class: {
            teacherId,
          },
        },
        include: {
          class: {
            include: {
              modality: true,
              classLevel: true,
              enrollments: {
                include: {
                  student: true,
                },
              },
            },
          },
          trialStudents: {
            include: {
              lead: true,
            },
          },
        },
        orderBy: {
          startTime: 'asc',
        },
      });

      // Filtro: só mantém aulas com ao menos 1 matrícula
      gridItems = fetchedItems.filter(
        (item) =>
          (item.class && item.class.enrollments.length > 0) ||
          item?.trialStudents?.length > 0,
      );

      // Se encontrou alguma, para
      if (gridItems.length > 0) break;

      // Se não, tenta o próximo dia
      currentDate = addDays(currentDate, 1);
    }

    // Se nada for encontrado em 7 dias:
    if (!gridItems.length) {
      return {
        nextClass: null,
        nextLabel: null,
        schedule: [],
      };
    }

    // Constrói lista de aulas com status e ordem correta
    const schedule = buildScheduleWithStatus(gridItems, currentDate, true);

    const next = schedule.find((item) => item.status === 'next');

    const nextLabel = next
      ? `${getDayLabel(currentDate)}, às ${next.startTime}`
      : null;

    const hasTodayClasses = schedule.some((item) =>
      isSameDay(item.startDateTime, newBrazilianDate()),
    );

    return {
      nextClass: next,
      nextLabel,
      hasTodayClasses,
      schedule,
    };
  }

  async getWeeklySchedule(teacherId: string, baseDate: Date) {
    const start = startOfWeek(baseDate, { weekStartsOn: 1 }); // Segunda
    const end = endOfWeek(baseDate, { weekStartsOn: 1 }); // Domingo

    const gridItems = await this.prisma.gridItem.findMany({
      where: {
        class: {
          teacherId,
        },
      },
      include: {
        class: {
          include: {
            modality: true,
            classLevel: true,
            enrollments: {
              include: {
                student: true,
              },
            },
          },
        },
        trialStudents: {
          include: {
            lead: true,
          },
        },
      },
    });

    const filteredGridItems = gridItems.filter(
      (item) => {
        const hasSomeEnrollment = (item?.class && item.class.enrollments.length > 0)
        const hasSomeTrialClass = item?.trialStudents?.length > 0
        const hasSomeActiveEnrollment = item?.class && item?.class?.enrollments?.some(e => e.status === 'active')

        if (hasSomeTrialClass) return true

        if (hasSomeEnrollment && hasSomeActiveEnrollment) return true

        return false
      }
    );

    const weeklyGrouped: Record<
      string,
      {
        dayLabel: string;
        date: string;
        items: any[];
      }
    > = {};

    for (let i = 0; i < 7; i++) {
      const currentDate = addDays(start, i);
      const weekday = format(currentDate, 'EEEE', { locale: ptBR });

      const englishDay = format(currentDate, 'EEEE').toLowerCase(); // inglês, minúsculo
      const items = filteredGridItems.filter(
        (item) => item.dayOfWeek === englishDay,
      );

      const classWithStatus = buildScheduleWithStatus(items, currentDate);

      weeklyGrouped[weekday] = {
        dayLabel: weekday.charAt(0).toUpperCase() + weekday.slice(1),
        date: format(currentDate, 'dd/MM'),
        items: classWithStatus,
      };
    }

    const formattedRange = `${format(start, 'dd')} a ${format(
      end,
      'dd',
    )} de ${format(baseDate, 'MMMM', { locale: ptBR })}`;

    return {
      range: formattedRange,
      week: weeklyGrouped,
    };
  }

  async findAll({
    name,
    sortBy,
    sortOrder,
  }: {
    name: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    return await this.prisma.teacher.findMany({
      where: {
        OR: name
          ? [
              { firstName: { contains: name, mode: 'insensitive' } },
              { lastName: { contains: name, mode: 'insensitive' } },
            ]
          : undefined,
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
    });
  }

  async findOne(id: string) {
    return await this.prisma.teacher.findUnique({
      where: { id },
    });
  }

  async update(id: string, updateTeacherDto: UpdateTeacherDto) {
    return await this.prisma.teacher.update({
      where: { id },
      data: updateTeacherDto,
    });
  }

  async remove(id: string) {
    return await this.prisma.teacher.delete({ where: { id } });
  }

  async getTeacherSalarySummary(teacherId: string) {
    // Data atual para o mês
    const currentDate = new Date();
    const startDate = startOfMonth(currentDate);
    const endDate = endOfMonth(currentDate);

    // Buscar configurações para obter a comissão por matrícula
    const settings = await this.prisma.settings.findFirst();
    const commissionPerEnrollment = settings
      ? Number(settings.teacherCommissionPerEnrollment)
      : 0;

    // Buscar todas as worked hours do mês atual com status DONE para o professor específico
    const workedHours = await this.prisma.workedHour.findMany({
      where: {
        teacherId,
        workedAt: {
          gte: startDate,
          lte: endDate,
        },
        status: WorkedHourStatus.DONE,
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

    // Calcular total usando a fórmula padrão do sistema
    const salaryBreakdown = calculateTotalTeacherSalaries(
      workedHours.map((wh) => ({
        duration: wh.duration,
        priceSnapshot: wh.priceSnapshot,
        newEnrollmentsCount: wh.newEnrollmentsCount as number,
      })),
      commissionPerEnrollment,
    );

    // Calcular total de horas
    const totalHours = workedHours.reduce(
      (sum, wh) => sum + wh.duration,
      0,
    ) / 60;

    // Calcular total de novas matrículas
    const newEnrollments = workedHours.reduce(
      (sum, wh) => sum + (wh.newEnrollmentsCount as number),
      0,
    );

    // Nome do mês em português
    const monthName = format(currentDate, 'MMMM', { locale: ptBR });
    const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

    return {
      month: capitalizedMonth,
      total: salaryBreakdown.total,
      newEnrollments,
      totalHours: Math.round(totalHours * 100) / 100, // Arredondar para 2 casas decimais
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
          type: 'enrolled' as const,
        })) || [],
      })),
    };
  }

  async getNearestClasses(teacherId: string) {
    const today = newBrazilianDate();
    
    // Primeiro, tentar buscar aulas de hoje
    const todaySchedule = await this.getScheduleForDate(teacherId, today, true);
    
    // Se encontrou aulas hoje, retornar
    if (todaySchedule.schedule.length > 0) {
      return todaySchedule;
    }
    
    // Se não há aulas hoje, buscar a próxima data com aulas
    return this.getNextAvailableSchedule(teacherId);
  }

  private async getScheduleForDate(teacherId: string, targetDate: Date, isToday: boolean = false) {
    const startOfDay = new Date(targetDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(targetDate);
    endOfDay.setHours(23, 59, 59, 999);

    const weekday = targetDate
      .toLocaleDateString('en-US', { weekday: 'long' })
      .toLowerCase();

    const gridItems = await this.prisma.gridItem.findMany({
      where: {
        dayOfWeek: weekday,
        class: {
          teacherId,
        },
      },
      include: {
        class: {
          include: {
            modality: true,
            classLevel: true,
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
        trialStudents: {
          where: {
            date: {
              gte: startOfDay,
              lte: endOfDay,
            },
          },
          include: {
            lead: true,
          },
        },
      },
      orderBy: {
        startTime: 'asc',
      },
    });

    // Filtrar apenas grid items com matrículas ativas ou trial students
    const validGridItems = gridItems.filter(
      (item) =>
        (item.class && item.class.enrollments.length > 0) ||
        item.trialStudents.length > 0,
    );

    const scheduleItems = validGridItems.map((gridItem) => ({
      id: gridItem.id,
      startTime: gridItem.startTime,
      endTime: gridItem.endTime,
      modalityName: gridItem.class?.modality?.name || '',
      classLevel: gridItem.class?.classLevel?.name || null,
      classDescription: gridItem.class?.description || null,
      enrolledStudentsCount: gridItem.class?.enrollments?.length || 0,
      trialStudentsCount: gridItem.trialStudents.length,
      totalStudentsCount: (gridItem.class?.enrollments?.length || 0) + gridItem.trialStudents.length,
      enrolledStudents: gridItem.class?.enrollments?.map((e) => ({
        id: e.student.id,
        firstName: e.student.firstName,
        lastName: e.student.lastName,
      })) || [],
      trialStudents: gridItem.trialStudents.map((ts) => ({
        id: ts.id,
        lead: ts.lead,
        status: ts.status,
      })),
    }));

    const dayLabel = isToday 
      ? 'Hoje' 
      : isTomorrow(targetDate) 
        ? 'Amanhã' 
        : format(targetDate, "EEEE", { locale: ptBR });

    return {
      date: targetDate,
      isToday,
      dayLabel: dayLabel.charAt(0).toUpperCase() + dayLabel.slice(1),
      schedule: scheduleItems,
    };
  }

  private async getNextAvailableSchedule(teacherId: string) {
    const today = newBrazilianDate();
    
    // Buscar próximos 7 dias
    for (let i = 1; i <= 7; i++) {
      const checkDate = addDays(today, i);
      const schedule = await this.getScheduleForDate(teacherId, checkDate, false);
      
      if (schedule.schedule.length > 0) {
        return schedule;
      }
    }

    // Se não encontrou nenhuma aula nos próximos 7 dias, retornar vazio
    return {
      date: today,
      isToday: false,
      dayLabel: 'Nenhuma aula encontrada',
      schedule: [],
    };
  }
}
