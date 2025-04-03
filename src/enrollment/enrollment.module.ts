import { Module } from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { EnrollmentController } from './enrollment.controller';
import { PrismaService } from 'src/config/prisma.service';

@Module({
  imports: [],
  controllers: [EnrollmentController],
  providers: [EnrollmentService, PrismaService],
})
export class EnrollmentModule {}
