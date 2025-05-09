import { Module } from '@nestjs/common';
import { WorkedHoursService } from './worked-hours.service';
import { WorkedHoursController } from './worked-hours.controller';
import { PrismaService } from 'src/config/prisma.service';

@Module({
  controllers: [WorkedHoursController],
  providers: [WorkedHoursService, PrismaService],
})
export class WorkedHoursModule {}
