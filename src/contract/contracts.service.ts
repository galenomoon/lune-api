import { PrismaService } from './../config/prisma.service';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import { formatDate } from 'src/utils/formatDate';
const ImageModule = require('docxtemplater-image-module-free');
import * as crypto from 'crypto';
import * as dayjs from 'dayjs';
import { MailService } from 'src/mail/mail.service';

@Injectable()
export class ContractsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly mail: MailService,
  ) {}

  async generateContract(enrollmentId: string) {
    const modalities = await this.prisma.modality.findMany();
    const enrollmentData = await this.prisma.enrollment.findFirst({
      where: { id: enrollmentId },
      include: {
        student: {
          include: {
            emergencyContacts: true,
            addresses: true,
          },
        },
        plan: true,
        class: {
          include: {
            modality: true,
          },
        },
      },
    });

    if (!enrollmentData?.signature) {
      throw new NotFoundException('Assinatura não encontrada');
    }

    const plan = enrollmentData?.plan;
    const student = enrollmentData.student;
    const address = student?.addresses?.[0];
    const emergencyContact = student?.emergencyContacts?.[0];

    const templatePath = path.join(
      __dirname,
      '..',
      'templates',
      'contract_template.docx',
    );

    if (!fs.existsSync(templatePath)) {
      throw new NotFoundException('Template de contrato não encontrado');
    }

    const today = enrollmentData.createdAt;
    const todayDay = today.getDate().toString();
    const todayMonth = (today.getMonth() + 1).toString();

    const months = {
      1: 'Janeiro',
      2: 'Fevereiro',
      3: 'Março',
      4: 'Abril',
      5: 'Maio',
      6: 'Junho',
      7: 'Julho',
      8: 'Agosto',
      9: 'Setembro',
      10: 'Outubro',
      11: 'Novembro',
      12: 'Janeiro',
    };

    const modalitiesOptions = modalities.reduce((acc, modality) => {
      acc[modality.name.toLowerCase().replaceAll(' ', '').replace(/-/g, '')] =
        ' ';
      return acc;
    }, {});

    const daysOptions = [5, 10, 15].reduce((acc, paymentDay) => {
      acc[paymentDay] = '  ';
      return acc;
    }, {});

    const planPeriod = [30, 90, 180].reduce((acc, durationInDay) => {
      acc[durationInDay] = '  ';
      return acc;
    }, {});

    const weeklyClasses = [1, 2].reduce((acc, curr) => {
      acc[curr] = '  ';
      return acc;
    }, {});

    const content = fs.readFileSync(templatePath, 'binary');
    const zip = new PizZip(content);

    const imageOptions = {
      getImage: (tagValue) => {
        if (tagValue.startsWith('data:image')) {
          const base64Data = tagValue.split(',')[1]; // Remove o prefixo 'data:image/png;base64,'
          return Buffer.from(base64Data, 'base64');
        }
        throw new Error('Formato de imagem inválido.');
      },
      getSize: () => [350, 350 / 2],
      fileType: 'docx',
      centered: true,
    };

    const doc = new Docxtemplater(zip, {
      modules: [new ImageModule(imageOptions)],
    });

    await doc.renderAsync({
      nomeDoAluno: [student.firstName, student.lastName]
        .filter(Boolean)
        .join(' '),
      dataDeNascimento: formatDate(student.birthDate),
      rg: student.rg,
      cpf: student.cpf,
      emergencyContactName: emergencyContact?.name || '',
      emergencyContactNumber: emergencyContact?.phone || '',
      obs: student.obs,
      cep: address?.cep || '',
      state: address?.state || '',
      city: address?.city || '',
      neighborhood: address?.neighborhood || '',
      street: address?.street || '',
      addressNumber: address?.number || '',
      complement: address?.complement || '',
      phone: student.phone,
      instagram: student.instagram,
      email: student.email,
      ...daysOptions,
      [enrollmentData.paymentDay]: 'X',
      ...modalitiesOptions,
      [enrollmentData?.class?.modality?.name
        .toLowerCase()
        .replaceAll(/-/g, '')
        .replaceAll(' ', '') || 'none']: 'X',
      ...planPeriod,
      [plan?.durationInDays]: 'X',
      ...weeklyClasses,
      [enrollmentData.plan.weeklyClasses]: 'X',
      startDate: formatDate(enrollmentData.startDate),
      endDate: formatDate(enrollmentData.endDate),
      todayDay,
      todayMonth: months[todayMonth],
      image: enrollmentData.signature,
    });

    let docxBuffer = doc
      .getZip()
      .generate({ type: 'nodebuffer', compression: 'DEFLATE' });

    return {
      file: docxBuffer,
      filename: `${student.firstName}_${student.lastName}`,
    };
  }

  async generateSignatureLink(enrollmentId: string) {
    const enrollment = await this.prisma.enrollment.findUnique({
      where: { id: enrollmentId },
    });

    if (!enrollment) {
      throw new NotFoundException('Matrícula não encontrada');
    }

    const token = crypto.randomBytes(32).toString('hex');
    const validUntil = dayjs().add(1, 'day').toDate();

    await this.prisma.contractSignToken.upsert({
      where: { enrollmentId },
      update: { token, validUntil, usedAt: null },
      create: { enrollmentId, token, validUntil },
    });

    return { link: `${process.env.FRONTEND_URL}/assinar-matricula/${token}` };
  }

  async getContractByToken(token: string) {
    const contractToken = await this.prisma.contractSignToken.findUnique({
      where: { token },
      include: { enrollment: { include: { student: true } } },
    });

    if (
      !contractToken ||
      contractToken.usedAt ||
      new Date() > contractToken.validUntil
    ) {
      throw new NotFoundException('Token inválido ou expirado');
    }

    return contractToken.enrollment;
  }

  async signContract(token: string, signature: string) {
    const contractToken = await this.prisma.contractSignToken.findUnique({
      where: { token },
    });

    if (
      !contractToken ||
      contractToken.usedAt ||
      new Date() > contractToken.validUntil
    ) {
      throw new BadRequestException('Token inválido ou expirado');
    }

    const signedEnrollment = await this.prisma.enrollment.update({
      where: { id: contractToken.enrollmentId },
      data: { signature },
      include: { student: true },
    });

    if (signedEnrollment?.student?.email) {
      this.mail.sendContract({
        email: signedEnrollment?.student?.email,
        context: {
          contract_link: `${process.env.API_URL}/contracts/${signedEnrollment?.id}/download`,
          name: signedEnrollment.student?.firstName,
        },
      });
    }

    await this.prisma.contractSignToken.delete({
      where: { token },
    });

    return { message: 'Contrato assinado com sucesso!' };
  }
}
