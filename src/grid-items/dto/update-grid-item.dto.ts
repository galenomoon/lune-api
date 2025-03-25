import { PartialType } from '@nestjs/mapped-types';
import { CreateGridItemDto } from './create-grid-item.dto';

export class UpdateGridItemDto extends PartialType(CreateGridItemDto) {}
