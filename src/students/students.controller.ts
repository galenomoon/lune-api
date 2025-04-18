import {
  Controller,
  Get,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Post,
} from '@nestjs/common';
import { StudentsService } from './students.service';
import { UpdateStudentDto } from './dto/update-student.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('students')
export class StudentsController {
  constructor(private readonly studentsService: StudentsService) {}

  @Get()
  async findAll(
    @Query('name') name: string,
    @Query('status') status: string,
    @Query('planId') planId: string,
    @Query('paymentDay') paymentDay: number,
  ) {
    return await this.studentsService.findAll({
      name,
      status,
      planId,
      paymentDay,
    });
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateStudentDto: UpdateStudentDto,
  ) {
    return await this.studentsService.update(id, updateStudentDto);
  }

  @Post('add/enrollment/:id')
  async addEnrollment(
    @Param('id') id: string,
    @Body() { planId, classId, startDate, paymentDay },
  ) {
    return await this.studentsService.addEnrollment(id, {
      planId,
      classId,
      startDate,
      paymentDay,
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.studentsService.remove(id);
  }
}
