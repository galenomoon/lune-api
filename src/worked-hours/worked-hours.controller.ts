import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { WorkedHoursService } from './worked-hours.service';
import { CreateWorkedHourDto } from './dto/create-worked-hour.dto';
import { UpdateWorkedHourDto } from './dto/update-worked-hour.dto';

@Controller('worked-hours')
export class WorkedHoursController {
  constructor(private readonly workedHoursService: WorkedHoursService) {}

  @Post()
  async create(@Body() createWorkedHourDto: CreateWorkedHourDto) {
    return await this.workedHoursService.create(createWorkedHourDto);
  }

  @Get()
  async findAll() {
    return await this.workedHoursService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.workedHoursService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateWorkedHourDto: UpdateWorkedHourDto,
  ) {
    return await this.workedHoursService.update(id, updateWorkedHourDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.workedHoursService.remove(id);
  }
}
