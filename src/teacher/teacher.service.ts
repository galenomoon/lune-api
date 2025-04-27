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
} from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getDayLabel } from 'src/utils/getDayLabel';
import { buildScheduleWithStatus } from 'src/utils/buildScheduleWithStatus';
import { newBrazilianDate } from 'src/utils/newBrazilianDate';

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
              enrollments: true,
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
            enrollments: true,
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
      (item) =>
        (item?.class && item.class.enrollments.length > 0) ||
        item?.trialStudents?.length > 0,
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
}
