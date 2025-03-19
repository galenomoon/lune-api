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
    return await this.prismaService.lead.findMany({
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
        [sortBy]: sortOrder,
      },
    });
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
}
