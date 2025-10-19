import { Injectable } from '@nestjs/common';
import { CreateModalityDto } from './dto/create-modality.dto';
import { UpdateModalityDto } from './dto/update-modality.dto';
import { PrismaService } from 'src/config/prisma.service';

@Injectable()
export class ModalitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createModalityDto: CreateModalityDto) {
    return await this.prisma.modality.create({
      data: createModalityDto,
    });
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
    return await this.prisma.modality.findMany({
      where: {
        name: {
          contains: name,
          mode: 'insensitive',
        },
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
    });
  }

  async findOne(id: string) {
    return await this.prisma.modality.findUnique({ where: { id } });
  }

  async update(id: string, updateModalityDto: UpdateModalityDto) {
    return await this.prisma.modality.update({
      where: { id },
      data: updateModalityDto,
    });
  }

  async remove(id: string) {
    const modality = await this.prisma.modality.findUnique({
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

    if (!modality) {
      throw new Error(`Modalidade com ID ${id} não encontrada.`);
    }

    // Verificar se alguma classe tem matrículas ativas
    const classesWithActiveEnrollments = modality.classes.filter(
      (cls) => cls.enrollments.length > 0,
    );

    if (classesWithActiveEnrollments.length > 0) {
      throw new Error(
        'Não é possível excluir esta modalidade, pois existem classes com alunos matriculados.',
      );
    }

    // Se não tem matrículas ativas, deletar em cascata usando transação
    return await this.prisma.$transaction(async (prisma) => {
      // Coletar todos os IDs das classes
      const classIds = modality.classes.map((cls) => cls.id);

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

      // Deletar a modalidade
      return await prisma.modality.delete({ where: { id } });
    });
  }
}
