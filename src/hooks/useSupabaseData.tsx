import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { 
  Transaction, Account, Card, Transfer, RecurringItem, Category, 
  Goal, Reminder, Subscription, GamificationState, YaraUsage 
} from '@/types';
import { DEFAULT_CATEGORIES } from '@/data/initialData';

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
  refreshing: boolean;
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
    refreshing: false,
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

    // 1. Fetch all transactions
    const { data: transactionsData, error: transactionsError } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('date', { ascending: false });
    
    if (transactionsError) throw transactionsError;
    if (!transactionsData || transactionsData.length === 0) return [];

    const transactionIds = transactionsData.map(t => t.id);

    // 2. Fetch all installments for those transactions
    const { data: installmentsData, error: installmentsError } = await supabase
      .from('installments')
      .select('*')
      .in('transaction_id', transactionIds);

    if (installmentsError) throw installmentsError;

    // 3. Group installments by transaction_id
    const installmentsByTxId = (installmentsData || []).reduce((acc, inst) => {
      if (!acc[inst.transaction_id]) {
        acc[inst.transaction_id] = [];
      }
      acc[inst.transaction_id].push(inst);
      return acc;
    }, {} as Record<string, any[]>);

    // 4. Map transactions and attach installments
    return transactionsData.map(tx => {
      const schedule = (installmentsByTxId[tx.id] || []).map((inst: any) => ({
        id: inst.id,
        installmentNumber: inst.installment_number,
        amount: Number(inst.amount),
        paid: inst.paid,
        postingDate: inst.posting_date,
        paymentDate: inst.payment_date,
        paidAmount: inst.paid_amount ? Number(inst.paid_amount) : null,
      })).sort((a: any, b: any) => a.installmentNumber - b.installmentNumber);

      return {
        id: tx.id,
        desc: tx.description,
        amount: Number(tx.amount),
        date: tx.date,
        isIncome: tx.is_income,
        type: tx.type as 'card' | 'cash' | 'prazo',
        installments: tx.installments, // Now this is the correct number from the DB
        account: tx.account_id,
        card: tx.card_id,
        categoryId: tx.category_id,
        paid: tx.paid,
        person: tx.person,
        reminderDaysBefore: tx.reminder_days_before,
        recurringSourceId: tx.recurring_source_id,
        userId: tx.user_id,
        installmentsSchedule: schedule
      }
    });
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

  const loadAllData = useCallback(async (forceLoading = true) => {
    if (!userId) {
      setState(prev => ({ ...prev, loading: false, refreshing: false }));
      return;
    }

    if (forceLoading) {
      setState(prev => ({ ...prev, loading: true, refreshing: false, error: null }));
    } else {
      setState(prev => ({ ...prev, refreshing: true, error: null }));
    }

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
        refreshing: false,
        error: null
      });
    } catch (error) {
      console.error('Error loading data from Supabase:', error);
      setState(prev => ({
        ...prev,
        loading: false,
        refreshing: false,
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

  // Set up realtime subscriptions with granular updates
  useEffect(() => {
    if (!userId) return;

    const channel = supabase
      .channel('db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'transactions', filter: `user_id=eq.${userId}` },
        async (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newTx = await mapTransaction(payload.new);
            setState(prev => ({
              ...prev,
              transactions: [newTx, ...prev.transactions]
            }));
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedTx = await mapTransaction(payload.new);
            setState(prev => ({
              ...prev,
              transactions: prev.transactions.map(t => t.id === updatedTx.id ? updatedTx : t)
            }));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setState(prev => ({
              ...prev,
              transactions: prev.transactions.filter(t => t.id !== payload.old.id)
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'installments' },
        async (payload) => {
          // For installments, update the parent transaction
          const txId = (payload.new as any)?.transaction_id || (payload.old as any)?.transaction_id;
          if (txId) {
            // Fetch just this transaction with its installments
            const { data: txData } = await supabase
              .from('transactions')
              .select('*')
              .eq('id', txId)
              .single();
            
            if (txData) {
              const { data: instData } = await supabase
                .from('installments')
                .select('*')
                .eq('transaction_id', txId);
              
              const updatedTx = await mapTransaction(txData, instData || []);
              setState(prev => ({
                ...prev,
                transactions: prev.transactions.map(t => t.id === updatedTx.id ? updatedTx : t)
              }));
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'accounts', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newAcc: Account = {
              id: payload.new.id,
              name: payload.new.name,
              balance: Number(payload.new.balance),
              isDefault: payload.new.is_default
            };
            setState(prev => ({
              ...prev,
              accounts: [...prev.accounts, newAcc]
            }));
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedAcc: Account = {
              id: payload.new.id,
              name: payload.new.name,
              balance: Number(payload.new.balance),
              isDefault: payload.new.is_default
            };
            setState(prev => ({
              ...prev,
              accounts: prev.accounts.map(a => a.id === updatedAcc.id ? updatedAcc : a)
            }));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setState(prev => ({
              ...prev,
              accounts: prev.accounts.filter(a => a.id !== payload.old.id)
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'cards', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newCard: Card = {
              id: payload.new.id,
              name: payload.new.name,
              closingDay: payload.new.closing_day,
              dueDay: payload.new.due_day,
              isDefault: payload.new.is_default,
              limit: Number(payload.new.limit_amount),
              accountId: payload.new.account_id,
              deleted: payload.new.deleted
            };
            setState(prev => ({
              ...prev,
              cards: [...prev.cards, newCard]
            }));
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedCard: Card = {
              id: payload.new.id,
              name: payload.new.name,
              closingDay: payload.new.closing_day,
              dueDay: payload.new.due_day,
              isDefault: payload.new.is_default,
              limit: Number(payload.new.limit_amount),
              accountId: payload.new.account_id,
              deleted: payload.new.deleted
            };
            setState(prev => ({
              ...prev,
              cards: prev.cards.map(c => c.id === updatedCard.id ? updatedCard : c)
            }));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setState(prev => ({
              ...prev,
              cards: prev.cards.filter(c => c.id !== payload.old.id)
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'goals', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newGoal: Goal = {
              id: payload.new.id,
              name: payload.new.name,
              targetAmount: Number(payload.new.target_amount),
              currentAmount: Number(payload.new.current_amount)
            };
            setState(prev => ({
              ...prev,
              goals: [...prev.goals, newGoal]
            }));
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedGoal: Goal = {
              id: payload.new.id,
              name: payload.new.name,
              targetAmount: Number(payload.new.target_amount),
              currentAmount: Number(payload.new.current_amount)
            };
            setState(prev => ({
              ...prev,
              goals: prev.goals.map(g => g.id === updatedGoal.id ? updatedGoal : g)
            }));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setState(prev => ({
              ...prev,
              goals: prev.goals.filter(g => g.id !== payload.old.id)
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'reminders', filter: `user_id=eq.${userId}` },
        (payload) => {
          if (payload.eventType === 'INSERT' && payload.new) {
            const newReminder: Reminder = {
              id: (payload.new as any).id,
              desc: (payload.new as any).description,
              date: (payload.new as any).date,
              time: (payload.new as any).time
            };
            setState(prev => ({
              ...prev,
              reminders: [...prev.reminders, newReminder]
            }));
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedReminder: Reminder = {
              id: (payload.new as any).id,
              desc: (payload.new as any).description,
              date: (payload.new as any).date,
              time: (payload.new as any).time
            };
            setState(prev => ({
              ...prev,
              reminders: prev.reminders.map(r => r.id === updatedReminder.id ? updatedReminder : r)
            }));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setState(prev => ({
              ...prev,
              reminders: prev.reminders.filter(r => r.id !== (payload.old as any).id)
            }));
          }
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'budgets', filter: `user_id=eq.${userId}` },
        (payload) => {
          if ((payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') && payload.new) {
            const newBudget = payload.new as any;
            const key = `${newBudget.category_id}_${newBudget.month}`;
            setState(prev => ({
              ...prev,
              budgets: {
                ...prev.budgets,
                [key]: Number(newBudget.amount)
              }
            }));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const oldBudget = payload.old as any;
            const key = `${oldBudget.category_id}_${oldBudget.month}`;
            setState(prev => {
              const newBudgets = { ...prev.budgets };
              delete newBudgets[key];
              return {
                ...prev,
                budgets: newBudgets
              };
            });
          }
        }
      )
      .subscribe();

    // Helper function to map a transaction record
    async function mapTransaction(txData: any, installmentsData?: any[]): Promise<Transaction> {
      let installments = installmentsData;
      
      // If installments not provided, fetch them
      if (!installments && txData.installments > 1) {
        const { data } = await supabase
          .from('installments')
          .select('*')
          .eq('transaction_id', txData.id);
        installments = data || [];
      }

      const schedule = (installments || []).map((inst: any) => ({
        id: inst.id,
        installmentNumber: inst.installment_number,
        amount: Number(inst.amount),
        paid: inst.paid,
        postingDate: inst.posting_date,
        paymentDate: inst.payment_date,
        paidAmount: inst.paid_amount ? Number(inst.paid_amount) : null
      }));

      return {
        id: txData.id,
        desc: txData.description,
        amount: Number(txData.amount),
        date: txData.date,
        account: txData.account_id,
        card: txData.card_id,
        categoryId: txData.category_id,
        installments: txData.installments,
        type: txData.type,
        paid: txData.paid,
        isIncome: txData.is_income,
        person: txData.person,
        installmentsSchedule: schedule,
        recurringSourceId: txData.recurring_source_id,
        reminderDaysBefore: txData.reminder_days_before
      };
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return {
    ...state,
    refetch: loadAllData,
    refetchTransactions: fetchTransactions
  };
};
