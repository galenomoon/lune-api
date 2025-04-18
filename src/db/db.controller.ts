import { Controller, Get, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { DBService } from './db.service';

@UseGuards(AuthGuard)
@Controller('db')
export class DBController {
  constructor(private readonly dbService: DBService) {}

  @Get('fix')
  async fix() {
    return await this.dbService.fix();
  }
}
