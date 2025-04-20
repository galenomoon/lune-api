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
import { GridItemsService } from './grid-items.service';
import { CreateGridItemDto } from './dto/create-grid-item.dto';
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
  async findAll(
    @Query('name') name: string,
    @Query('ageRange') ageRange: string,
    @Query('teacherId') teacherId: string,
    @Query('modalityId') modalityId: string,
    @Query('classLevelId') classLevelId: string,
  ) {
    return await this.gridItemsService.findAll({
      name,
      ageRange,
      teacherId,
      modalityId,
      classLevelId,
    });
  }

  @Get('list')
  async listGridItems() {
    return await this.gridItemsService.listGridItems();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.gridItemsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateGridItemDto: CreateGridItemDto,
  ) {
    return await this.gridItemsService.update(id, updateGridItemDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.gridItemsService.remove(id);
  }
}
