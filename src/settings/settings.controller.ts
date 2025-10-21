import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common';
import { SettingsService } from './settings.service';
import { UpdateSettingsDto } from './dto/update-settings.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  async get() {
    return await this.settingsService.get();
  }

  @Patch()
  async update(@Body() updateSettingsDto: UpdateSettingsDto) {
    return await this.settingsService.update(updateSettingsDto);
  }
}
