import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { CreateUserDto } from '../user/dto/create-user.dto';
import { LoginAuthDto } from './dto/login-auth.dto';
import { UsersService } from '../user/user.service';
import { Teacher, User } from '@prisma/client';
import { PrismaService } from 'src/config/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
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
    const user = await this.usersService.findOne(userId);
    if (!user) {
      throw new BadRequestException('Session expired');
    }
    return user;
  }

  async meTeacher(teacherId: string) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { id: teacherId },
      include: {
        classes: {
          include: {
            modality: true,
          },
        },
      },
    });

    if (!teacher) {
      throw new BadRequestException('Session expired');
    }

    const modalities = teacher.classes
      .map((classItem) => {
        return {
          id: classItem.modality.id,
          name: classItem.modality.name,
        };
      })
      .filter(
        (modality, index, self) =>
          index === self.findIndex((m) => m.name === modality.name)
      );

    return { ...teacher, modalities };
  }

  async loginTeacher(loginAuthDto: LoginAuthDto) {
    const teacher = await this.prisma.teacher.findFirst({
      where: { cpf: loginAuthDto.cpf },
    });

    if (!teacher?.password) {
      throw new BadRequestException('Invalid credentials');
    }

    const isPasswordMatch = await this.usersService.comparePassword(
      loginAuthDto.password,
      teacher.password,
    );

    if (!isPasswordMatch) {
      throw new BadRequestException('Invalid credentials');
    }

    return {
      teacher,
      accessToken: await this.generateTeacherToken(teacher),
    };
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

  private async generateTeacherToken(user: Teacher) {
    const payload = { sub: user.id, user };
    return await this.jwtService.signAsync(payload, {
      privateKey: String(process.env.JWT_SECRET),
      expiresIn: '1d',
    });
  }
}
