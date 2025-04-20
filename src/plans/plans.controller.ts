import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Query } from '@nestjs/common';
import { PlansService } from './plans.service';
import { CreatePlanDto } from './dto/create-plan.dto';
import { UpdatePlanDto } from './dto/update-plan.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('plans')
export class PlansController {
  constructor(private readonly plansService: PlansService) {}

  @Post()
  async create(@Body() createPlanDto: CreatePlanDto) {
    return await this.plansService.create(createPlanDto);
  }

  @Get()
  async findAll(@Query() query: { isSecondary?: boolean }) {
    return await this.plansService.findAll(query);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.plansService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updatePlanDto: UpdatePlanDto) {
    return await this.plansService.update(id, updatePlanDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.plansService.remove(id);
  }
}
