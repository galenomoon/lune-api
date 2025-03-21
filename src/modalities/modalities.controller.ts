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
import { ModalitiesService } from './modalities.service';
import { CreateModalityDto } from './dto/create-modality.dto';
import { UpdateModalityDto } from './dto/update-modality.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('modalities')
export class ModalitiesController {
  constructor(private readonly modalitiesService: ModalitiesService) {}

  @Post()
  async create(@Body() createModalityDto: CreateModalityDto) {
    return await this.modalitiesService.create(createModalityDto);
  }

  @Get()
  async findAll(@Query('name') name: string) {
    return await this.modalitiesService.findAll({
      name,
    });
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.modalitiesService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateModalityDto: UpdateModalityDto,
  ) {
    return await this.modalitiesService.update(id, updateModalityDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.modalitiesService.remove(id);
  }
}
