export interface Installment {
  id: number;
  amount: number;
  postingDate: string;
  paid: boolean;
  paymentDate: string | null;
  paidAmount: number | null;
}

export interface Transaction {
  id: string;
  desc: string;
  amount: number;
  date: string;
  installments: number;
  type: 'cash' | 'card' | 'prazo';
  isIncome: boolean;
  person: string | null;
  account: string;
  card: string | null;
  categoryId: string | null;
  installmentsSchedule: Installment[];
  paid: boolean;
  recurringSourceId?: string;
  reminderDaysBefore?: number | null;
}

export interface Account {
  id: string;
  name: string;
  balance: number;
  isDefault: boolean;
}

export interface Card {
  id: string;
  name: string;
  closingDay: number;
  dueDay: number;
  isDefault: boolean;
  limit: number;
  accountId: string;
  deleted?: boolean;
}

export interface Transfer {
  id: string;
  fromAccount: string;
  toAccount: string;
  amount: number;
  date: string;
}

export interface Category {
  id: string;
  name: string;
  group: string | null;
  icon?: string;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
}
