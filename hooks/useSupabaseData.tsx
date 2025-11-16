import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
import { 
  Transaction, Account, Card, Transfer, RecurringItem, Category, 
  Goal, Reminder, Subscription, GamificationState, YaraUsage 
} from '../types';
import { DEFAULT_CATEGORIES } from '../data/initialData';

interface SupabaseDataState {
  transactions: Transaction[];
  accounts: Account[];
  cards: Card[];
  categories: Category[];
  recurring: RecurringItem[];
  budgets: Record<string, number>;
  goals: Goal[];
  reminders: Reminder[];
  transfers: Transfer[];
  subscription: Subscription;
  gamification: GamificationState;
  yaraUsage: YaraUsage;
  loading: boolean;
  error: string | null;
}

export const useSupabaseData = (userId: string | null) => {
  const [state, setState] = useState<SupabaseDataState>({
    transactions: [],
    accounts: [],
    cards: [],
    categories: [],
    recurring: [],
    budgets: {},
    goals: [],
    reminders: [],
    transfers: [],
    subscription: { plan: 'free', memberSlots: 0, expires: null },
    gamification: { level: 1, xp: 0, xpToNextLevel: 100 },
    yaraUsage: { count: 0, lastReset: new Date().toISOString().slice(0, 10) },
    loading: true,
    error: null
  });

  const fetchAccounts = useCallback(async () => {
    if (!userId) return [];
    const { data, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return (data || []).map(acc => ({
      id: acc.id,
      name: acc.name,
      balance: Number(acc.balance),
      isDefault: acc.is_default
    }));
  }, [userId]);

  const fetchCards = useCallback(async () => {
    if (!userId) return [];
    const { data, error } = await supabase
      .from('cards')
      .select('*')
      .eq('user_id', userId)
      .eq('deleted', false)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return (data || []).map(card => ({
      id: card.id,
      name: card.name,
      closingDay: card.closing_day,
      dueDay: card.due_day,
      isDefault: card.is_default,
      limit: Number(card.limit_amount),
      accountId: card.account_id,
      deleted: card.deleted
    }));
  }, [userId]);

  const fetchTransactions = useCallback(async () => {
    if (!userId) return [];
    const { data, error } = await supabase
      .from('transactions')
      .select('*, installments(*)')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(tx => ({
      id: tx.id,
      desc: tx.description,
      amount: Number(tx.amount),
      date: tx.date,
      isIncome: tx.is_income,
      type: tx.type as 'card' | 'cash' | 'prazo',
      installments: tx.installments,
      account: tx.account_id,
      card: tx.card_id,
      categoryId: tx.category_id,
      paid: tx.paid,
      person: tx.person,
      reminderDaysBefore: tx.reminder_days_before,
      recurringSourceId: tx.recurring_source_id,
      userId: tx.user_id,
      installmentsSchedule: tx.installments ? tx.installments.map((inst: any) => ({
        id: inst.id,
        amount: Number(inst.amount),
        paid: inst.paid,
        postingDate: inst.posting_date,
        paymentDate: inst.payment_date,
        paidAmount: inst.paid_amount ? Number(inst.paid_amount) : null,
      })).sort((a: any, b: any) => a.id - b.id) : []
    }));
  }, [userId]);

  const fetchCategories = useCallback(async () => {
    if (!userId) return [];
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('user_id', userId)
      .order('name', { ascending: true });
    
    if (error) throw error;
    return (data || []).map(cat => ({
      id: cat.id,
      name: cat.name,
      group: cat.group_name
    }));
  }, [userId]);

  const fetchRecurring = useCallback(async () => {
    if (!userId) return [];
    const { data, error } = await supabase
      .from('recurring_items')
      .select('*')
      .eq('user_id', userId)
      .order('day', { ascending: true });
    
    if (error) throw error;
    return (data || []).map(rec => ({
      id: rec.id,
      desc: rec.description,
      amount: Number(rec.amount),
      day: rec.day,
      type: rec.type as 'cash' | 'card',
      isIncome: rec.is_income,
      account: rec.account_id,
      card: rec.card_id,
      categoryId: rec.category_id,
      enabled: rec.enabled,
      lastRun: rec.last_run,
      nextRun: rec.next_run
    }));
  }, [userId]);

  const fetchBudgets = useCallback(async () => {
    if (!userId) return {};
    const { data, error } = await supabase
      .from('budgets')
      .select('*')
      .eq('user_id', userId);
    
    if (error) throw error;
    const budgets: Record<string, number> = {};
    (data || []).forEach(budget => {
      const key = `${budget.category_id}_${budget.month}`;
      budgets[key] = Number(budget.amount);
    });
    return budgets;
  }, [userId]);

  const fetchGoals = useCallback(async () => {
    if (!userId) return [];
    const { data, error } = await supabase
      .from('goals')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true });
    
    if (error) throw error;
    return (data || []).map(goal => ({
      id: goal.id,
      name: goal.name,
      targetAmount: Number(goal.target_amount),
      currentAmount: Number(goal.current_amount)
    }));
  }, [userId]);

  const fetchReminders = useCallback(async () => {
    if (!userId) return [];
    const { data, error } = await supabase
      .from('reminders')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: true });
    
    if (error) throw error;
    return (data || []).map(rem => ({
      id: rem.id,
      date: rem.date,
      desc: rem.description,
      time: rem.time
    }));
  }, [userId]);

  const fetchTransfers = useCallback(async () => {
    if (!userId) return [];
    const { data, error } = await supabase
      .from('transfers')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    if (error) throw error;
    return (data || []).map(transfer => ({
      id: transfer.id,
      fromAccount: transfer.from_account,
      toAccount: transfer.to_account,
      amount: Number(transfer.amount),
      date: transfer.date
    }));
  }, [userId]);

  const fetchSubscription = useCallback(async () => {
    if (!userId) return { plan: 'free' as const, memberSlots: 0, expires: null };
    const { data, error } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) throw error;
    if (!data) return { plan: 'free' as const, memberSlots: 0, expires: null };
    
    return {
      plan: data.plan as 'free' | 'premium' | 'family',
      memberSlots: data.member_slots,
      expires: data.expires
    };
  }, [userId]);

  const fetchGamification = useCallback(async () => {
    if (!userId) return { level: 1, xp: 0, xpToNextLevel: 100 };
    const { data, error } = await supabase
      .from('gamification')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) throw error;
    if (!data) return { level: 1, xp: 0, xpToNextLevel: 100 };
    
    return {
      level: data.level,
      xp: data.xp,
      xpToNextLevel: data.xp_to_next_level
    };
  }, [userId]);

  const fetchYaraUsage = useCallback(async () => {
    if (!userId) return { count: 0, lastReset: new Date().toISOString().slice(0, 10) };
    const { data, error } = await supabase
      .from('yara_usage')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    
    if (error) throw error;
    if (!data) return { count: 0, lastReset: new Date().toISOString().slice(0, 10) };
    
    return {
      count: data.count,
      lastReset: data.last_reset
    };
  }, [userId]);

  const loadAllData = useCallback(async () => {
    if (!userId) {
      setState(prev => ({ ...prev, loading: false }));
      return;
    }

    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      const [
        accounts,
        cards,
        transactions,
        categories,
        recurring,
        budgets,
        goals,
        reminders,
        transfers,
        subscription,
        gamification,
        yaraUsage
      ] = await Promise.all([
        fetchAccounts(),
        fetchCards(),
        fetchTransactions(),
        fetchCategories(),
        fetchRecurring(),
        fetchBudgets(),
        fetchGoals(),
        fetchReminders(),
        fetchTransfers(),
        fetchSubscription(),
        fetchGamification(),
        fetchYaraUsage()
      ]);

      let finalCategories = categories;
      if (categories.length === 0 && userId) {
        const categoriesToInsert = DEFAULT_CATEGORIES.map(cat => ({
            name: cat.name,
            group_name: cat.group,
            user_id: userId
        }));

        const { data: newCategoriesData, error: insertError } = await supabase
            .from('categories')
            .insert(categoriesToInsert)
            .select();

        if (insertError) {
            console.error('Error inserting default categories:', insertError);
        } else if (newCategoriesData) {
            finalCategories = newCategoriesData.map(cat => ({
                id: cat.id,
                name: cat.name,
                group: cat.group_name
            }));
        }
      }

      setState({
        accounts,
        cards,
        transactions,
        categories: finalCategories,
        recurring,
        budgets,
        goals,
        reminders,
        transfers,
        subscription,
        gamification,
        yaraUsage,
        loading: false,
        error: null
      });
    } catch (error) {
      console.error('Error loading data from Supabase:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Failed to load data'
      }));
    }
  }, [userId, fetchAccounts, fetchCards, fetchTransactions, fetchCategories, 
      fetchRecurring, fetchBudgets, fetchGoals, fetchReminders, fetchTransfers,
      fetchSubscription, fetchGamification, fetchYaraUsage]);

  // Load data on mount and when userId changes
  useEffect(() => {
    loadAllData();
  }, [loadAllData]);

  // Set up realtime subscriptions
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
        () => fetchTransactions().then(data => setState(prev => ({ ...prev, transactions: data })))
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'installments' },
        () => fetchTransactions().then(data => setState(prev => ({ ...prev, transactions: data })))
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'accounts', filter: `user_id=eq.${userId}` },
        () => fetchAccounts().then(data => setState(prev => ({ ...prev, accounts: data })))
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cards', filter: `user_id=eq.${userId}` },
        () => fetchCards().then(data => setState(prev => ({ ...prev, cards: data })))
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'goals', filter: `user_id=eq.${userId}` },
        () => fetchGoals().then(data => setState(prev => ({ ...prev, goals: data })))
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reminders', filter: `user_id=eq.${userId}` },
        () => fetchReminders().then(data => setState(prev => ({ ...prev, reminders: data })))
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, fetchTransactions, fetchAccounts, fetchCards, fetchGoals, fetchReminders]);

  return {
    ...state,
    refetch: loadAllData,
    refetchTransactions: fetchTransactions
  };
};
