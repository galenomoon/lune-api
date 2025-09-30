import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Version,
} from '@nestjs/common';
import { TrialStudentsService } from './trial-students.service';
import { CreateTrialStudentDto } from './dto/create-trial-student.dto';
import { UpdateTrialStudentDto } from './dto/update-trial-student.dto';
import { UpdateStatusDto } from './dto/update-status.dto';
import { AuthGuard } from 'src/auth/auth.guard';

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
  async update(
    @Param('id') id: string,
    @Body() updateTrialStudentDto: UpdateTrialStudentDto,
  ) {
    return await this.trialStudentsService.update(id, updateTrialStudentDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.trialStudentsService.remove(id);
  }

  // ============ V2 ENDPOINTS ============

  @UseGuards(AuthGuard)
  @Version('2')
  @Get('pending')
  async findPendingStatus() {
    return await this.trialStudentsService.findPendingStatus();
  }

  @UseGuards(AuthGuard)
  @Version('2')
  @Patch(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateStatusDto: UpdateStatusDto,
  ) {
    return await this.trialStudentsService.updateStatus(
      id,
      updateStatusDto.status,
    );
  }
}
