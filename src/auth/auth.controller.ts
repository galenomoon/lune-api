import {
  Controller,
  Post,
  Body,
  Get,
  HttpCode,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { LoginAuthDto } from './dto/login-auth.dto';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { AuthGuard } from './auth.guard';
import { Request } from 'express';
import { AuthTeacherGuard } from './auth_teacher.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @UseGuards(AuthGuard)
  @Post('register')
  @HttpCode(201)
  async register(@Body() createUserDto: CreateUserDto) {
    return await this.authService.register(createUserDto);
  }

  @UseGuards(AuthGuard)
  @Get('me')
  @HttpCode(201)
  async me(@Req() req: Request) {
    return await this.authService.me(req.user.id);
  }

  @UseGuards(AuthTeacherGuard)
  @Get('teacher/me')
  @HttpCode(201)
  async meTeacher(@Req() req: Request) {
    return await this.authService.meTeacher(req.user.id);
  }

  @Post('teacher/login')
  @HttpCode(200)
  async loginTeacher(@Body() loginAuthDto: LoginAuthDto) {
    return await this.authService.loginTeacher(loginAuthDto);
  }

  @Post('login')
  @HttpCode(200)
  async login(@Body() loginAuthDto: LoginAuthDto) {
    return await this.authService.login(loginAuthDto);
  }
}