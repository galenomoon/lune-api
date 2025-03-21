import { Module } from '@nestjs/common';
import { ModalitiesService } from './modalities.service';
import { ModalitiesController } from './modalities.controller';
import { PrismaService } from 'src/config/prisma.service';

@Module({
  controllers: [ModalitiesController],
  providers: [ModalitiesService, PrismaService],
})
export class ModalitiesModule {}
