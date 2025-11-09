import { Account, Card, Transaction, RecurringItem, Goal } from '../types';
import { buildInstallments, getDateRel } from '../utils/helpers';

export const MOCK_ACCOUNTS: Account[] = [
  { id: 'acc1', name: 'Conta Principal (Bradesco)', balance: 1250.75, isDefault: true },
  { id: 'acc2', name: 'Poupança (NuBank)', balance: 5800.00, isDefault: false },
];

export const MOCK_CARDS: Card[] = [
  { id: 'card1', name: 'Cartão Principal (Visa)', closingDay: 20, dueDay: 28, isDefault: true, limit: 2000, accountId: 'acc1' },
  { id: 'card2', name: 'Cartão Secundário (Master)', closingDay: 10, dueDay: 19, isDefault: false, limit: 3500, accountId: 'acc1' },
];

const sched_income = buildInstallments(getDateRel(-5), 5000, 1);
sched_income[0].paid = true;
sched_income[0].paymentDate = getDateRel(-5);
sched_income[0].paidAmount = 5000;

const sched_paid_cash = buildInstallments(getDateRel(-10), 150, 1);
sched_paid_cash[0].paid = true;
sched_paid_cash[0].paymentDate = getDateRel(-10);
sched_paid_cash[0].paidAmount = 150;

const sched_parc_card = buildInstallments(getDateRel(-40), 900, 3);
sched_parc_card[0].paid = true; 
sched_parc_card[0].paymentDate = getDateRel(-15);
sched_parc_card[0].paidAmount = 300;

const sched_budget_test = buildInstallments(getDateRel(0), 600, 1);
sched_budget_test[0].paid = true;
sched_budget_test[0].paymentDate = getDateRel(0);
sched_budget_test[0].paidAmount = 600;

export const MOCK_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx1', desc: 'Salário Empresa', amount: 5000, date: getDateRel(-5),
    installments: 1, type: 'cash', isIncome: true, person: null,
    account: 'acc1', card: null, categoryId: null,
    installmentsSchedule: sched_income, paid: true, reminderDaysBefore: null,
    userId: 'user1',
  },
  {
    id: 'tx2', desc: 'Supermercado (Semanal)', amount: 150, date: getDateRel(-10),
    installments: 1, type: 'cash', isIncome: false, person: null,
    account: 'acc1', card: null, categoryId: 'cat2',
    installmentsSchedule: sched_paid_cash, paid: true, reminderDaysBefore: null,
    userId: 'user1',
  },
   {
    id: 'tx5', desc: 'Supermercado (Mensal)', amount: 600, date: getDateRel(0),
    installments: 1, type: 'cash', isIncome: false, person: null,
    account: 'acc1', card: null, categoryId: 'cat2',
    installmentsSchedule: sched_budget_test, paid: true, reminderDaysBefore: null,
    userId: 'user2',
  },
  {
    id: 'tx3', desc: 'Compra Amazon (Notebook)', amount: 900, date: getDateRel(-40),
    installments: 3, type: 'card', isIncome: false, person: null,
    account: 'acc1', card: 'card1', categoryId: 'cat10',
    installmentsSchedule: sched_parc_card, paid: false, reminderDaysBefore: null,
    userId: 'user2',
  },
  {
    id: 'tx4', desc: 'iFood', amount: 85.50, date: getDateRel(-2),
    installments: 1, type: 'card', isIncome: false, person: null,
    account: 'acc1', card: 'card2', categoryId: 'cat8',
    installmentsSchedule: buildInstallments(getDateRel(-2), 85.50, 1), paid: false, reminderDaysBefore: null,
    userId: 'user2',
  },
];

export const MOCK_RECURRING: RecurringItem[] = [
  {
    id: 'rec1', desc: 'Netflix', amount: 39.90, day: 10, type: 'card',
    isIncome: false, account: 'acc1', card: 'card2', categoryId: 'cat8',
    enabled: true, lastRun: null, nextRun: getDateRel(7)
  },
  {
    id: 'rec2', desc: 'Aluguel', amount: 1800, day: 5, type: 'cash',
    isIncome: false, account: 'acc1', card: null, categoryId: 'cat1',
    enabled: true, lastRun: null, nextRun: getDateRel(2)
  }
];

export const MOCK_BUDGETS: Record<string, number> = {
  'cat1': 1800,
  'cat2': 800,
  'cat8': 250,
  'cat10': 300,
};

export const MOCK_GOALS: Goal[] = [
  { id: 'goal1', name: 'Viagem Japão', targetAmount: 15000, currentAmount: 15000 },
  { id: 'goal2', name: 'Fundo de Emergência', targetAmount: 10000, currentAmount: 5800 },
  { id: 'goal3', name: 'Reforma da Casa (Família)', targetAmount: 25000, currentAmount: 7500 },
];