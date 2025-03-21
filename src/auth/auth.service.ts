import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { UsersService } from '../user/user.service';
import { User } from '@prisma/client';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  async register(createUserDto: CreateUserDto) {
    const user = await this.usersService.create(createUserDto);

    return {
      user,
      accessToken: await this.generateToken(user),
    };
  }

  async me(userId: string) {
    const user = await this.usersService.findOne(userId)
    if (!user) {
      throw new BadRequestException('Session expired');
    }
    return user
  }

  async login(loginAuthDto: LoginAuthDto) {
    const user = await this.usersService.findByEmail(loginAuthDto.email);
    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    const isPasswordMatch = await this.usersService.comparePassword(
      loginAuthDto.password,
      user.password,
    );

    if (!isPasswordMatch) {
      throw new BadRequestException('Invalid credentials');
    }

    return {
      user,
      accessToken: await this.generateToken(user),
    };
  }

  private async generateToken(user: User) {
    const payload = { sub: user.id, user };
    return await this.jwtService.signAsync(payload, {
      privateKey: String(process.env.JWT_SECRET),
      expiresIn: '1d',
    });
  }
}
