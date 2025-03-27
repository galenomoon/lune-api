import { Injectable } from '@nestjs/common';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { PrismaService } from 'src/config/prisma.service';

@Injectable()
export class PlansService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createPlanDto: CreatePlanDto) {
    return await this.prisma.plan.create({ data: createPlanDto });
  }

  async findAll() {
    const res = await this.prisma.plan.findMany({
      include: {
        enrollments: true,
      },
    });

    return res.map((item) => ({
      ...item,
      enrollmentsQuantity: item?.enrollments?.length || 0,
    }));
  }

  async findOne(id: string) {
    return await this.prisma.plan.findUnique({ where: { id } });
  }

  async update(id: string, updatePlanDto: UpdatePlanDto) {
    return await this.prisma.plan.update({
      where: { id },
      data: updatePlanDto,
    });
  }

  async remove(id: string) {
    return await this.prisma.plan.delete({ where: { id } });
  }
}
