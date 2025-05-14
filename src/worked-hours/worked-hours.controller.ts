import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { WorkedHoursService } from './worked-hours.service';
import { CreateWorkedHourDto } from './dto/create-worked-hour.dto';
import { WorkedHourStatus } from '@prisma/client';
import { AuthGuard } from 'src/auth/auth.guard';
import { Request } from 'express';

@Controller('worked-hours')
export class WorkedHoursController {
  constructor(private readonly workedHoursService: WorkedHoursService) {}

  @UseGuards(AuthGuard)
  @Post()
  async create(@Body() createWorkedHourDto: CreateWorkedHourDto) {
    return await this.workedHoursService.create(createWorkedHourDto);
  }

  @UseGuards(AuthGuard)
  @Get()
  async findAll(@Query('month') month: string) {
    return await this.workedHoursService.findAll(month);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string, @Query('month') month: string) {
    return await this.workedHoursService.findOne(id, month);
  }

  @UseGuards(AuthGuard)
  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateWorkedHourStatus: Record<'status', WorkedHourStatus>,
    @Req() req: Request,
  ) {
    return await this.workedHoursService.updateStatus(
      id,
      updateWorkedHourStatus.status,
      req.user.id,
    );
  }
}
