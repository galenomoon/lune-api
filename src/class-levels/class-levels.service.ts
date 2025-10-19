import { Injectable } from '@nestjs/common';
import { CreateClassLevelDto } from './dto/create-class-level.dto';
import { UpdateClassLevelDto } from './dto/update-class-level.dto';
import { PrismaService } from 'src/config/prisma.service';

@Injectable()
export class ClassLevelsService {
  constructor(private prisma: PrismaService) {}

  async create(createClassLevelDto: CreateClassLevelDto) {
    return await this.prisma.classLevel.create({ data: createClassLevelDto });
  }

  async findAll() {
    return await this.prisma.classLevel.findMany();
  }

  async findOne(id: string) {
    return await this.prisma.classLevel.findUnique({ where: { id } });
  }

  async update(id: string, updateClassLevelDto: UpdateClassLevelDto) {
    return await this.prisma.classLevel.update({
      where: { id },
      data: updateClassLevelDto,
    });
  }

  async remove(id: string) {
    const classLevel = await this.prisma.classLevel.findUnique({
      where: { id },
      include: {
        classes: {
          include: {
            enrollments: {
              where: {
                status: 'active',
              },
            },
            gridClasses: true,
          },
        },
      },
    });

    if (!classLevel) {
      throw new Error(`Nível de classe com ID ${id} não encontrado.`);
    }

    // Verificar se alguma classe tem matrículas ativas
    const classesWithActiveEnrollments = classLevel.classes.filter(
      (cls) => cls.enrollments.length > 0,
    );

    if (classesWithActiveEnrollments.length > 0) {
      throw new Error(
        'Não é possível excluir este nível de classe, pois existem classes com alunos matriculados.',
      );
    }

    // Se não tem matrículas ativas, deletar em cascata usando transação
    return await this.prisma.$transaction(async (prisma) => {
      // Coletar todos os IDs das classes
      const classIds = classLevel.classes.map((cls) => cls.id);

      if (classIds.length > 0) {
        // Deletar todos os grid items das classes
        await prisma.gridItem.deleteMany({
          where: {
            classId: {
              in: classIds,
            },
          },
        });

        // Deletar todas as classes
        await prisma.class.deleteMany({
          where: {
            id: {
              in: classIds,
            },
          },
        });
      }

      // Deletar o nível de classe
      return await prisma.classLevel.delete({ where: { id } });
    });
  }
}
