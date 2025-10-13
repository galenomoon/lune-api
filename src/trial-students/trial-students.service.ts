import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateTrialStudentDto } from './dto/create-trial-student.dto';
import { UpdateTrialStudentDto } from './dto/update-trial-student.dto';
import { PrismaService } from 'src/config/prisma.service';
import { getTimePeriod } from 'src/utils/getTimePeriod';
import { LEAD_SCORES_NUMBERS, LEAD_STATUS_NUMBERS } from 'src/constants';
import { ptBR } from 'date-fns/locale';
import { format } from 'date-fns';
import { Cron, CronExpression } from '@nestjs/schedule';

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
          modalityOfInterest: currentGridItem.class!.modality.name,
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
                teacher: true,
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

    // Separar trial students com e sem gridItem
    const trialStudentsWithGrid = trialStudents.filter((ts) => ts.gridItem);
    const trialStudentsWithoutGrid = trialStudents.filter((ts) => !ts.gridItem);

    if (trialStudentsWithoutGrid.length > 0) {
      console.log(
        `Encontrados ${trialStudentsWithoutGrid.length} trial students sem gridItem (horário foi editado/deletado) - preservando para histórico`,
      );
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const futureTrials = trialStudentsWithGrid.filter((t) => t.date >= today);

    const nearestDate = futureTrials.length ? futureTrials[0].date : null;

    if (!nearestDate) {
      return {
        nearestTrialClasses: null,
        list: [
          // Trial students com gridItem
          ...trialStudentsWithGrid.map((item) => ({
            ...item,
            ...item.lead,
            ...item.gridItem,
            teacherName: item?.gridItem?.class!.teacher!.firstName || '',
            id: item.id,
            trialStatus: item.status as string,
          })),
          // Trial students sem gridItem (histórico)
          ...trialStudentsWithoutGrid.map((item) => ({
            ...item,
            ...item.lead,
            id: item.id,
            trialStatus: item.status as string,
            // Campos vazios para compatibilidade
            dayOfWeek: 'N/A',
            startTime: 'N/A',
            endTime: 'N/A',
            teacherName: 'N/A',
            gridItemDeleted: true, // Flag para indicar que o gridItem foi deletado
          })),
        ],
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
      trialStudents: typeof trialStudentsWithGrid;
    };

    const groupedByGridItem: Record<string, TrialClassGroup> = {};

    for (const trial of nearestTrialsSameDay) {
      const gridItemId = trial?.gridItem?.id || '';

      if (!groupedByGridItem[gridItemId]) {
        groupedByGridItem[gridItemId] = {
          modality: trial?.gridItem?.class!.modality.name || '',
          classLevel: trial?.gridItem?.class!.classLevel?.name || '',
          startTime: trial?.gridItem?.startTime || '',
          endTime: trial?.gridItem?.endTime || '',
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

      // Filtra as aulas para cada dia da semana (apenas com gridItem)
      trialStudentsWithGrid.forEach((trial) => {
        const trialDay = trial?.gridItem?.dayOfWeek || '';
        const gridItemLabel = `${trial?.gridItem?.class!.modality.name}@${trial?.gridItem?.class!.classLevel?.name || ''} ${trial?.gridItem?.class!.description || ''} | ${trial?.gridItem?.startTime || ''} - ${trial?.gridItem?.endTime || ''}`;

        if (trialDay === day) {
          if (!weekResume[day][gridItemLabel]) {
            weekResume[day][gridItemLabel] = [];
          }

          weekResume[day][gridItemLabel].push({
            trial,
            ...trial.lead,
            teacherName: trial?.gridItem?.class!.teacher!.firstName || '',
            trialStatus: trial.status as string,
          });
        }
      });
    });

    return {
      nearestTrialClasses: {
        date: formattedDate.charAt(0).toUpperCase() + formattedDate.slice(1),
        totalTrialStudents: nearestTrialsSameDay.length,
        trialClasses,
      },
      list: [
        // Trial students com gridItem
        ...trialStudentsWithGrid.map((item) => ({
          ...item,
          ...item.lead,
          ...item.gridItem,
          teacherName: item?.gridItem?.class!.teacher!.firstName || '',
          id: item.id,
          trialStatus: item.status as string,
        })),
        // Trial students sem gridItem (histórico)
        ...trialStudentsWithoutGrid.map((item) => ({
          ...item,
          ...item.lead,
          id: item.id,
          trialStatus: item.status as string,
          // Campos vazios para compatibilidade
          dayOfWeek: 'N/A',
          startTime: 'N/A',
          endTime: 'N/A',
          teacherName: 'N/A',
          gridItemDeleted: true, // Flag para indicar que o gridItem foi deletado
        })),
      ],
      weekResume,
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

    // Verificar se a data foi alterada e se é uma data futura
    let newStatus: string | undefined = undefined;
    if (date) {
      const newDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // Se a nova data for maior que hoje, voltar status para SCHEDULED
      if (newDate > today) {
        newStatus = 'SCHEDULED';
      }
    }

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
          ...(gridItem?.id && { gridItemId: gridItem.id }),
          ...(date && { date }),
          ...(newStatus && {
            status: newStatus as
              | 'SCHEDULED'
              | 'PENDING_STATUS'
              | 'CONVERTED'
              | 'NOT_CONVERTED'
              | 'CANCELLED',
          }),
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

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, {
    timeZone: 'America/Sao_Paulo',
  })
  async updatePastTrialStudentsStatus() {
    const dateAmericaSP = new Date(
      new Date().toLocaleString('en-US', {
        timeZone: 'America/Sao_Paulo',
      }),
    );

    // Busca todas as aulas experimentais que já passaram da data e ainda estão com status SCHEDULED
    const pastTrialStudents = await this.prisma.trialStudent.findMany({
      where: {
        date: {
          lt: dateAmericaSP, // Menor que a data atual (já passou)
        },
        status: 'SCHEDULED', // Apenas as que ainda estão agendadas
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

    if (pastTrialStudents.length === 0) {
      console.log(
        'Nenhuma aula experimental passada encontrada para atualizar status',
      );
      return;
    }

    // Atualiza o status de todas as aulas passadas para PENDING_STATUS
    const updateResult = await this.prisma.trialStudent.updateMany({
      where: {
        id: {
          in: pastTrialStudents.map((ts) => ts.id),
        },
      },
      data: {
        status: 'PENDING_STATUS',
        updatedAt: new Date(),
      },
    });

    console.log(
      `Atualizadas ${updateResult.count} aulas experimentais para status PENDING_STATUS`,
      pastTrialStudents.map((ts) => ts),
    );

    return updateResult;
  }

  // ============ V2 METHODS ============

  async findPendingStatus() {
    const pendingTrialStudents = await this.prisma.trialStudent.findMany({
      where: {
        status: 'PENDING_STATUS',
      },
      include: {
        lead: true,
        gridItem: {
          include: {
            class: {
              include: {
                modality: true,
                classLevel: true,
                teacher: true,
              },
            },
          },
        },
      },
      orderBy: {
        date: 'asc',
      },
    });

    return {
      count: pendingTrialStudents.length,
      data: pendingTrialStudents,
    };
  }

  async updateStatus(id: string, status: string) {
    // Validar se o status é válido
    const validStatuses = ['CONVERTED', 'NOT_CONVERTED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      throw new Error('Status inválido');
    }

    return await this.prisma.$transaction(async (prisma) => {
      const updatedTrialStudent = await prisma.trialStudent.update({
        where: { id },
        data: {
          status: status as 'CONVERTED' | 'NOT_CONVERTED' | 'CANCELLED',
          updatedAt: new Date(),
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

      return updatedTrialStudent;
    });
  }

  // ============ TEST METHODS ============

  async testUpdatePastTrialStudentsStatus() {
    return await this.updatePastTrialStudentsStatus();
  }
}
