import { Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { MailerController } from './mail.controller';
import { PrismaService } from 'src/config/prisma.service';

@Module({
  controllers: [MailerController],
  providers: [MailService, PrismaService],
  exports: [MailService],
})
export class MailModule {}