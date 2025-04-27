import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTrialStudentDto } from './dto/create-trial-student.dto';
import { UpdateTrialStudentDto } from './dto/update-trial-student.dto';
import { PrismaService } from 'src/config/prisma.service';
import { getTimePeriod } from 'src/utils/getTimePeriod';
import { LEAD_SCORES_NUMBERS, LEAD_STATUS_NUMBERS } from 'src/constants';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';

@Injectable()
export class TrialStudentsService {
  constructor(private prisma: PrismaService) {}

  async create({ lead, gridItem, date }: CreateTrialStudentDto) {
    return await this.prisma.$transaction(async (prisma) => {
      const currentGridItem = await prisma.gridItem.findFirst({
        where: {
          id: gridItem.id,
        },
        include: {
          class: {
            include: {
              modality: true,
            },
          },
        },
      });

      if (!currentGridItem) {
        throw new NotFoundException('Grid Item não encontrado');
      }

      const newLead = await prisma.lead.create({
        data: {
          ...lead,
          modalityOfInterest: currentGridItem!.class!.modality.name,
          preferencePeriod: getTimePeriod(currentGridItem.startTime),
          score: LEAD_SCORES_NUMBERS.trialClass,
          status: LEAD_STATUS_NUMBERS.newLead,
        },
      });

      const trialStudent = await prisma.trialStudent.create({
        data: {
          leadId: newLead.id,
          gridItemId: currentGridItem.id,
          date,
        },
      });

      return trialStudent;
    });
  }

  async findAll() {
    const trialStudents = await this.prisma.trialStudent.findMany({
      orderBy: {
        date: 'asc',
      },
      include: {
        lead: true,
        gridItem: {
          include: {
            class: {
              include: {
                modality: true,
                classLevel: true,
              },
            },
          },
        },
      },
    });

    if (trialStudents.length === 0) {
      return {
        nearestTrialClasses: null,
        list: [],
      };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureTrials = trialStudents.filter((t) => t.date >= today);

    const nearestDate = futureTrials.length ? futureTrials[0].date : null;

    if (!nearestDate) {
      return {
        nearestTrialClasses: null,
        list: trialStudents,
      };
    }

    const nearestTrialsSameDay = futureTrials.filter(
      (t) => t.date.toDateString() === nearestDate.toDateString(),
    );

    type TrialClassGroup = {
      modality: string;
      classLevel: string;
      startTime: string;
      endTime: string;
      trialStudents: typeof trialStudents;
    };

    const groupedByGridItem: Record<string, TrialClassGroup> = {};

    for (const trial of nearestTrialsSameDay) {
      const gridItemId = trial.gridItem.id;

      if (!groupedByGridItem[gridItemId]) {
        groupedByGridItem[gridItemId] = {
          modality: trial!.gridItem!.class!.modality.name,
          classLevel: trial!.gridItem!.class!.classLevel?.name || '',
          startTime: trial.gridItem.startTime,
          endTime: trial.gridItem.endTime,
          trialStudents: [],
        };
      }

      groupedByGridItem[gridItemId].trialStudents.push(trial);
    }

    const trialClasses = Object.values(groupedByGridItem).sort((a, b) =>
      a.startTime.localeCompare(b.startTime),
    );

    const formattedDate = format(nearestDate, "EEEE, dd 'de' MMMM", {
      locale: ptBR,
    });

    // Construir weekResume com a tabela de dois sentidos (dias x gridItems)
    const weekResume: Record<string, Record<string, any[]>> = {};

    // Preencher a tabela para cada dia da semana
    const daysOfWeek = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ];

    daysOfWeek.forEach((day) => {
      weekResume[day] = {}; // Inicializa cada dia com um objeto vazio

      // Filtra as aulas para cada dia da semana
      trialStudents.forEach((trial) => {
        const trialDay = trial.gridItem.dayOfWeek
        const gridItemLabel = `${trial!.gridItem!.class!.modality!.name}@${trial!.gridItem!.class!.classLevel?.name || ''} ${trial!.gridItem!.class!.description || ''} | ${trial!.gridItem!.startTime || ''} - ${trial!.gridItem!.endTime || ''}`;

        if (trialDay === day) {
          if (!weekResume[day][gridItemLabel]) {
            weekResume[day][gridItemLabel] = [];
          }
          
          weekResume[day][gridItemLabel].push({trial, ...trial.lead});
        }
      });
    });

    return {
      nearestTrialClasses: {
        date: formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1),
        totalTrialStudents: nearestTrialsSameDay.length,
        trialClasses,
      },
      list: trialStudents.map((item) => ({
        ...item,
        ...item.lead,
        ...item.gridItem,
        id: item.id,
      })),
      weekResume
    };
  }

  async findOne(id: string) {
    const trialStudent = await this.prisma.trialStudent.findUnique({
      where: { id },
      include: {
        lead: true,
        gridItem: {
          include: {
            class: {
              include: {
                modality: true,
                teacher: true,
              },
            },
          },
        },
        invite: true,
      },
    });

    if (!trialStudent) {
      throw new NotFoundException('Trial Student não encontrado');
    }

    return trialStudent;
  }

  async update(id: string, updateTrialStudentDto: UpdateTrialStudentDto) {
    const trialStudent = await this.prisma.trialStudent.findUnique({
      where: { id },
      include: { lead: true },
    });

    if (!trialStudent) {
      throw new NotFoundException('Trial Student não encontrado');
    }

    const { lead, gridItem, date } = updateTrialStudentDto;

    await this.prisma.$transaction(async (prisma) => {
      if (lead) {
        await prisma.lead.update({
          where: { id: trialStudent.leadId },
          data: lead,
        });
      }

      await prisma.trialStudent.update({
        where: { id },
        data: {
          ...(gridItem?.id && { gridItemId: gridItem?.id }),
          ...(date && { date }),
        },
      });
    });
  }

  async remove(id: string) {
    const trialStudent = await this.prisma.trialStudent.findUnique({
      where: { id },
    });

    if (!trialStudent) {
      throw new NotFoundException('Trial Student não encontrado');
    }

    return await this.prisma.trialStudent.delete({
      where: { id },
    });
  }
}
