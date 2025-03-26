import { Injectable } from '@nestjs/common';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { PrismaService } from 'src/config/prisma.service';

@Injectable()
export class TeacherService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createTeacherDto: CreateTeacherDto) {
    return await this.prisma.teacher.create({
      data: createTeacherDto,
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
