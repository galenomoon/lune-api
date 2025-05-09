import { PartialType } from '@nestjs/mapped-types';
import { CreateWorkedHourDto } from './create-worked-hour.dto';

export class UpdateWorkedHourDto extends PartialType(CreateWorkedHourDto) {}
