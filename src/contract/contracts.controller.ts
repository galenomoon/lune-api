import { Body, Controller, Get, Param, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { ContractsService } from './contracts.service';

@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get(':enrollmentId/download')
  async downloadContract(
    @Param('enrollmentId') enrollmentId: string,
    @Res() res: Response,
  ) {
    const { file, filename } =
      await this.contractsService.generateContract(enrollmentId);

    res.set({
      'Content-Type':
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': `attachment; filename=Contrato_${filename}.docx`,
    });
    res.send(file);
  }

  @Post('generate-link/:enrollmentId')
  async generateLink(@Param('enrollmentId') enrollmentId: string) {
    return this.contractsService.generateSignatureLink(enrollmentId);
  }

  @Get(':token')
  async getContract(@Param('token') token: string) {
    return this.contractsService.getContractByToken(token);
  }

  @Post('sign/:token')
  async sign(
    @Param('token') token: string,
    @Body('signature') signature: string,
  ) {
    return this.contractsService.signContract(token, signature);
  }
}
