import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
} from '@nestjs/common';
import { EnrollmentService } from './enrollment.service';
import { CreateEnrollmentDto } from './dto/create-enrollment.dto';
import { UpdateEnrollmentDto } from './dto/update-enrollment.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('enrollment')
export class EnrollmentController {
  constructor(private readonly enrollmentService: EnrollmentService) {}

  @Post()
  async create(@Body() createEnrollmentDto: CreateEnrollmentDto) {
    return await this.enrollmentService.create(createEnrollmentDto);
  }

  @Get()
  async findAll(
    @Query('name') name: string,
    @Query('status') status: string,
    @Query('planId') planId: string,
    @Query('paymentDay') paymentDay: number,
  ) {
    return await this.enrollmentService.findAll({
      name,
      status,
      planId,
      paymentDay,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.enrollmentService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateEnrollmentDto: UpdateEnrollmentDto,
  ) {
    return await this.enrollmentService.update(id, updateEnrollmentDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.enrollmentService.remove(id);
  }
}
