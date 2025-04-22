import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/config/prisma.service';
import * as crypto from 'crypto';
import * as bcrypt from 'bcrypt';

@Injectable()
export class DBService {
  constructor(private readonly prisma: PrismaService) {}

  async fix() {
  }
}
