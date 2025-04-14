import { Controller, Get, NotFoundException, Param, Post, UseGuards } from '@nestjs/common';
import { AuthGuard } from 'src/auth/auth.guard';
import { MailerService } from '@nestjs-modules/mailer';
import { PrismaService } from 'src/config/prisma.service';

@UseGuards(AuthGuard)
@Controller('mail')
export class MailerController {
  constructor(
    private readonly mailerService: MailerService,
    private readonly prismaService: PrismaService,
  ) {}

  @Post('contract/:studentId/:enrollmentId')
  async sendContract(@Param('studentId') studentId: string, @Param('enrollmentId') enrollmentId: string) {

    const student = await this.prismaService.student.findFirst({
      where: { id: studentId },
    });

    if (!student?.email) {
      throw new NotFoundException(`Email do aluno não foi encontrado: ${JSON.stringify(student)}`)
    }

    return await this.mailerService.sendMail({
      to: student?.email,
      subject: 'Aqui está o seu contrato com a Lune Escola de Dança! 💜✨',
      template: 'contract_to_read',
      context: {
        contract_link: `${process.env.API_URL}/contracts/${enrollmentId}/download`,
        name: student.firstName,
      },
    });
  }
}
