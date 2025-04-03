import { PrismaService } from './../config/prisma.service';
import { Injectable } from '@nestjs/common';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

@Injectable()
export class LeadService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createLeadDto: CreateLeadDto) {
    return await this.prisma.lead.create({
      data: createLeadDto,
    });
  }

  async findAll({
    name,
    phone,
    findUsBy,
    age,
    score,
    status,
    modality,
    preferencePeriod,
    sortBy = 'updatedAt',
    sortOrder = 'desc',
  }: {
    name: string;
    phone: string;
    findUsBy: string;
    age: string;
    score: string;
    status: string;
    modality: string;
    preferencePeriod: string;
    sortBy: string;
    sortOrder: 'asc' | 'desc';
  }) {
    const dashboard = await this.getDashboard();
    const value = await this.prisma.lead.findMany({
      where: {
        OR: name
          ? [
              { firstName: { contains: name, mode: 'insensitive' } },
              { lastName: { contains: name, mode: 'insensitive' } },
              { phone: { contains: name } },
            ]
          : undefined,
        phone: phone ? { contains: phone } : undefined,
        findUsBy: findUsBy ? { equals: findUsBy } : undefined,
        age: age ? { equals: Number(age) } : undefined,
        score: score ? { equals: Number(score) } : undefined,
        status: status ? { equals: Number(status) } : undefined,
        modalityOfInterest: modality ? { equals: modality } : undefined,
        preferencePeriod: preferencePeriod
          ? { equals: preferencePeriod }
          : undefined,
      },
      orderBy: {
        [sortBy]: sortOrder,
      },
    });
    return { value, dashboard };
  }

  async findOne(id: string) {
    return await this.prisma.lead.findUnique({ where: { id } });
  }

  async update(id: string, updateLeadDto: UpdateLeadDto) {
    return await this.prisma.lead.update({
      where: { id },
      data: updateLeadDto,
    });
  }

  async remove(id: string) {
    return await this.prisma.lead.delete({ where: { id } });
  }

  async getDashboard() {
    const totalLeads = await this.prisma.lead.count();

    const leadsByStatus = await this.prisma.lead.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const leadsByModality = await this.prisma.lead.groupBy({
      by: ['modalityOfInterest'],
      _count: { modalityOfInterest: true },
    });

    const leadsByFindUsBy = await this.prisma.lead.groupBy({
      by: ['findUsBy'],
      _count: { findUsBy: true },
    });

    const averageScore = await this.prisma.lead.aggregate({
      _avg: { score: true },
    });

    const newLeadsLast7Days = await this.prisma.lead.count({
      where: {
        createdAt: {
          gte: new Date(new Date().setDate(new Date().getDate() - 7)),
        },
      },
    });

    return {
      totalLeads,
      leadsByStatus,
      leadsByModality,
      leadsByFindUsBy,
      averageScore: averageScore._avg.score || 0,
      newLeadsLast7Days,
    };
  }
}
