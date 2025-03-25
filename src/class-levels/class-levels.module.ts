import { Module } from '@nestjs/common';
import { ClassLevelsService } from './class-levels.service';
import { ClassLevelsController } from './class-levels.controller';
import { PrismaService } from 'src/config/prisma.service';

@Module({
  controllers: [ClassLevelsController],
  providers: [ClassLevelsService, PrismaService],
})
export class ClassLevelsModule {}
