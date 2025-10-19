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
  Delete,
} from '@nestjs/common';
import { WorkedHoursService } from './worked-hours.service';
import { CreateWorkedHourDto } from './dto/create-worked-hour.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { Request } from 'express';
import {
  UpdateWorkedHourDto,
  UpdateWorkedHourTeacherDto,
  UpdateWorkedHourStatusDto,
} from './dto/update-worked-hour.dto';

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
  async findAll(@Query('month') month: string, @Query('year') year: string) {
    return await this.workedHoursService.findAll(month, year);
  }

  // Rotas específicas DEVEM vir ANTES das rotas com parâmetros
  @Get('cron/create-batch')
  async cronCreateBatch() {
    return await this.workedHoursService.createBatch();
  }

  @UseGuards(AuthGuard)
  @Get('pending/count')
  async getPendingCount(): Promise<{ count: number }> {
    return await this.workedHoursService.getPendingCount();
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
    @Body() updateWorkedHourDto: UpdateWorkedHourDto,
  ): Promise<any> {
    return await this.workedHoursService.update(id, updateWorkedHourDto);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() { status }: UpdateWorkedHourStatusDto,
    @Req() req: Request,
  ): Promise<any> {
    return await this.workedHoursService.updateStatus(id, status, req.user.id);
  }

  @UseGuards(AuthGuard)
  @Patch(':id/teacher')
  async updateTeacher(
    @Param('id') id: string,
    @Body() updateTeacherDto: UpdateWorkedHourTeacherDto,
  ): Promise<any> {
    return await this.workedHoursService.updateTeacher(
      id,
      updateTeacherDto.teacherId,
    );
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string): Promise<any> {
    return await this.workedHoursService.remove(id);
  }
}
