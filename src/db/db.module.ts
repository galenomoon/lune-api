import { Module } from '@nestjs/common';
import { PrismaService } from 'src/config/prisma.service';
import { DBController } from './db.controller';
import { DBService } from './db.service';

@Module({
  controllers: [DBController],
  providers: [DBService, PrismaService],
})
export class DBModule {}
