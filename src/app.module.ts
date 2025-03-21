import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LeadModule } from './lead/lead.module';
import { UserModule } from './user/user.module';
import { AuthModule } from './auth/auth.module';
import { ModalitiesModule } from './modalities/modalities.module';

@Module({
  imports: [LeadModule, UserModule, AuthModule, ModalitiesModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
