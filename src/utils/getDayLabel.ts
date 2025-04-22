import { format, isSameDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function getDayLabel(date: Date) {
  return isSameDay(date, new Date()) ? 'Hoje' : format(date, 'EEEE', { locale: ptBR });
}