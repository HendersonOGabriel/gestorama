
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
  date: string; // YYYY-MM-DD
  installments: number;
  type: 'cash' | 'card' | 'prazo';
  isIncome: boolean;
  person: string | null;
  account: string; // accountId
  card: string | null; // cardId
  categoryId: string | null;
  installmentsSchedule: Installment[];
  paid: boolean;
  recurringSourceId?: string;
  reminderDaysBefore?: number | null;
  userId?: string;
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
  date: string; // YYYY-MM-DD
}

export interface RecurringItem {
  id: string;
  desc: string;
  amount: number;
  day: number; // Day of the month
  type: 'cash' | 'card';
  isIncome: boolean;
  account: string; // accountId
  card: string | null; // cardId
  categoryId: string | null;
  enabled: boolean;
  lastRun: string | null; // YYYY-MM-DD
  nextRun: string; // YYYY-MM-DD
}

export interface Category {
  id: string;
  name: string;
  group: string | null;
}

export interface Goal {
  id: string;
  name: string;
  targetAmount: number;
  currentAmount: number;
}

export interface Reminder {
  id: string;
  date: string; // YYYY-MM-DD
  desc: string;
  time: string | null; // HH:MM
}

export interface User {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  role: 'owner' | 'member';
}

export type SubscriptionPlan = 'free' | 'premium' | 'family';

export interface Subscription {
  plan: SubscriptionPlan;
  memberSlots: number;
  expires: string | null; // YYYY-MM-DD
}

export interface GamificationState {
  level: number;
  xp: number;
  xpToNextLevel: number;
}

export interface YaraUsage {
  count: number;
  lastReset: string; // YYYY-MM-DD
}

export interface PayingInstallment {
  tx: Transaction;
  inst: Installment;
}

export interface UnpayInvoiceDetails {
  cardId: string;
  month: string;
  accountId: string;
  total: number;
}

export interface AppState {
  accounts: Account[];
  cards: Card[];
  transactions: Transaction[];
  transfers: Transfer[];
  recurring: RecurringItem[];
  categories: Category[];
  budgets: Record<string, number>;
  goals: Goal[];
  reminders: Reminder[];
  users: User[];
  subscription: Subscription;
  gamification: GamificationState;
  yaraUsage: YaraUsage;
  themePreference: 'light' | 'dark' | 'system';
  notifiedGoalIds: string[];
  notifiedBudgetKeys: string[];
  notifiedInvoiceKeys: string[];
  notifiedReminderIds: string[];
  notifiedTxReminderKeys: string[];
  notifiedAnomalyKeys: string[];
}