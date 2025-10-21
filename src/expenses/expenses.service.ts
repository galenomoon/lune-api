/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { Injectable } from '@nestjs/common';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { PrismaService } from 'src/config/prisma.service';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(createExpenseDto: CreateExpenseDto) {
    return await this.prisma.expense.create({
      data: createExpenseDto,
    });
  }

  async findAll() {
    return await this.prisma.expense.findMany({
      orderBy: {
        dueDay: 'asc',
      },
    });
  }

  async getPendingCount() {
    const count = await this.prisma.expense.count({
      where: {
        OR: [{ status: 'PENDING' }, { status: 'OVERDUE' }],
      },
    });

    return { count };
  }

  async findOne(id: string) {
    return await this.prisma.expense.findUnique({ where: { id } });
  }

  async update(id: string, updateExpenseDto: UpdateExpenseDto) {
    return await this.prisma.expense.update({
      where: { id },
      data: updateExpenseDto,
    });
  }

  async pay(id: string) {
    return await this.prisma.expense.update({
      where: { id },
      data: { status: 'PAID' },
    });
  }

  async unpay(id: string) {
    return await this.prisma.expense.update({
      where: { id },
      data: { status: 'PENDING' },
    });
  }

  async remove(id: string) {
    return await this.prisma.expense.delete({ where: { id } });
  }

  // Cron: Atualiza status de PENDING para OVERDUE quando passa do dia
  async updateStatus() {
    const today = new Date();
    const currentDay = today.getDate();

    // Busca todas as despesas pendentes
    const expenses = await this.prisma.expense.findMany({
      where: {
        status: 'PENDING',
      },
    });

    // Atualiza para OVERDUE se o dia já passou
    const updates = expenses
      .filter((expense) => currentDay > expense.dueDay)
      .map((expense) =>
        this.prisma.expense.update({
          where: { id: expense.id },
          data: { status: 'OVERDUE' },
        }),
      );

    await Promise.all(updates);

    return {
      message: 'Status das despesas atualizado',
      updated: updates.length,
    };
  }

  // Cron: Reseta despesas PAID para PENDING no início do mês
  async resetMonthly() {
    const today = new Date();
    const currentDay = today.getDate();

    // Só executa no primeiro dia do mês
    if (currentDay !== 1) {
      return {
        message: 'Reset mensal só executa no dia 1',
        updated: 0,
      };
    }

    const result = await this.prisma.expense.updateMany({
      where: {
        status: 'PAID',
      },
      data: {
        status: 'PENDING',
      },
    });

    return {
      message: 'Despesas resetadas para o novo mês',
      updated: result.count,
    };
  }
}
