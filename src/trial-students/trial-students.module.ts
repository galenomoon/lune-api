import { Module } from '@nestjs/common';
import { TrialStudentsService } from './trial-students.service';
import { TrialStudentsController } from './trial-students.controller';
import { PrismaService } from 'src/config/prisma.service';

@Module({
  controllers: [TrialStudentsController],
  providers: [TrialStudentsService, PrismaService],
})
export class TrialStudentsModule {}
