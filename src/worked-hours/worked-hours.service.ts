import { Injectable } from '@nestjs/common';
import { UpdateWorkedHourDto } from './dto/update-worked-hour.dto';
import { PrismaService } from '../config/prisma.service';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WorkedHourStatus } from '@prisma/client';
import { CreateWorkedHourDto } from './dto/create-worked-hour.dto';

@Injectable()
export class WorkedHoursService {
  constructor(private readonly prismaService: PrismaService) {}

  @Cron(CronExpression.EVERY_10_SECONDS, {
    timeZone: 'America/Sao_Paulo',
  })
  async createBatch() {
    const dateAmericaSP = new Date(
      new Date().toLocaleString('en-US', {
        timeZone: 'America/Sao_Paulo',
      }),
    );
    const weekday = dateAmericaSP.getDay();

    const workedHoursToday = await this.prismaService.workedHour.findMany({
      where: {
        workedAt: {
          gte: new Date(dateAmericaSP.setHours(0, 0, 0, 0)),
          lte: new Date(dateAmericaSP.setHours(23, 59, 59, 999)),
        },
      },
    });
    if (workedHoursToday.length > 0) {
      console.log('Worked hours already created for today:', workedHoursToday);
      return;
    }

    const gridItems = await this.prismaService.gridItem.findMany({
      where: {
        dayOfWeek: {
          0: 'sunday',
          1: 'monday',
          2: 'tuesday',
          3: 'wednesday',
          4: 'thursday',
          5: 'friday',
          6: 'saturday',
        }[weekday],
        classId: {
          not: null,
        },
        class: {
          teacherId: {
            not: null,
          },
        },
      },
      include: {
        class: {
          include: {
            teacher: true,
          },
        },
      },
    });

    const workedHours = gridItems.map((gridItem) => {
      const start = this.convertStringTimeToDate(
        gridItem.startTime,
        new Date(),
      );
      const end = this.convertStringTimeToDate(gridItem.endTime, new Date());

      const duration = ((start.getTime() - end.getTime()) / 1000 / 60) * -1;

      return {
        teacherId: gridItem.class?.teacherId || '',
        classId: gridItem.classId || '',
        workedAt: dateAmericaSP,
        startedAt: this.convertStringTimeToDate(
          gridItem.startTime,
          dateAmericaSP,
        ),
        endedAt: this.convertStringTimeToDate(gridItem.endTime, dateAmericaSP),
        priceSnapshot: gridItem.class?.teacher?.priceHour || 0,
        status: WorkedHourStatus.PENDING,
        duration,
      };
    });

    const createdWorkedHours = await this.prismaService.workedHour.createMany({
      data: workedHours,
    });
    console.log('Created worked hours:', createdWorkedHours);
    return createdWorkedHours;
  }

  async create(createWorkedHourDto: CreateWorkedHourDto) {
    const duration =
      (new Date(createWorkedHourDto.startedAt).getTime() -
        new Date(createWorkedHourDto.endedAt).getTime()) /
      1000 /
      60 /
      60;

    return await this.prismaService.workedHour.create({
      data: {
        ...createWorkedHourDto,
        duration,
      },
    });
  }

  async findAll() {
    const workedHours = await this.prismaService.teacher.findMany({
      include: {
        WorkedHour: {
          include: {
            class: true,
          },
        },
      },
    });

    return workedHours;
  }

  async findOne(id: string) {
    return await this.prismaService.workedHour.findUnique({
      where: {
        id,
      },
      include: {
        class: true,
        teacher: true,
      },
    });
  }

  async update(id: string, updateWorkedHourDto: UpdateWorkedHourDto) {
    return await this.prismaService.workedHour.update({
      where: {
        id,
      },
      data: {
        ...updateWorkedHourDto,
      },
    });
  }

  async remove(id: string) {
    return await this.prismaService.workedHour.delete({
      where: {
        id,
      },
    });
  }

  convertStringTimeToDate(time: string, date: Date): Date {
    const _date = new Date(date);
    const [hour, min] = time.split(':').map(Number);
    _date.setHours(hour, min, 0, 0);
    return _date;
  }
}
