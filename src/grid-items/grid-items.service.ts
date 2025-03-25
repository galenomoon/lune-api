import { Injectable } from '@nestjs/common';
import { CreateGridItemDto } from './dto/create-grid-item.dto';
import { UpdateGridItemDto } from './dto/update-grid-item.dto';
import { PrismaService } from 'src/config/prisma.service';

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

    const timeToMinutes = (time: string): number => {
      const [hours, minutes] = time.split(':').map(Number);
      return hours * 60 + minutes;
    };

    function getTimePeriod(startTime: string): string {
      const [hours] = startTime.split(':').map(Number);

      if (hours >= 5 && hours < 12) {
        return 'Manhã';
      } else if (hours >= 12 && hours < 18) {
        return 'Tarde';
      } else {
        return 'Noite';
      }
    }

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

    const teacher = await this.prisma.classLevel.findFirst({
      where: { id: classProperties.teacherId },
    });

    if (!teacher?.id) {
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

  async findAll() {
    const gridItems = await this.prisma.gridItem.findMany({
      orderBy: {
        startTime: 'asc',
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

    const response = gridItems.reduce((acc, curr) => {
      if (!acc[curr.dayOfWeek]) {
        acc[curr.dayOfWeek.toLowerCase()] = [];
      }
      acc[curr.dayOfWeek.toLowerCase()].push({
        ...curr,
        id: curr.id,
        maxStudents: curr.class?.maxStudents,
        enrolledStudents: curr.class?.enrollments.length,
        modality: curr.class?.modality.name,
        startTime: curr.startTime,
        endTime: curr.endTime,
        level: curr.class?.classLevel.name,
        description: curr.class?.description,
        teacherName: curr.class?.teacher?.firstName,
      });
      return acc;
    }, {});

    return response;
  }

  async findOne(id: string) {
    return await this.prisma.gridItem.findUnique({ where: { id } });
  }

  async update(id: string, updateGridItemDto: UpdateGridItemDto) {
    return await this.prisma.gridItem.update({
      where: { id },
      data: {
        dayOfWeek: updateGridItemDto.dayOfWeek,
        startTime: updateGridItemDto.startTime,
        endTime: updateGridItemDto.endTime,
      },
    });
  }

  async remove(id: string) {
    return await this.prisma.gridItem.delete({ where: { id } });
  }
}
