import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { GridItemsService } from './grid-items.service';
import { CreateGridItemDto } from './dto/create-grid-item.dto';
import { UpdateGridItemDto } from './dto/update-grid-item.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('grid-items')
export class GridItemsController {
  constructor(private readonly gridItemsService: GridItemsService) {}

  @Post()
  async create(@Body() createGridItemDto: CreateGridItemDto) {
    return await this.gridItemsService.create(createGridItemDto);
  }

  @Get()
  async findAll() {
    return await this.gridItemsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.gridItemsService.findOne(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() updateGridItemDto: UpdateGridItemDto) {
    return await this.gridItemsService.update(id, updateGridItemDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.gridItemsService.remove(id);
  }
}
