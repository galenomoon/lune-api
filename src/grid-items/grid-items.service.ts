import { Injectable } from '@nestjs/common';
import { CreateGridItemDto } from './dto/create-grid-item.dto';
import { PrismaService } from 'src/config/prisma.service';
import { timeToMinutes } from 'src/utils/timeToMinutes';

interface GridItemWithIndex {
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  index: number;
}

@Injectable()
export class GridItemsService {
  constructor(private prisma: PrismaService) {}

  async create(createGridItemDto: CreateGridItemDto) {
    const { class: classProperties, gridItems } = createGridItemDto;

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

    const { id: classId } = await this.prisma.class.create({
      data: {
        name: `${modality?.name} ${classProperties.description} - ${classLevel?.name}`,
        description: classProperties.description || '',
        maxStudents: classProperties.maxStudents || 1,
        modalityId: classProperties.modalityId,
        classLevelId: classProperties.classLevelId,
        teacherId: classProperties.teacherId,
      },
    });

    const response = [] as object[];

    for (let i = 0; i < gridItems.length; ++i) {
      const { startTime, endTime, dayOfWeek } = gridItems[i];

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
        throw new Error(
          'Conflito de horário: já existe uma aula neste horário.',
        );
      }

      const createdGridItem = await this.prisma.gridItem.create({
        data: {
          classId,
          dayOfWeek,
          startTime,
          endTime,
        },
      });

      response.push(createdGridItem);
    }

    return response;
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
        trialStudents: {
          include: {
            lead: true,
          },
        },
        class: {
          include: {
            modality: true,
            classLevel: true,
            enrollments: {
              include: {
                student: true,
              },
            },
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

      const filteredEnrollments = item.class?.enrollments.filter(
        (enrollment) => enrollment.status === 'active',
      );

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
        class: {
          ...item.class,
          enrollments: filteredEnrollments,
        },
        id: item.id,
        maxStudents: item.class?.maxStudents,
        enrolledStudents: filteredEnrollments?.length,
        enrolledStudentsList: filteredEnrollments,
        trialStudents: item?.trialStudents?.length,
        trialStudentsList: item?.trialStudents,
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
      const enrollments =
        item.class?.enrollments.filter((e) => e.status === 'active').length ??
        0;

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

  async listGridItems() {
    const gridItems = await this.prisma.gridItem.findMany({
      orderBy: { startTime: 'asc' },
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

    return gridItems.map((item) => ({
      id: item.id,
      dayOfWeek: item.dayOfWeek,
      startTime: item.startTime,
      endTime: item.endTime,
      classId: item.classId,
      maxStudents: item.class?.maxStudents,
      enrolledStudents: item.class?.enrollments.length,
      modality: item.class?.modality.name,
      modalityId: item.class?.modality.id,
      level: item.class?.classLevel.name,
      description: item.class?.description,
      teacherName: item.class?.teacher?.firstName,
    }));
  }

  async findOne(id: string) {
    return await this.prisma.gridItem.findUnique({ where: { id } });
  }

  async update(classId: string, updateGridItemsDto: CreateGridItemDto) {
    const { class: classProperties, gridItems } = updateGridItemsDto;

    const existingClass = await this.prisma.class.findFirst({
      where: { id: classId },
    });

    if (!existingClass) {
      throw new Error('Class not found');
    }

    await this.prisma.class.update({
      where: { id: classId },
      data: {
        name: `${classProperties.description} - ${existingClass.name}`,
        description: classProperties.description || '',
        maxStudents: classProperties.maxStudents || 1,
        modalityId: classProperties.modalityId,
        classLevelId: classProperties.classLevelId,
        teacherId: classProperties.teacherId,
      },
    });

    // Buscar grid items existentes para esta classe
    const existingGridItems = await this.prisma.gridItem.findMany({
      where: { classId },
    });

    // Validar todos os novos horários antes de fazer qualquer alteração
    for (const newItem of gridItems) {
      const { startTime, endTime, dayOfWeek } = newItem;

      const startTimeMinutes = timeToMinutes(startTime);
      const endTimeMinutes = timeToMinutes(endTime);

      if (startTimeMinutes >= endTimeMinutes) {
        throw new Error(
          "Horário inválido: 'startTime' deve ser menor que 'endTime'.",
        );
      }

      // Verificar conflitos com outras classes (não a atual)
      const conflictingItems = await this.prisma.gridItem.findMany({
        where: {
          dayOfWeek,
          classId: { not: classId },
        },
      });

      const hasConflict = conflictingItems.some((item) => {
        const itemStart = timeToMinutes(item.startTime);
        const itemEnd = timeToMinutes(item.endTime);

        return itemStart < endTimeMinutes && itemEnd > startTimeMinutes;
      });

      if (hasConflict) {
        throw new Error(
          'Conflito de horário: já existe uma aula neste horário.',
        );
      }
    }

    const response = [] as object[];

    // Criar um mapa dos novos grid items para comparação
    const newItemsMap = new Map<string, GridItemWithIndex>();
    gridItems.forEach((item, index) => {
      const key = `${item.dayOfWeek}-${item.startTime}-${item.endTime}`;
      newItemsMap.set(key, { ...item, index });
    });

    // Criar um mapa dos grid items existentes
    const existingItemsMap = new Map<string, object>();
    existingGridItems.forEach((item) => {
      const key = `${item.dayOfWeek}-${item.startTime}-${item.endTime}`;
      existingItemsMap.set(key, item as object);
    });

    // Deletar grid items que não existem mais nos novos dados
    const itemsToDelete = existingGridItems.filter((existingItem) => {
      const key = `${existingItem.dayOfWeek}-${existingItem.startTime}-${existingItem.endTime}`;
      return !newItemsMap.has(key);
    });

    if (itemsToDelete.length > 0) {
      await this.prisma.gridItem.deleteMany({
        where: {
          id: { in: itemsToDelete.map((item) => item.id) },
        },
      });
    }

    // Atualizar ou criar grid items
    for (const [key, newItem] of newItemsMap) {
      const existingItem = existingItemsMap.get(key);

      if (existingItem) {
        // Item já existe, manter na resposta
        response.push(existingItem);
      } else {
        // Item é novo, criar
        const createdGridItem = await this.prisma.gridItem.create({
          data: {
            classId,
            dayOfWeek: newItem.dayOfWeek,
            startTime: newItem.startTime,
            endTime: newItem.endTime,
          },
        });
        response.push(createdGridItem);
      }
    }

    return response;
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

    return deletedGridItem;
  }
}
