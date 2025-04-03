import { PrismaClient } from '@prisma/client';

export class DBService {
  constructor(private prisma: PrismaClient) {}

  async fix() {
    const leads = await this.prisma.lead.findMany();
    const teachers = await this.prisma.teacher.findMany();

    for (const lead of leads) {
      const normalizedPhone = lead?.phone?.replace(/\D/g, '');

      if (lead.phone !== normalizedPhone) {
        await this.prisma.lead.update({
          where: { id: lead.id },
          data: { phone: normalizedPhone },
        });
      }
    }

    for (const teacher of teachers) {
      const normalizedPhone = teacher?.phone?.replace(/\D/g, '');

      if (teacher.phone !== normalizedPhone) {
        await this.prisma.teacher.update({
          where: { id: teacher.id },
          data: { phone: normalizedPhone },
        });
      }
    }
  }
}
