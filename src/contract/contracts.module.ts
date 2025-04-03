import { Module } from '@nestjs/common';
import { ContractsService } from './contracts.service';
import { ContractsController } from './contracts.controller';
import { PrismaService } from 'src/config/prisma.service';

@Module({
  imports: [],
  controllers: [ContractsController],
  providers: [ContractsService, PrismaService],
})
export class ContractModule {}
