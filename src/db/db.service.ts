import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/prisma.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DBService {
  constructor(private readonly prisma: PrismaService) {}

  async fix() {
    const teachers = await this.prisma.teacher.findMany();

    for (const teacher of teachers) {
      if (teacher?.cpf) {
        const salt = crypto.randomInt(0, 10);
        const hashed_password = await bcrypt.hash(teacher.cpf.replace(/\D/g, '')?.slice(0, 4), salt);
    
        await this.prisma.teacher.update({
          where: { id: teacher.id },
          data: { password: hashed_password },
        });
      }
    }
  }
}
