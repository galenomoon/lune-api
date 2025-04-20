import { Body, Controller, Delete, Get, HttpCode, Param, Patch, Post, Query } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

  @Get()
  async findAll() {
    return await this.paymentService.findAll();
  }

  @Get('dashboard')
  async getDashboard(
    @Query('month') month?: string,
    @Query('year') year?: string
  ) {
    return await this.paymentService.getFinancialDashboard({
      month: month ? Number(month) : undefined,
      year: year ? Number(year) : undefined,
    });
  }

  @Post('toggle/:id')
  @HttpCode(200)
  async markPaymentAsPaid(@Param('id') id: string) {
    return await this.paymentService.markPaymentAsPaid(id);
  }

  @Patch(':id')
  @HttpCode(200)
  async update(@Param('id') id: string, @Body() updatePaymentDto: CreatePaymentDto) {
    return await this.paymentService.update(id, updatePaymentDto);
  }

  @Delete(':id')
  @HttpCode(201)
  async remove(@Param('id') id: string) {
    return await this.paymentService.delete(id);
  }
}
