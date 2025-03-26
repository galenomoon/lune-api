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
    return await this.prisma.modality.delete({ where: { id } });
  }
}
