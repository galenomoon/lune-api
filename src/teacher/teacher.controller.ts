import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { TeacherService } from './teacher.service';
import { CreateTeacherDto } from './dto/create-teacher.dto';
import { UpdateTeacherDto } from './dto/update-teacher.dto';
import { AuthGuard } from 'src/auth/auth.guard';
import { AuthTeacherGuard } from 'src/auth/auth_teacher.guard';
import { Request } from 'express';

@Controller('teachers')
export class TeacherController {
  constructor(private readonly teacherService: TeacherService) {}

  @UseGuards(AuthGuard)
  @Post()
  async create(@Body() createTeacherDto: CreateTeacherDto) {
    return await this.teacherService.create(createTeacherDto);
  }

  @UseGuards(AuthGuard)
  @Get()
  async findAll(
    @Query('name') name: string,
    @Query('sortBy') sortBy: string,
    @Query('sortOrder') sortOrder: 'asc' | 'desc',
  ) {
    return await this.teacherService.findAll({
      name,
      sortBy,
      sortOrder,
    });
  }

  @UseGuards(AuthTeacherGuard)
  @Get('schedule/week')
  async getTeacherScheduleByWeek(
    @Req() req: Request,
    @Query('week') week?: string,
  ) {
    const weekDate = week ? new Date(week) : new Date();

    return await this.teacherService.getWeeklySchedule(req.user.id, weekDate);
  }

  @UseGuards(AuthTeacherGuard)
  @Get('me/salary-summary')
  async getTeacherSalarySummary(
    @Req() req: Request,
    @Query('month') month?: string,
    @Query('year') year?: string,
  ) {
    const monthNumber = month ? parseInt(month) : undefined;
    const yearNumber = year ? parseInt(year) : undefined;
    return await this.teacherService.getTeacherSalarySummary(
      req.user.id,
      monthNumber,
      yearNumber,
    );
  }

  @UseGuards(AuthTeacherGuard)
  @Get('me/schedule')
  async getNearestClasses(@Req() req: Request) {
    return await this.teacherService.getNearestClasses(req.user.id);
  }

  @UseGuards(AuthGuard)
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.teacherService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateTeacherDto: UpdateTeacherDto,
  ) {
    return await this.teacherService.update(id, updateTeacherDto);
  }

  @UseGuards(AuthGuard)
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.teacherService.remove(id);
  }
}
