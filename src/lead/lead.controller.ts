import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  Query,
  UseGuards,
} from '@nestjs/common';
import { LeadService } from './lead.service';
import { CreateLeadDto } from './dto/create-lead.dto';
import { UpdateLeadDto } from './dto/update-lead.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('leads')
export class LeadController {
  constructor(private readonly leadService: LeadService) {}

  @Post()
  @HttpCode(201)
  async create(@Body() createLeadDto: CreateLeadDto) {
    return await this.leadService.create(createLeadDto);
  }

  @Get('dashboard')
  @HttpCode(200)
  async getDashboard() {
    return await this.leadService.getDashboard();
  }

  @Get()
  @HttpCode(200)
  async findAll(
    @Query('name') name: string,
    @Query('phone') phone: string,
    @Query('findUsBy') findUsBy: string,
    @Query('age') age: string,
    @Query('score') score: string,
    @Query('status') status: string,
    @Query('modality') modality: string,
    @Query('preferencePeriod') preferencePeriod: string,
    @Query('sortBy') sortBy: string,
    @Query('sortOrder') sortOrder: 'asc' | 'desc',
  ) {
    return await this.leadService.findAll({
      name,
      phone,
      findUsBy,
      age,
      score,
      status,
      modality,
      preferencePeriod,
      sortBy,
      sortOrder,
    });
  }

  @Get(':id')
  @HttpCode(200)
  async findOne(@Param('id') id: string) {
    return await this.leadService.findOne(id);
  }

  @Patch(':id')
  @HttpCode(200)
  async update(@Param('id') id: string, @Body() updateLeadDto: UpdateLeadDto) {
    return await this.leadService.update(id, updateLeadDto);
  }

  @Patch('batch/update')
  @HttpCode(200)
  async batchUpdate(@Body() updateLeadDto: {
    ids: string[];
    city: string;
    findUsBy: string;
    modalityOfInterest: string;
    preferencePeriod: string;
    status: string;
    score: number;
  }) {
    return await this.leadService.batchUpdate(updateLeadDto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string) {
    return await this.leadService.remove(id);
  }
}
