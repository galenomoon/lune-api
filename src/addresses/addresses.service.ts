import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/config/prisma.service';
import { CreateAddressDto } from './dto/create-address.dto';
import { UpdateAddressDto } from './dto/update-address.dto';

@Injectable()
export class AddressesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAddressDto) {
    return this.prisma.address.create({ data: dto });
  }

  async findAll() {
    return this.prisma.address.findMany({ include: { student: true } });
  }

  async findOne(id: string) {
    const address = await this.prisma.address.findUnique({ where: { id } });
    if (!address) throw new NotFoundException('Endereço não encontrado');
    return address;
  }

  async update(id: string, dto: UpdateAddressDto) {
    return this.prisma.address.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    return this.prisma.address.delete({ where: { id } });
  }
}