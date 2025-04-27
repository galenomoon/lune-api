import { PartialType } from '@nestjs/mapped-types';
import { CreateTrialStudentDto } from './create-trial-student.dto';

export class UpdateTrialStudentDto extends PartialType(CreateTrialStudentDto) {}
