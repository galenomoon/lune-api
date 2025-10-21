import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
} from '@nestjs/common';
import { ExpensesService } from './expenses.service';
import { CreateExpenseDto } from './dto/create-expense.dto';
import { UpdateExpenseDto } from './dto/update-expense.dto';
import { AuthGuard } from 'src/auth/auth.guard';

@UseGuards(AuthGuard)
@Controller('expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  async create(@Body() createExpenseDto: CreateExpenseDto) {
    return await this.expensesService.create(createExpenseDto);
  }

  @Get()
  async findAll() {
    return await this.expensesService.findAll();
  }

  @Get('pending/count')
  async getPendingCount() {
    return await this.expensesService.getPendingCount();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return await this.expensesService.findOne(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() updateExpenseDto: UpdateExpenseDto,
  ) {
    return await this.expensesService.update(id, updateExpenseDto);
  }

  @Patch(':id/pay')
  async pay(@Param('id') id: string) {
    return await this.expensesService.pay(id);
  }

  @Patch(':id/unpay')
  async unpay(@Param('id') id: string) {
    return await this.expensesService.unpay(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return await this.expensesService.remove(id);
  }

  @Get('cron/update-status')
  async updateStatus() {
    return await this.expensesService.updateStatus();
  }

  @Get('cron/reset-monthly')
  async resetMonthly() {
    return await this.expensesService.resetMonthly();
  }
}
