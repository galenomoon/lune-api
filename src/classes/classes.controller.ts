import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ClassesService } from './classes.service';
import { CreateClassDto } from './dto/create-class.dto';
import { UpdateClassDto } from './dto/update-class.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('classes')
export class ClassesController {
  constructor(private readonly classesService: ClassesService) {}

  @Post()
  async create(@Body() createClassDto: CreateClassDto) {
    return await this.classesService.create(createClassDto);
  }

  @Get()
  async findAll(
    @Query('name') name: string,
    @Query('ageRange') ageRange: string,
    @Query('teacherId') teacherId: string,
    @Query('modalityId') modalityId: string,
    @Query('classLevelId') classLevelId: string,
  ) {
    return await this.classesService.findAll({
      name,
      ageRange,
      teacherId,
      modalityId,
      classLevelId,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.classesService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateClassDto: UpdateClassDto,
  ) {
    return await this.classesService.update(id, updateClassDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.classesService.remove(id);
  }
}
