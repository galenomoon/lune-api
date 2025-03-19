import { Module } from '@nestjs/common';
import { LeadService } from './lead.service';
import { LeadController } from './lead.controller';
import { PrismaService } from 'src/config/prisma.service';

@Module({
  controllers: [LeadController],
  providers: [LeadService, PrismaService],
})
export class LeadModule {}
