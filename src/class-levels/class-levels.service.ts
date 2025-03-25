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
    return await this.prisma.classLevel.delete({ where: { id } });
  }
}
