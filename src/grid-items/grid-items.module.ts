import { Module } from '@nestjs/common';
import { GridItemsService } from './grid-items.service';
import { GridItemsController } from './grid-items.controller';
import { PrismaService } from 'src/config/prisma.service';

@Module({
  controllers: [GridItemsController],
  providers: [GridItemsService, PrismaService],
})
export class GridItemsModule {}
