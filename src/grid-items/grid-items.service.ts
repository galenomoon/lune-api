import { Injectable } from '@nestjs/common';
import { CreateGridItemDto } from './dto/create-grid-item.dto';
import { UpdateGridItemDto } from './dto/update-grid-item.dto';
import { PrismaService } from 'src/config/prisma.service';
import { timeToMinutes } from 'src/utils/timeToMinutes';
import { getTimePeriod } from 'src/utils/getTimePeriod';

@Injectable()
export class GridItemsService {
  constructor(private prisma: PrismaService) {}

  async create(createGridItemDto: CreateGridItemDto) {
    const {
      class: classProperties,
      dayOfWeek,
      startTime,
      endTime,
    } = createGridItemDto;

    const startTimeMinutes = timeToMinutes(startTime);
    const endTimeMinutes = timeToMinutes(endTime);

    if (startTimeMinutes >= endTimeMinutes) {
      throw new Error(
        "Horário inválido: 'startTime' deve ser menor que 'endTime'.",
      );
    }

    const existingGridItems = await this.prisma.gridItem.findMany({
      where: {
        dayOfWeek,
      },
    });

    const hasConflict = existingGridItems.some((item) => {
      const itemStart = timeToMinutes(item.startTime);
      const itemEnd = timeToMinutes(item.endTime);

      return itemStart < endTimeMinutes && itemEnd > startTimeMinutes;
    });

    if (hasConflict) {
      throw new Error('Conflito de horário: já existe uma aula neste horário.');
    }

    const modality = await this.prisma.modality.findFirst({
      where: { id: classProperties.modalityId },
    });

    if (!modality?.id) {
      throw new Error('modality not found');
    }

    const classLevel = await this.prisma.classLevel.findFirst({
      where: { id: classProperties.classLevelId },
    });

    if (!classLevel?.id) {
      throw new Error('classLevel not found');
    }

    const teacher = await this.prisma.teacher.findFirst({
      where: { id: classProperties.teacherId },
    });

    if (!teacher?.id && classProperties.teacherId) {
      throw new Error('teacher not found');
    }

    const period = getTimePeriod(startTime);

    const { id: classId } = await this.prisma.class.create({
      data: {
        name: `${modality?.name} ${classProperties.description} - ${classLevel?.name}/${period}`,
        description: classProperties.description || '',
        maxStudents: classProperties.maxStudents || 1,
        modalityId: classProperties.modalityId,
        classLevelId: classProperties.classLevelId,
        teacherId: classProperties.teacherId,
      },
    });

    return await this.prisma.gridItem.create({
      data: {
        classId,
        dayOfWeek,
        startTime,
        endTime,
      },
    });
  }

  async findAll({
    name,
    ageRange,
    teacherId,
    modalityId,
    classLevelId,
  }: {
    name: string;
    ageRange: string;
    teacherId: string;
    modalityId: string;
    classLevelId: string;
  }) {
    const gridItems = await this.prisma.gridItem.findMany({
      orderBy: { startTime: 'asc' },
      where: {
        class: {
          modality: {
            name: name ? { contains: name, mode: 'insensitive' } : undefined,
          },
          teacherId: teacherId ? { equals: teacherId } : undefined,
          description: ageRange ? { equals: ageRange } : undefined,
          modalityId: modalityId ? { equals: modalityId } : undefined,
          classLevelId: classLevelId ? { equals: classLevelId } : undefined,
        },
      },
      include: {
        class: {
          include: {
            modality: true,
            classLevel: true,
            enrollments: true,
            teacher: true,
          },
        },
      },
    });

    const scheduleList: Record<string, any>[] = [];

    gridItems.forEach((item) => {
      let existingBlock = scheduleList.find((block) => {
        const firstItem = Object.values(block).find(
          (v) => v?.startTime === item.startTime,
        );
        return firstItem !== undefined;
      });

      if (!existingBlock) {
        existingBlock = {
          sunday: {},
          monday: {},
          tuesday: {},
          wednesday: {},
          thursday: {},
          friday: {},
          saturday: {},
        };
        scheduleList.push(existingBlock);
      }

      existingBlock[item.dayOfWeek.toLowerCase()] = {
        ...item,
        id: item.id,
        maxStudents: item.class?.maxStudents,
        enrolledStudents: item.class?.enrollments.length,
        modality: item.class?.modality.name,
        startTime: item.startTime,
        endTime: item.endTime,
        level: item.class?.classLevel.name,
        description: item.class?.description,
        teacherName: item.class?.teacher?.firstName,
      };
    });

    const dashboard = await this.getGridDashboard();

    return { dashboard, data: scheduleList };
  }

  async getGridDashboard() {
    const gridItems = await this.prisma.gridItem.findMany({
      include: {
        class: {
          include: {
            teacher: true,
            enrollments: true,
          },
        },
      },
    });

    let totalWeeklyCost = 0;
    let totalStudents = 0;

    for (const item of gridItems) {
      const teacher = item.class?.teacher;
      const enrollments = item.class?.enrollments.length ?? 0;

      const [startHour, startMin] = item.startTime.split(':').map(Number);
      const [endHour, endMin] = item.endTime.split(':').map(Number);
      const classDuration =
        (endHour * 60 + endMin - (startHour * 60 + startMin)) / 60;

      if (teacher && enrollments > 0) {
        totalWeeklyCost += classDuration * (teacher.priceHour ?? 0);
      }

      totalStudents += enrollments;
    }

    const MONTHLY_FEE = 110; // TODO: Pegar os valores de cada mensalidade de cada aluno em seu respectivo plano

    const totalMonthlyCost = totalWeeklyCost * 4;
    const weeklyRevenue = (totalStudents * MONTHLY_FEE) / 4;
    const monthlyRevenue = totalStudents * MONTHLY_FEE;
    const weeklyProfit = weeklyRevenue - totalWeeklyCost;
    const monthlyProfit = monthlyRevenue - totalMonthlyCost;

    return {
      revenues: {
        weekly: weeklyRevenue,
        monthly: monthlyRevenue,
      },
      costs: {
        weekly: totalWeeklyCost,
        monthly: totalMonthlyCost,
      },
      profits: {
        weekly: weeklyProfit,
        monthly: monthlyProfit,
      },
      enrollments: {
        totalStudents,
      },
    };
  }

  async findOne(id: string) {
    return await this.prisma.gridItem.findUnique({ where: { id } });
  }

  async update(id: string, updateGridItemDto: UpdateGridItemDto) {
    const {
      class: classProperties,
      dayOfWeek,
      startTime,
      endTime,
    } = updateGridItemDto;

    const startTimeMinutes = timeToMinutes(startTime as string);
    const endTimeMinutes = timeToMinutes(endTime as string);

    if (startTimeMinutes >= endTimeMinutes) {
      throw new Error(
        "Horário inválido: 'startTime' deve ser menor que 'endTime'.",
      );
    }

    const existingGridItems = await this.prisma.gridItem.findMany({
      where: {
        dayOfWeek,
        id: { not: id },
      },
    });

    const hasConflict = existingGridItems.some((item) => {
      const itemStart = timeToMinutes(item.startTime);
      const itemEnd = timeToMinutes(item.endTime);

      return itemStart < endTimeMinutes && itemEnd > startTimeMinutes;
    });

    if (hasConflict) {
      throw new Error('Conflito de horário: já existe uma aula neste horário.');
    }

    const modality = await this.prisma.modality.findFirst({
      where: { id: classProperties?.modalityId },
    });

    if (!modality?.id) {
      throw new Error('modality not found');
    }

    const classLevel = await this.prisma.classLevel.findFirst({
      where: { id: classProperties?.classLevelId },
    });

    if (!classLevel?.id) {
      throw new Error('classLevel not found');
    }

    const teacher = await this.prisma.teacher.findFirst({
      where: { id: classProperties?.teacherId },
    });

    if (!teacher?.id && classProperties?.teacherId) {
      throw new Error('teacher not found');
    }

    const period = getTimePeriod(startTime as string);

    await this.prisma.class.update({
      where: { id: classProperties?.id },
      data: {
        name: `${modality?.name} ${classProperties?.description} - ${classLevel?.name}/${period}`,
        description: classProperties?.description || '',
        maxStudents: classProperties?.maxStudents || 1,
        modalityId: classProperties?.modalityId,
        classLevelId: classProperties?.classLevelId,
        teacherId: classProperties?.teacherId,
      },
    });

    return await this.prisma.gridItem.update({
      where: { id },
      data: {
        dayOfWeek,
        startTime,
        endTime,
      },
    });
  }

  async remove(id: string) {
    const gridItem = await this.prisma.gridItem.findUnique({ where: { id } });

    if (!gridItem) {
      throw new Error(`GridItem com ID ${id} não encontrado.`);
    }

    const classEnrollments = await this.prisma.enrollment.findMany({
      where: {
        classId: gridItem.classId,
      },
    });

    if (classEnrollments.length > 0) {
      throw new Error(
        'Não é possível excluir este horário, pois existem matrículas associadas à classe.',
      );
    }

    const deletedGridItem = await this.prisma.gridItem.delete({
      where: { id },
    });

    const classItems = await this.prisma.gridItem.findMany({
      where: { classId: gridItem.classId },
    });

    if (classItems.length === 0) {
      await this.prisma.class.delete({
        where: { id: gridItem.classId as string },
      });
    }

    return deletedGridItem;
  }
}
