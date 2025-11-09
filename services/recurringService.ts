import { RecurringItem, Transaction } from '../types';
import { buildInstallments } from '../utils/helpers';

export const runRecurringItem = (item: RecurringItem, todayKey: string): { item: RecurringItem; newTx: Transaction | null } => {
  if (!item || !item.enabled || !item.nextRun || item.nextRun > todayKey) {
    return { item, newTx: null };
  }
  
  const { id, desc, amount, type, isIncome, account, card, categoryId } = item;
  
  // Use the scheduled run date for the transaction
  const dateStr = item.nextRun;
  
  const schedule = buildInstallments(dateStr, amount, 1);
  
  // A recurring transaction is only considered 'paid' automatically if it's an income.
  // All expenses (cash, card, etc.) will be created as pending,
  // requiring user action (paying the bill or the card invoice).
  const isPaid = isIncome;
  
  if (isPaid) {
    schedule[0].paid = true;
    schedule[0].paymentDate = dateStr;
    schedule[0].paidAmount = amount;
  }
  
  const newTx: Transaction = {
    id: `rec_${id}_${Date.now()}`,
    desc: `${desc} (Rec.)`,
    amount,
    date: dateStr,
    installments: 1,
    type,
    isIncome,
    person: null,
    account,
    // Only associate a card with the transaction if it's a card-based *expense*.
    // Card-based incomes (like refunds) are treated as cash incomes.
    card: type === 'card' && !isIncome ? card : null,
    categoryId,
    installmentsSchedule: schedule,
    paid: isPaid,
    recurringSourceId: id,
    reminderDaysBefore: null,
  };

  // Correctly calculate the next run date using UTC to avoid timezone issues.
  const currentRunDate = new Date(item.nextRun + 'T12:00:00Z'); // Treat the date string as UTC noon
  const originalMonth = currentRunDate.getUTCMonth();
  
  // Create a new date object for modification
  const nextRunDate = new Date(currentRunDate.getTime());
  
  // Move to the next month
  nextRunDate.setUTCMonth(originalMonth + 1);

  // Handle cases where the month rolls over (e.g., from Jan 31st to Mar 3rd).
  // If the new month is not the expected next month, it means we need to set the date
  // to the last day of the correct month.
  if (nextRunDate.getUTCMonth() !== (originalMonth + 1) % 12) {
    // Setting day to 0 goes to the last day of the previous month.
    nextRunDate.setUTCDate(0);
  }
  
  const updatedItem: RecurringItem = {
    ...item,
    lastRun: todayKey,
    nextRun: nextRunDate.toISOString().slice(0, 10)
  };

  return { item: updatedItem, newTx };
};