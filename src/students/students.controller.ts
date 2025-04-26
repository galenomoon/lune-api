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
    return await this.studentsService.findAll();
  }

  @Get('search')
  async search(@Query('query') name: string) {
    return await this.studentsService.search({ name });
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
    @Body() { planId, classId, startDate, paymentDay, durationInDays },
  ) {
    return await this.studentsService.addEnrollment(id, {
      planId,
      classId,
      startDate,
      paymentDay,
      durationInDays
    });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.studentsService.remove(id);
  }
}
