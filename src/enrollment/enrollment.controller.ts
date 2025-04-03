import {
  Controller,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Get,
} from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('enrollment')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.enrollmentService.findOne(id);
  }

  @Post()
  async create(@Body() createEnrollmentDto: CreateEnrollmentDto) {
    return await this.enrollmentService.create(createEnrollmentDto);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateEnrollmentDto: UpdateEnrollmentDto,
  ) {
    return await this.enrollmentService.update(id, updateEnrollmentDto);
  }

  @Post('renew/:id')
  async renew(@Param('id') id: string, @Body() { planId }: { planId: string }) {
    return await this.enrollmentService.renew(id, planId);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.enrollmentService.remove(id);
  }

  @Post('cancel/:id')
  async cancelEnrollment(@Param('id') id: string) {
    return await this.enrollmentService.cancelEnrollment(id);
  }
}
