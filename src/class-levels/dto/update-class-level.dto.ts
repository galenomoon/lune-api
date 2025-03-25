import { PartialType } from '@nestjs/mapped-types';
import { CreateClassLevelDto } from './create-class-level.dto';

export class UpdateClassLevelDto extends PartialType(CreateClassLevelDto) {}
