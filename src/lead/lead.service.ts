import { PrismaService } from './../config/prisma.service';
import { Injectable } from '@nestjs/common';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';

@Injectable()
export class LeadService {
  constructor(private readonly prismaService: PrismaService) {}

  async create(createLeadDto: CreateLeadDto) {
    return await this.prismaService.lead.create({
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
    sortBy,
    sortOrder,
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
    const value = await this.prismaService.lead.findMany({
      where: {
        OR: name
          ? [
              { firstName: { contains: name, mode: 'insensitive' } },
              { lastName: { contains: name, mode: 'insensitive' } },
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
        updatedAt: 'desc',
        [sortBy]: sortOrder,
      },
    });
    return { value, dashboard };
  }

  async findOne(id: string) {
    return await this.prismaService.lead.findUnique({ where: { id } });
  }

  async update(id: string, updateLeadDto: UpdateLeadDto) {
    return await this.prismaService.lead.update({
      where: { id },
      data: updateLeadDto,
    });
  }

  async remove(id: string) {
    return await this.prismaService.lead.delete({ where: { id } });
  }

  async getDashboard() {
    const totalLeads = await this.prismaService.lead.count();

    const leadsByStatus = await this.prismaService.lead.groupBy({
      by: ['status'],
      _count: { status: true },
    });

    const leadsByModality = await this.prismaService.lead.groupBy({
      by: ['modalityOfInterest'],
      _count: { modalityOfInterest: true },
    });

    const leadsByFindUsBy = await this.prismaService.lead.groupBy({
      by: ['findUsBy'],
      _count: { findUsBy: true },
    });

    const averageScore = await this.prismaService.lead.aggregate({
      _avg: { score: true },
    });

    const newLeadsLast7Days = await this.prismaService.lead.count({
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
