import { Injectable } from '@nestjs/common';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { PrismaService } from 'src/config/prisma.service';

@Injectable()
export class ClassesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createClassDto: CreateClassDto) {
    return await this.prisma.class.create({ data: createClassDto });
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
    const response = await this.prisma.class.findMany({
      where: {
        modality: {
          name: name ? { contains: name, mode: 'insensitive' } : undefined,
        },
        teacherId: teacherId ? { equals: teacherId } : undefined,
        description: ageRange ? { equals: ageRange } : undefined,
        modalityId: modalityId ? { equals: modalityId } : undefined,
        classLevelId: classLevelId ? { equals: classLevelId } : undefined,
      },
      include: {
        classLevel: true,
        teacher: true,
        gridClasses: true,
        modality: true
      },
      orderBy: {
        updatedAt: 'desc',
      },
    });

    return response.map((item) => ({
      ...item,
      teacherName: [item.teacher?.firstName, item.teacher?.lastName]
        .filter(Boolean)
        .join(' '),
      classesPerWeek: item?.gridClasses?.length || 0,
    }));
  }

  async findOne(id: string) {
    return await this.prisma.class.findUnique({ where: { id } });
  }

  async update(id: string, updateClassDto: UpdateClassDto) {
    const modality = await this.prisma.modality.findFirst({
      where: { id: updateClassDto?.modalityId },
    });

    if (!modality?.id) {
      throw new Error('modality not found');
    }

    const classLevel = await this.prisma.classLevel.findFirst({
      where: { id: updateClassDto?.classLevelId },
    });

    if (!classLevel?.id) {
      throw new Error('classLevel not found');
    }

    return await this.prisma.class.update({
      where: { id },
      data: {
        ...updateClassDto,
        name: `${modality?.name} ${updateClassDto.description} - ${classLevel.name}`,
      },
    });
  }

  async remove(id: string) {
    return await this.prisma.class.delete({ where: { id } });
  }
}
