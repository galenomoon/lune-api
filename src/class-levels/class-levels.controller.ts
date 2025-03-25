import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ClassLevelsService } from './class-levels.service';
import { CreateClassLevelDto } from './dto/create-class-level.dto';
import { UpdateClassLevelDto } from './dto/update-class-level.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('class-levels')
export class ClassLevelsController {
  constructor(private readonly classLevelsService: ClassLevelsService) {}

  @Post()
  async create(@Body() createClassLevelDto: CreateClassLevelDto) {
    return await this.classLevelsService.create(createClassLevelDto);
  }

  @Get()
  async findAll() {
    return await this.classLevelsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.classLevelsService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateClassLevelDto: UpdateClassLevelDto,
  ) {
    return await this.classLevelsService.update(id, updateClassLevelDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.classLevelsService.remove(id);
  }
}
