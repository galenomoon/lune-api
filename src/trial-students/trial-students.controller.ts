import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { TrialStudentsService } from './trial-students.service';
import { CreateTrialStudentDto } from './dto/create-trial-student.dto';
import { UpdateTrialStudentDto } from './dto/update-trial-student.dto';

@Controller('trial-students')
export class TrialStudentsController {
  constructor(private readonly trialStudentsService: TrialStudentsService) {}

  @Post()
  async create(@Body() createTrialStudentDto: CreateTrialStudentDto) {
    return await this.trialStudentsService.create(createTrialStudentDto);
  }

  @Get()
  async findAll() {
    return await this.trialStudentsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.trialStudentsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateTrialStudentDto: UpdateTrialStudentDto) {
    return await this.trialStudentsService.update(id, updateTrialStudentDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.trialStudentsService.remove(id);
  }
}
