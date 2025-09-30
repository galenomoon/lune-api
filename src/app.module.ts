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
import { StudentsModule } from './students/students.module';
import { PaymentModule } from './payment/payment.module';
import { ContractModule } from './contract/contracts.module';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MailerModule } from '@nestjs-modules/mailer';
import { join } from 'path';
import { DBModule } from './db/db.module';
import { MailModule } from './mail/mail.module';
import { AddressesModule } from './addresses/addresses.module';
import { TrialStudentsModule } from './trial-students/trial-students.module';
// import { WorkedHoursModule } from './worked-hours/worked-hours.module';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
  imports: [
    LeadModule,
    UserModule,
    AuthModule,
    ModalitiesModule,
    TeacherModule,
    GridItemsModule,
    ClassLevelsModule,
    ClassesModule,
    PlansModule,
    EnrollmentModule,
    StudentsModule,
    PaymentModule,
    ContractModule,
    DBModule,
    MailModule,
    ScheduleModule.forRoot(),
    MailerModule.forRoot({
      transport: {
        service: 'gmail',
        auth: {
          user: process.env.EMAIL_USER,
          pass: process.env.EMAIL_PASS,
        },
      },
      defaults: {
        from: '"Lune Escola de Dança" no-reply@luneescoladedanca.com',
      },
      template: {
        dir: join(__dirname, 'templates'),
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
    AddressesModule,
    TrialStudentsModule,
    // WorkedHoursModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
