import { Controller, Delete, Get, HttpCode, Param, Post } from '@nestjs/common';
import { PaymentService } from './payment.service';

@Controller('payments')
export class PaymentController {
  constructor(private readonly paymentService: PaymentService) {}

    @Get()
    async findAll(){
      return await this.paymentService.findAll()
    }

    @Post('toggle/:id')
    @HttpCode(200)
    async markPaymentAsPaid(@Param('id') id: string) {
      return await this.paymentService.markPaymentAsPaid(id);
    }

    @Delete(':id')
    @HttpCode(201)
    async remove(@Param('id') id: string) {
      return await this.paymentService.delete(id);
    }
}
