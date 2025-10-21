/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { PrismaService } from 'src/config/prisma.service';

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get() {
    // Busca ou cria o registro de configurações
    let settings = await this.prisma.settings.findFirst();

    if (!settings) {
      // Se não existir, cria com valores padrão
      settings = await this.prisma.settings.create({
        data: {
          trialClassPrice: 40,
          teacherCommissionPerEnrollment: 20,
          teacherCommissionPerTrialClass: 0,
        },
      });
    }

    return settings;
  }

  async update(updateSettingsDto: UpdateSettingsDto) {
    // Garante que existe um registro
    const existing = await this.get();

    // Atualiza o registro existente
    return await this.prisma.settings.update({
      where: { id: existing.id },
      data: updateSettingsDto,
    });
  }
}
