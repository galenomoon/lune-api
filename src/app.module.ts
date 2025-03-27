import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LeadModule } from './lead/lead.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ModalitiesModule } from './modalities/modalities.module';
import { TeacherModule } from './teacher/teacher.module';
import { GridItemsModule } from './grid-items/grid-items.module';
import { ClassLevelsModule } from './class-levels/class-levels.module';
import { ClassesModule } from './classes/classes.module';
import { PlansModule } from './plans/plans.module';
import { EnrollmentModule } from './enrollment/enrollment.module';

@Module({
  imports: [LeadModule, UserModule, AuthModule, ModalitiesModule, TeacherModule, GridItemsModule, ClassLevelsModule, ClassesModule, PlansModule, EnrollmentModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
