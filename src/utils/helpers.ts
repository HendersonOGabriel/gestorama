
import { Installment } from '../types';

export const cn = (...classes: (string | boolean | undefined | null)[]) => classes.filter(Boolean).join(' ');

export const toCurrency = (value: number | string | null | undefined): string => {
  const val = Number(value) || 0;
  return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
};

export const displayDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return 'N/A';
  try {
    const date = new Date(dateStr + 'T12:00:00Z'); // Assume UTC noon to avoid timezone shifts
    return date.toLocaleDateString('pt-BR', { timeZone: 'UTC' });
  } catch (e) {
    return 'Data Inválida';
  }
};

export const displayMonthYear = (monthKeyStr: string): string => {
  if (!monthKeyStr || !monthKeyStr.includes('-')) return monthKeyStr;
  try {
    const [year, month] = monthKeyStr.split('-').map(Number);
    const date = new Date(Date.UTC(year, month - 1, 1));
    const formatted = date.toLocaleString('pt-BR', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    return formatted.charAt(0).toUpperCase() + formatted.slice(1);
  } catch (e) {
    return monthKeyStr;
  }
};

export const getDateRel = (daysDelta = 0): string => {
  const d = new Date();
  d.setDate(d.getDate() + daysDelta);
  return d.toISOString().slice(0, 10);
};

export const addMonths = (date: Date, months: number): Date => {
  const d = new Date(date);
  d.setUTCDate(1);
  d.setUTCMonth(d.getUTCMonth() + months);
  return d;
};

export const monthKey = (date: Date | string): string => {
  if (typeof date === 'string') date = new Date(date + 'T12:00:00Z');
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, '0')}`;
};

export const getInvoiceMonthKey = (postingDateStr: string, closingDay: number): string => {
  const d = new Date(postingDateStr + 'T12:00:00Z');
  const postDay = d.getUTCDate();
  return postDay > closingDay ? monthKey(addMonths(d, 1)) : monthKey(d);
};

export const getInvoiceDueDate = (postingDateStr: string, closingDay: number, dueDay: number): string => {
  try {
    const d = new Date(postingDateStr + 'T12:00:00Z');
    const postDay = d.getUTCDate();
    let invoiceDate = new Date(d);

    if (postDay > closingDay) {
      invoiceDate.setUTCMonth(invoiceDate.getUTCMonth() + 1);
    }
    
    invoiceDate.setUTCDate(dueDay);
    
    if (dueDay < closingDay) {
      invoiceDate.setUTCMonth(invoiceDate.getUTCMonth() + 1);
    }

    return invoiceDate.toISOString().slice(0, 10);
  } catch (e) {
    return postingDateStr;
  }
};

export const buildInstallments = (
  date: string,
  totalAmount: number,
  count: number,
  isCard: boolean = false,
  closingDay?: number
): Installment[] => {
  const installments: Installment[] = [];
  const monthlyAmount = Math.round((totalAmount / count) * 100) / 100;
  let remaining = totalAmount;

  const purchaseDate = new Date(date + 'T12:00:00Z');
  const purchaseDay = purchaseDate.getUTCDate();

  for (let i = 1; i <= count; i++) {
    let postingDate = new Date(purchaseDate);

    if (isCard && closingDay) {
      // If purchase is on or after closing day, first installment is next month
      if (purchaseDay > closingDay) {
        postingDate.setUTCMonth(postingDate.getUTCMonth() + i);
      } else {
        postingDate.setUTCMonth(postingDate.getUTCMonth() + i - 1);
      }
    } else {
      // Standard logic for non-card transactions
      postingDate.setUTCMonth(postingDate.getUTCMonth() + i - 1);
    }
    
    let amount = monthlyAmount;
    if (i === count) {
      amount = Math.round(remaining * 100) / 100;
    }
    remaining -= amount;
    
    installments.push({
      id: `inst_${Date.now()}_${i}`,
      installmentNumber: i,
      amount: amount,
      postingDate: postingDate.toISOString().slice(0, 10),
      paid: false,
      paymentDate: null,
      paidAmount: null,
    });
  }
  return installments;
};