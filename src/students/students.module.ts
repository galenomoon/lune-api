import { Module } from '@nestjs/common';
import { StudentsService } from './students.service';
import { StudentsController } from './students.controller';
import { PrismaService } from 'src/config/prisma.service';

@Module({
  controllers: [StudentsController],
  providers: [StudentsService, PrismaService],
})
export class StudentsModule {}
