import { Module } from '@nestjs/common';
import { UsersService } from './user.service';
import { UserController } from './user.controller';
import { PrismaService } from 'src/config/prisma.service';

@Module({
  controllers: [UserController],
  providers: [UsersService, PrismaService],
})
export class UserModule {}
