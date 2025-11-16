import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from './src/integrations/supabase/client';
import { useSupabase } from './hooks/useSupabase';
import { useSupabaseData } from './hooks/useSupabaseData';
import Sidebar from './components/shared/Sidebar';
import GlobalHeader from './components/shared/GlobalHeader';
import DashboardPage from './pages/DashboardPage';
import PlanningPage from './pages/PlanningPage';
import CalendarPage from './pages/CalendarPage';
import ReportsPage from './pages/ReportsPage';
import ProfilePage from './pages/ProfilePage';
import SubscriptionPage from './pages/SubscriptionPage';
import { TermosDeUsoPage, PoliticaPrivacidadePage, ContatoSuportePage, SobrePage, FAQPage } from './pages/InstitutionalPages';
import TransactionForm from './components/transactions/TransactionForm';
import TransactionDetailModal from './components/transactions/TransactionDetailModal';
import PaymentModal from './components/transactions/PaymentModal';
import TransactionFilterModal from './components/transactions/TransactionFilterModal';
import RecurringForm from './components/recurring/RecurringForm';
import TransferForm from './components/transfers/TransferForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './components/ui/Dialog';
import AccountList from './components/accounts/AccountList';
import AccountForm from './components/accounts/AccountForm';
import CardList from './components/cards/CardList';
import CardForm from './components/cards/CardForm';
import OnboardingTour from './components/tour/OnboardingTour';
import YaraChat from './components/chat/YaraChat';
import { ToastContainer, ToastProps } from './components/ui/Toast';
import ImportTransactionsModal from './components/transactions/ImportTransactionsModal';
import LandingPage from './pages/LandingPage';
import FamilyDashboardPage from './pages/FamilyDashboardPage';

import { 
  Transaction, Account, Card as CardType, Transfer, RecurringItem, Category, Goal, Reminder, User, Subscription, 
  PayingInstallment, UnpayInvoiceDetails, SubscriptionPlan, YaraUsage, AppState, GamificationState
} from './types';
import { DEFAULT_CATEGORIES } from './data/initialData';
import { monthKey, getInvoiceMonthKey, getInvoiceDueDate, toCurrency } from './utils/helpers';
import { runRecurringItem } from './services/recurringService';
import { loadState, saveState, getOnboardingStatus, setOnboardingCompleted, resetOnboardingStatus } from './services/storageService';
import { cn } from './utils/helpers';
import { Button } from './components/ui/Button';
import { Input } from './components/ui/Input';
import { Label } from './components/ui/Label';
import { Plus, Edit3, Trash2 } from 'lucide-react';
import GroupForm from './components/categories/GroupForm';
import { transactionSchema, transferSchema, recurringSchema } from './utils/validation';

const getNextGroupName = (existingGroups: string[]): string => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const usedLetters = new Set(
    existingGroups
      .map(g => g.match(/^\[([A-Z])\]$/))
      .filter(Boolean)
      .map(match => match![1])
  );

  for (const letter of letters) {
    if (!usedLetters.has(letter)) {
      return `[${letter}]`;
    }
  }

  return "[A]"; // Fallback, though unlikely with 26 letters
};

const getNextGroupName = (existingGroups: string[]): string => {
  const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const usedLetters = new Set(
    existingGroups
      .map(g => g.match(/^\[([A-Z])\]$/))
      .filter(Boolean)
      .map(match => match![1])
  );

  for (const letter of letters) {
    if (!usedLetters.has(letter)) {
      return `[${letter}]`;
    }
  }

  return "[A]"; // Fallback, though unlikely with 26 letters
};

const CategoryManager: React.FC<{
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  transactions: Transaction[];
  recurring: RecurringItem[];
  userId: string;
  addToast: (message: string, type?: 'error' | 'success') => void;
}> = ({ categories, setCategories, transactions, recurring, userId, addToast }) => {
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingGroup, setEditingGroup] = useState<string | null>(null);
  const [newGroupName, setNewGroupName] = useState('');
  const [groups, setGroups] = useState<string[]>([]);

  useEffect(() => {
    const existingGroups = Array.from(new Set(categories.filter(c => c.group).map(c => c.group!))).sort();
    setGroups(existingGroups);
  }, [categories]);

  const categoryGroups = useMemo(() => {
    return categories.reduce((acc, cat) => {
      const groupName = cat.group || 'Sem Grupo';
      if (!acc[groupName]) acc[groupName] = [];
      acc[groupName].push(cat);
      return acc;
    }, {} as Record<string, Category[]>);
  }, [categories]);

  const canDelete = (id: string) => {
    return !transactions.some(t => t.categoryId === id) && !recurring.some(r => r.categoryId === id);
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      const { error } = await supabase
        .from('categories')
        .insert({
          name,
          group_name: group || null,
          user_id: userId
        });

      if (error) throw error;

      addToast('Categoria adicionada com sucesso!', 'success');
      setName('');
      setGroup('');
    } catch (error) {
      console.error('Erro ao criar categoria:', error);
      addToast('Erro ao adicionar categoria. Tente novamente.', 'error');
    }
  };

  const handleUpdate = async () => {
    if (!editingCategory) return;

    try {
      const { error } = await supabase
        .from('categories')
        .update({
          name: editingCategory.name,
          group_name: editingCategory.group
        })
        .eq('id', editingCategory.id);

      if (error) throw error;

      addToast('Categoria atualizada com sucesso!', 'success');
      setEditingCategory(null);
    } catch (error) {
      console.error('Erro ao atualizar categoria:', error);
      addToast('Erro ao atualizar categoria. Tente novamente.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    if (!canDelete(id)) {
      addToast('Categoria em uso por transações ou recorrências.', 'error');
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      addToast('Categoria excluída com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao excluir categoria:', error);
      addToast('Erro ao excluir categoria. Tente novamente.', 'error');
    }
  };

  const handleUpdateGroup = async (oldGroupName: string, newGroupName: string) => {
    if (!newGroupName || oldGroupName === newGroupName) {
      setEditingGroup(null);
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .update({ group_name: newGroupName })
        .eq('group_name', oldGroupName)
        .eq('user_id', userId);

      if (error) throw error;

      addToast('Grupo atualizado com sucesso!', 'success');
      setEditingGroup(null);
    } catch (error) {
      console.error('Erro ao atualizar grupo:', error);
      addToast('Erro ao atualizar grupo. Tente novamente.', 'error');
    }
  };

  const handleDeleteGroup = async (groupName: string) => {
    const categoriesInGroup = categories.filter(c => c.group === groupName);
    if (categoriesInGroup.some(c => !canDelete(c.id))) {
      addToast('Não é possível excluir. Há categorias do grupo em uso.', 'error');
      return;
    }

    try {
      // Delete all categories in the group
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('group_name', groupName)
        .eq('user_id', userId);

      if (error) throw error;

      addToast('Grupo excluído com sucesso!', 'success');
    } catch (error) {
      console.error('Erro ao excluir grupo:', error);
      addToast('Erro ao excluir grupo. Tente novamente.', 'error');
    }
  };

  const handleUpdateGroup = (oldName: string) => {
    if (!newGroupName || newGroupName === oldName) {
      setEditingGroup(null);
      return;
    }
    // Update categories
    setCategories(prev => prev.map(c => c.group === oldName ? { ...c, group: newGroupName } : c));
    // Update groups list
    setGroups(prev => [...prev.filter(g => g !== oldName), newGroupName].sort());
    setEditingGroup(null);
    setNewGroupName('');
  };

  const handleDeleteGroup = (groupName: string) => {
    const isGroupInUse = categories.some(c => c.group === groupName);
    if (isGroupInUse) {
      alert("Não é possível excluir. O grupo está em uso por uma ou mais categorias.");
    } else {
      setGroups(prev => prev.filter(g => g !== groupName));
    }
  };

  const handleGroupAdded = (newGroup: string) => {
    setGroups(prev => [...prev, newGroup].sort());
    setGroup(newGroup);
  };

  return (
    <div className="flex flex-col flex-1">
      <div className="flex-1 overflow-y-auto pr-2 space-y-4 min-h-0 mb-4">
        {Object.keys(categoryGroups).sort().map(groupName => (
          <div key={groupName}>
            {editingGroup === groupName ? (
              <div className="flex items-center gap-2 mb-2">
                <Input value={newGroupName} onChange={e => setNewGroupName(e.target.value)} className="flex-grow"/>
                <Button size="sm" onClick={() => handleUpdateGroup(groupName)}>Salvar</Button>
                <Button size="sm" variant="ghost" onClick={() => setEditingGroup(null)}>Cancelar</Button>
              </div>
            ) : (
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-semibold text-indigo-600 dark:text-indigo-400">{groupName}</h4>
                {groupName !== 'Sem Grupo' && (
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingGroup(groupName); setNewGroupName(groupName); }}>
                      <Edit3 className="w-4 h-4" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-red-500" onClick={() => handleDeleteGroup(groupName)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            )}
            <div className="space-y-2">
              {categoryGroups[groupName].map(cat => (
                <div key={cat.id} className="p-3 border rounded-lg dark:border-slate-700">
                  {editingCategory?.id === cat.id ? (
                    <div className="space-y-2">
                      <Input value={editingCategory.name} onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })} placeholder="Nome da Categoria"/>
                      <select
                        value={editingCategory.group || ''}
                        onChange={e => setEditingCategory({ ...editingCategory, group: e.target.value })}
                        className="w-full p-2 h-10 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                      >
                        <option value="">Selecione um grupo</option>
                        {groups.map(g => <option key={g} value={g}>{g}</option>)}
                      </select>
                      <div className="flex gap-2 justify-end">
                        <Button variant="ghost" onClick={() => setEditingCategory(null)}>Cancelar</Button>
                        <Button onClick={handleUpdate}>Salvar</Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-sm">{cat.name}</span>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setEditingCategory(cat)}><Edit3 className="w-4 h-4" /></Button>
                        <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" disabled={!canDelete(cat.id)} onClick={() => handleDelete(cat.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      <div className="flex-shrink-0 mt-4 p-4 border-t bg-white dark:bg-slate-950">
        <form onSubmit={handleAdd} className="space-y-3">
          <h4 className="font-semibold">Adicionar Nova Categoria</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div><Label htmlFor="new-cat-name">Nome</Label><Input id="new-cat-name" value={name} onChange={e => setName(e.target.value)} /></div>
              <div>
                <Label htmlFor="new-cat-group">Grupo (Opcional)</Label>
                <select
                  id="new-cat-group"
                  value={group}
                  onChange={e => setGroup(e.target.value)}
                  className="w-full p-2 h-10 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                >
                  <option value="">Selecione um grupo</option>
                  {groups.map(g => <option key={g} value={g}>{g}</option>)}
                </select>
              </div>
          </div>
          <Button type="submit" className="w-full"><Plus className="w-4 h-4 mr-2"/>Adicionar Categoria</Button>
        </form>
        <GroupForm existingGroups={groups} onGroupAdded={handleGroupAdded} getNextGroupName={getNextGroupName} />
      </div>
    </div>
  );
};


const App: React.FC = () => {
    // Auth state
    const { user, loading: authLoading } = useSupabase();
    
    // Load all data from Supabase with realtime sync
    const supabaseData = useSupabaseData(user?.id || null);

    // Data State (synced with Supabase)
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [cards, setCards] = useState<CardType[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [recurring, setRecurring] = useState<RecurringItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [budgets, setBudgets] = useState<Record<string, number>>({});
    const [goals, setGoals] = useState<Goal[]>([]);
    const [reminders, setReminders] = useState<Reminder[]>([]);

    // User & Subscription State (synced from Supabase)
    const [users, setUsers] = useState<User[]>([]);
    const [subscription, setSubscription] = useState<Subscription>(supabaseData.subscription);
    const [gamification, setGamification] = useState<GamificationState>(supabaseData.gamification);
    const [yaraUsage, setYaraUsage] = useState<YaraUsage>(supabaseData.yaraUsage);
    
    // UI State
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [isSidebarMinimized, setIsSidebarMinimized] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'system'>('system');
    const [toasts, setToasts] = useState<ToastProps[]>([]);
    const [notifications, setNotifications] = useState<{ id: string, type: string, message: string }[]>([]);
    
    // Modals State
    const [modal, setModal] = useState<string | null>(null);
    const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
    const [payingInstallment, setPayingInstallment] = useState<PayingInstallment | null>(null);
    const [selectedRecurring, setSelectedRecurring] = useState<RecurringItem | null>(null);
    const [selectedTransfer, setSelectedTransfer] = useState<Transfer | null>(null);
    const [filters, setFilters] = useState({ description: '', categoryId: '', accountId: '', cardId: '', status: 'all', startDate: '', endDate: '' });

    // Feature State
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [focusedInvoice, setFocusedInvoice] = useState<{ cardId: string, month: string } | null>(null);

    // -- Derived State --
    const isLoading = authLoading || supabaseData.loading;
    const ownerProfile = useMemo(() => users.find(u => u.role === 'owner'), [users]);

    // -- Handlers --
    const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        const id = Date.now().toString();
        setToasts(prev => [...prev, { id, message, type }]);
    }, []);

    const removeToast = (id: string) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    };

    const addXp = (amount: number, reason: string) => {
        setGamification(prev => {
            const newXp = prev.xp + amount;
            if (newXp >= prev.xpToNextLevel) {
                addToast(`Você subiu para o Nível ${prev.level + 1}!`, 'success');
                return { level: prev.level + 1, xp: newXp - prev.xpToNextLevel, xpToNextLevel: Math.round(prev.xpToNextLevel * 1.5) };
            }
            return { ...prev, xp: newXp };
        });
    };

    const incrementYaraUsage = useCallback(async () => {
        if (!user) return;
        
        try {
            // Update in database
            const { error } = await supabase
                .from('yara_usage')
                .update({ 
                    count: yaraUsage.count + 1,
                    updated_at: new Date().toISOString()
                })
                .eq('user_id', user.id);

            if (error) throw error;

            // Update local state
            setYaraUsage(p => ({...p, count: p.count + 1}));
        } catch (error) {
            console.error('Error updating Yara usage:', error);
        }
    }, [user, yaraUsage.count]);

    const getCategoryName = useCallback((id: string | null) => {
        return categories.find(c => c.id === id)?.name || 'Sem Categoria';
    }, [categories]);

    const getInstallmentDueDate = useCallback((tx: Transaction, inst: any) => {
        if (tx.type === 'card') {
            const card = cards.find(c => c.id === tx.card);
            if (!card) return inst.postingDate;
            return getInvoiceDueDate(inst.postingDate, card.closingDay, card.dueDay);
        }
        return inst.postingDate;
    }, [cards]);

    const adjustAccountBalance = useCallback((accountId: string, delta: number) => {
        setAccounts(prev => prev.map(acc => acc.id === accountId ? { ...acc, balance: acc.balance + delta } : acc));
    }, []);

    const handleTransactionSubmit = (tx: Transaction) => {
      const existing = transactions.find(t => t.id === tx.id);
      if (existing) {
        // TODO: Handle balance adjustment for edited transactions
        setTransactions(prev => prev.map(t => t.id === tx.id ? tx : t));
        addToast('Transação atualizada com sucesso!', 'success');
      } else {
        setTransactions(prev => [tx, ...prev]);

        // Adjust account balance only for new, non-card transactions
        if (tx.type !== 'card') {
            const amountToAdjust = tx.isIncome ? tx.amount : -tx.amount;
            adjustAccountBalance(tx.account, amountToAdjust);
        }

        addToast('Transação adicionada com sucesso!', 'success');
        addXp(10, 'Transação adicionada');
      }
    };

    const handleImportTransactions = async (txs: Transaction[]) => {
      try {
        // Insert all transactions
        for (const tx of txs) {
          const { data: newTx, error: txError } = await supabase
            .from('transactions')
            .insert({
              description: tx.desc,
              amount: tx.amount,
              date: tx.date,
              installments: tx.installments,
              type: tx.type,
              is_income: tx.isIncome,
              person: tx.person,
              account_id: tx.account,
              card_id: tx.card,
              category_id: tx.categoryId,
              paid: tx.paid,
              reminder_days_before: tx.reminderDaysBefore,
              user_id: user!.id
            })
            .select()
            .single();

          if (txError) throw txError;

          if (newTx) {
            // Create installments
            const installmentsData = tx.installmentsSchedule.map(inst => ({
              transaction_id: newTx.id,
              installment_number: inst.id,
              amount: inst.amount,
              posting_date: inst.postingDate,
              paid: inst.paid,
              payment_date: inst.paymentDate,
              paid_amount: inst.paidAmount
            }));

            const { error: instError } = await supabase
              .from('installments')
              .insert(installmentsData);

            if (instError) throw instError;
          }
        }

        addToast(`${txs.length} transações importadas com sucesso!`, 'success');
        setModal(null);
      } catch (error) {
        console.error('Erro ao importar transações:', error);
        addToast('Erro ao importar transações. Tente novamente.', 'error');
      }
    };

    const handlePayInvoice = async (cardId: string, month: string) => {
        let totalPaid = 0;
        let accountId: string | null = null;
        const card = cards.find(c => c.id === cardId);
        if (!card) return;

        const installmentsToUpdate: any[] = [];

        transactions.forEach(tx => {
            if (tx.card !== cardId) return;
            tx.installmentsSchedule.forEach(s => {
                const invoiceM = getInvoiceMonthKey(s.postingDate, card.closingDay);
                if (invoiceM === month && !s.paid) {
                    totalPaid += s.amount;
                    accountId = tx.account;
                    installmentsToUpdate.push({
                        transaction_id: tx.id,
                        installment_number: s.id,
                        paid: true,
                        payment_date: new Date().toISOString().slice(0, 10),
                        paid_amount: s.amount
                    });
                }
            });
        });

        if (accountId && totalPaid > 0 && installmentsToUpdate.length > 0) {
            try {
                // Update installments in Supabase
                for (const inst of installmentsToUpdate) {
                    const { error } = await supabase
                        .from('installments')
                        .update({ 
                            paid: inst.paid, 
                            payment_date: inst.payment_date, 
                            paid_amount: inst.paid_amount 
                        })
                        .eq('transaction_id', inst.transaction_id)
                        .eq('installment_number', inst.installment_number);

                    if (error) throw error;
                }

                // Update account balance
                const { error: balanceError } = await supabase
                    .from('accounts')
                    .update({ balance: accounts.find(a => a.id === accountId)!.balance - totalPaid })
                    .eq('id', accountId);

                if (balanceError) throw balanceError;

                addToast(`Fatura de ${toCurrency(totalPaid)} paga!`, 'success');
            } catch (error) {
                console.error('Erro ao pagar fatura:', error);
                addToast('Erro ao pagar fatura. Tente novamente.', 'error');
            }
        }
    };

    const handlePayInstallment = async (txId: string, instId: number, paidAmount: number) => {
        const tx = transactions.find(t => t.id === txId);
        if (!tx) {
            addToast('Transação não encontrada.', 'error');
            return;
        }

        try {
            // 1. Update the installment
            const { error: instError } = await supabase
                .from('installments')
                .update({
                    paid: true,
                    paid_amount: paidAmount,
                    payment_date: new Date().toISOString().slice(0, 10)
                })
                .eq('transaction_id', txId)
                .eq('id', instId);

            if (instError) throw instError;

            // 2. Adjust account balance
            const account = accounts.find(a => a.id === tx.account);
            if (account) {
                const { error: accError } = await supabase
                    .from('accounts')
                    .update({ balance: account.balance - paidAmount })
                    .eq('id', account.id);
                if (accError) throw accError;
            }

            // 3. Check if all installments are paid and update the transaction if so
            const allPaid = tx.installmentsSchedule.every(inst => (inst.id === instId) || inst.paid);
            if (allPaid) {
                const { error: txError } = await supabase
                    .from('transactions')
                    .update({ paid: true })
                    .eq('id', txId);
                if (txError) throw txError;
            }

            addToast('Parcela paga com sucesso!', 'success');
            supabaseData.refetch(); // Refetch all data to ensure UI consistency

        } catch (error) {
            console.error("Error paying installment:", error);
            addToast('Erro ao processar pagamento. Tente novamente.', 'error');
        }
    };

    const handlePayInstallment = async (txId: string, instId: number, paidAmount: number) => {
        const tx = transactions.find(t => t.id === txId);
        if (!tx) {
            addToast('Transação não encontrada.', 'error');
            return;
        }

        try {
            // 1. Update the installment
            const { error: instError } = await supabase
                .from('installments')
                .update({
                    paid: true,
                    paid_amount: paidAmount,
                    payment_date: new Date().toISOString().slice(0, 10)
                })
                .eq('transaction_id', txId)
                .eq('id', instId);

            if (instError) throw instError;

            // 2. Adjust account balance
            const account = accounts.find(a => a.id === tx.account);
            if (account) {
                const { error: accError } = await supabase
                    .from('accounts')
                    .update({ balance: account.balance - paidAmount })
                    .eq('id', account.id);
                if (accError) throw accError;
            }

            // 3. Check if all installments are paid and update the transaction if so
            const allPaid = tx.installmentsSchedule.every(inst => (inst.id === instId) || inst.paid);
            if (allPaid) {
                const { error: txError } = await supabase
                    .from('transactions')
                    .update({ paid: true })
                    .eq('id', txId);
                if (txError) throw txError;
            }

            addToast('Parcela paga com sucesso!', 'success');
            supabaseData.refetch(); // Refetch all data to ensure UI consistency

        } catch (error) {
            console.error("Error paying installment:", error);
            addToast('Erro ao processar pagamento. Tente novamente.', 'error');
        }
    };
    
    const handleUnpayInstallment = async (txId: string, instId: number) => {
        const tx = transactions.find(t => t.id === txId);
        const inst = tx?.installmentsSchedule.find(i => i.id === instId);

        if (!tx || !inst || !inst.paid) {
            addToast('Parcela não encontrada ou não está paga.', 'error');
            return;
        }

        const refundAmount = inst.paidAmount || inst.amount;

        try {
            // 1. Update the installment to be unpaid
            const { error: instError } = await supabase
                .from('installments')
                .update({
                    paid: false,
                    paid_amount: null,
                    payment_date: null
                })
                .eq('transaction_id', txId)
                .eq('id', instId);

            if (instError) throw instError;

            // 2. Adjust account balance
            const account = accounts.find(a => a.id === tx.account);
            if (account) {
                const { error: accError } = await supabase
                    .from('accounts')
                    .update({ balance: account.balance + refundAmount })
                    .eq('id', account.id);
                if (accError) throw accError;
            }

            // 3. Update the parent transaction to not be paid
            if (tx.paid) {
                const { error: txError } = await supabase
                    .from('transactions')
                    .update({ paid: false })
                    .eq('id', txId);
                if (txError) throw txError;
            }

            addToast('Estorno realizado com sucesso!', 'success');
            supabaseData.refetch();

        } catch (error) {
            console.error("Error processing refund:", error);
            addToast('Erro ao processar estorno. Tente novamente.', 'error');
        }
    };

    const handleFocusInvoice = (cardId: string, month: string) => {
        setFocusedInvoice({ cardId, month });
        setCurrentPage('dashboard');
        // Close the transaction detail modal as we navigate away
        setSelectedTransaction(null);
    };

    const handleUnpayInvoice = (details: UnpayInvoiceDetails) => {
      if (details.cardId && details.total > 0 && details.accountId) {
        try {
            const card = cards.find(c => c.id === details.cardId);
            if (!card) return;

            // Find all installments to unpay
            const installmentsToUpdate: any[] = [];
            transactions.forEach(tx => {
                if (tx.card !== details.cardId) return;
                tx.installmentsSchedule.forEach(s => {
                    const invoiceM = getInvoiceMonthKey(s.postingDate, card.closingDay);
                    if (invoiceM === details.month && s.paid) {
                        installmentsToUpdate.push({
                            transaction_id: tx.id,
                            installment_id: s.id
                        });
                    }
                });
            });

            // Update installments in Supabase
            for (const inst of installmentsToUpdate) {
                const { error } = await supabase
                    .from('installments')
                    .update({ paid: false, payment_date: null, paid_amount: null })
                    .eq('transaction_id', inst.transaction_id)
                    .eq('id', inst.installment_id);

                if (error) throw error;
            }

            // Update account balance
            const { error: balanceError } = await supabase
                .from('accounts')
                .update({ balance: accounts.find(a => a.id === details.accountId)!.balance + details.total })
                .eq('id', details.accountId);

            if (balanceError) throw balanceError;

            addToast('Estorno da fatura realizado.', 'success');
        } catch (error) {
            console.error('Erro ao estornar fatura:', error);
            addToast('Erro ao estornar fatura. Tente novamente.', 'error');
        }
      }
    }

    const onAddTransfer = async (transfer: Transfer) => {
        try {
            // Validate transfer data
            const validationResult = transferSchema.safeParse({
                amount: transfer.amount,
                date: transfer.date,
                fromAccount: transfer.fromAccount,
                toAccount: transfer.toAccount
            });

            if (!validationResult.success) {
                const firstError = validationResult.error.issues[0];
                addToast(firstError.message, 'error');
                return;
            }

            const { error } = await supabase
                .from('transfers')
                .insert({
                    amount: transfer.amount,
                    date: transfer.date,
                    from_account: transfer.fromAccount,
                    to_account: transfer.toAccount,
                    user_id: user!.id
                });

            if (error) throw error;

            // Update account balances
            const fromAccount = accounts.find(a => a.id === transfer.fromAccount);
            const toAccount = accounts.find(a => a.id === transfer.toAccount);

            if (fromAccount) {
                await supabase
                    .from('accounts')
                    .update({ balance: fromAccount.balance - transfer.amount })
                    .eq('id', transfer.fromAccount);
            }

            if (toAccount) {
                await supabase
                    .from('accounts')
                    .update({ balance: toAccount.balance + transfer.amount })
                    .eq('id', transfer.toAccount);
            }

            addToast('Transferência realizada!', 'success');
            setModal(null);
        } catch (error) {
            console.error('Erro ao criar transferência:', error);
            addToast('Erro ao criar transferência. Tente novamente.', 'error');
        }
    }
    
    const handleRecurringAdd = async (item: Omit<RecurringItem, 'id'>) => {
        try {
            // Validate recurring data
            const validationResult = recurringSchema.safeParse({
                desc: item.desc,
                amount: item.amount,
                day: item.day
            });

            if (!validationResult.success) {
                const firstError = validationResult.error.issues[0];
                addToast(firstError.message, 'error');
                return;
            }

            const { error } = await supabase
                .from('recurring_items')
                .insert({
                    description: item.desc,
                    amount: item.amount,
                    day: item.day,
                    type: item.type,
                    is_income: item.isIncome,
                    account_id: item.account,
                    card_id: item.card,
                    category_id: item.categoryId,
                    enabled: item.enabled,
                    last_run: item.lastRun,
                    next_run: item.nextRun,
                    user_id: user!.id
                });

            if (error) throw error;

            addToast('Recorrência criada!', 'success');
            setModal(null);
        } catch (error) {
            console.error('Erro ao criar recorrência:', error);
            addToast('Erro ao criar recorrência. Tente novamente.', 'error');
        }
    };

    const handleRecurringUpdate = async (item: RecurringItem) => {
        try {
            // Validate recurring data
            const validationResult = recurringSchema.safeParse({
                desc: item.desc,
                amount: item.amount,
                day: item.day
            });

            if (!validationResult.success) {
                const firstError = validationResult.error.issues[0];
                addToast(firstError.message, 'error');
                return;
            }

            const { error } = await supabase
                .from('recurring_items')
                .update({
                    description: item.desc,
                    amount: item.amount,
                    day: item.day,
                    type: item.type,
                    is_income: item.isIncome,
                    account_id: item.account,
                    card_id: item.card,
                    category_id: item.categoryId,
                    enabled: item.enabled,
                    last_run: item.lastRun,
                    next_run: item.nextRun
                })
                .eq('id', item.id);

            if (error) throw error;

            addToast('Recorrência atualizada!', 'success');
            setModal(null);
        } catch (error) {
            console.error('Erro ao atualizar recorrência:', error);
            addToast('Erro ao atualizar recorrência. Tente novamente.', 'error');
        }
    };

    const handleTransferUpdate = async (transfer: Transfer) => {
        try {
            // Validate transfer data
            const validationResult = transferSchema.safeParse({
                amount: transfer.amount,
                date: transfer.date,
                fromAccount: transfer.fromAccount,
                toAccount: transfer.toAccount
            });

            if (!validationResult.success) {
                const firstError = validationResult.error.issues[0];
                addToast(firstError.message, 'error');
                return;
            }

            // Get old transfer data to revert balances
            const { data: oldTransfer } = await supabase
                .from('transfers')
                .select('*')
                .eq('id', transfer.id)
                .single();

            if (!oldTransfer) throw new Error('Transferência não encontrada');

            // Update the transfer
            const { error } = await supabase
                .from('transfers')
                .update({
                    amount: transfer.amount,
                    date: transfer.date,
                    from_account: transfer.fromAccount,
                    to_account: transfer.toAccount
                })
                .eq('id', transfer.id);

            if (error) throw error;

            // Revert old balances
            const oldFromAccount = accounts.find(a => a.id === oldTransfer.from_account);
            const oldToAccount = accounts.find(a => a.id === oldTransfer.to_account);

            if (oldFromAccount) {
                await supabase
                    .from('accounts')
                    .update({ balance: oldFromAccount.balance + Number(oldTransfer.amount) })
                    .eq('id', oldTransfer.from_account);
            }

            if (oldToAccount) {
                await supabase
                    .from('accounts')
                    .update({ balance: oldToAccount.balance - Number(oldTransfer.amount) })
                    .eq('id', oldTransfer.to_account);
            }

            // Apply new balances
            const newFromAccount = accounts.find(a => a.id === transfer.fromAccount);
            const newToAccount = accounts.find(a => a.id === transfer.toAccount);

            if (newFromAccount) {
                await supabase
                    .from('accounts')
                    .update({ balance: newFromAccount.balance - transfer.amount })
                    .eq('id', transfer.fromAccount);
            }

            if (newToAccount) {
                await supabase
                    .from('accounts')
                    .update({ balance: newToAccount.balance + transfer.amount })
                    .eq('id', transfer.toAccount);
            }

            addToast('Transferência atualizada!', 'success');
            setModal(null);
        } catch (error) {
            console.error('Erro ao atualizar transferência:', error);
            addToast('Erro ao atualizar transferência. Tente novamente.', 'error');
        }
    };
    
    
    const handleEnterApp = (page?: string) => {
        setCurrentPage(page || 'dashboard');
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/auth';
    };
    
    // -- Effects --
    // Sync data from Supabase hook to local state
    useEffect(() => {
        if (!supabaseData.loading) {
            setAccounts(supabaseData.accounts);
            setCards(supabaseData.cards);
            setTransactions(supabaseData.transactions);
            setTransfers(supabaseData.transfers);
            setRecurring(supabaseData.recurring);
            setCategories(supabaseData.categories);
            setBudgets(supabaseData.budgets);
            setGoals(supabaseData.goals);
            setReminders(supabaseData.reminders);
            setSubscription(supabaseData.subscription);
            setGamification(supabaseData.gamification);
            setYaraUsage(supabaseData.yaraUsage);
        }
    }, [supabaseData]);

    // Load theme preference from localStorage (UI preference only)
    useEffect(() => {
        const stored = loadState();
        setThemePreference(stored.themePreference || 'system');
        
        const onboardingCompleted = getOnboardingStatus();
        if (!onboardingCompleted && user) {
            setTimeout(() => setShowOnboarding(true), 1000);
        }
    }, [user]);

    // Load user profile from Supabase
    useEffect(() => {
        const loadProfile = async () => {
            if (!user) {
                setUsers([]);
                return;
            }

            // Fetch profile data
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('user_id', user.id)
                .maybeSingle();

            if (profileError || !profileData) {
                console.error('Error loading profile:', profileError);
                return;
            }

            // Fetch user role from user_roles table (secure)
            const { data: roleData } = await supabase
                .from('user_roles')
                .select('role')
                .eq('user_id', user.id)
                .maybeSingle();

            // Use role from user_roles table or fallback to 'member'
            const userRole = roleData?.role === 'owner' ? 'owner' : 'member';

            setUsers([{
                id: profileData.user_id,
                name: profileData.name,
                email: profileData.email,
                avatar: profileData.avatar,
                role: userRole
            }]);
        };

        loadProfile();
    }, [user]);

    const refreshTransactions = useCallback(async () => {
        await supabaseData.refetchTransactions();
    }, [supabaseData]);

    // Save theme preference to localStorage (UI preference only)
    useEffect(() => {
        if (!authLoading && !supabaseData.loading) {
            saveState({ themePreference });
        }
    }, [themePreference, authLoading, supabaseData.loading]);

    // Effect to scroll to top on page change
    useEffect(() => {
        window.scrollTo(0, 0);
    }, [currentPage]);

    useEffect(() => {
        if (isLoading) return; // Prevent running on initial load before state is settled
        
        const todayKey = new Date().toISOString().slice(0, 10);
        const newTxs: Transaction[] = [];
        const updatedRecurringItems = recurring.map(item => {
            const { item: updatedItem, newTx } = runRecurringItem(item, todayKey);
            if (newTx) {
                newTxs.push(newTx);
            }
            return updatedItem;
        });
        
        if(newTxs.length > 0) {
            setTransactions(prev => [...prev, ...newTxs]);
            setRecurring(updatedRecurringItems);
            addToast(`${newTxs.length} transaç${newTxs.length > 1 ? 'ões' : 'ão'} recorrente${newTxs.length > 1 ? 's' : ''} gerada${newTxs.length > 1 ? 's' : ''}.`, 'success');
        }
    }, [isLoading]); 
    
    useEffect(() => {
        const applyTheme = (theme: 'light' | 'dark') => {
            if (theme === 'dark') {
                document.documentElement.classList.add('dark');
            } else {
                document.documentElement.classList.remove('dark');
            }
        };

        if (themePreference === 'system') {
            const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
            applyTheme(mediaQuery.matches ? 'dark' : 'light');

            const handler = (e: MediaQueryListEvent) => applyTheme(e.matches ? 'dark' : 'light');
            mediaQuery.addEventListener('change', handler);
            return () => mediaQuery.removeEventListener('change', handler);
        } else {
            applyTheme(themePreference);
        }
    }, [themePreference]);
    
    const stateToExport: Partial<AppState> = { accounts, cards, transactions, transfers, recurring, categories, budgets, goals, reminders, users, subscription, themePreference, gamification, yaraUsage };

    const pageContent = () => {
        if (isLoading) return <div>Loading...</div>;
        switch (currentPage) {
            case 'dashboard': return ownerProfile ? <DashboardPage
                transactions={transactions} filters={filters} accounts={accounts} cards={cards} transfers={transfers}
                recurring={recurring} categories={categories} getCategoryName={getCategoryName}
                getInstallmentDueDate={getInstallmentDueDate} addToast={addToast} onPayInvoice={handlePayInvoice}
                onUnpayInvoice={handleUnpayInvoice} onAddTransaction={() => {setSelectedTransaction(null); setModal('addTransaction')}}
                onViewTransaction={(tx) => setSelectedTransaction(tx)}
                onAddRecurring={() => {setSelectedRecurring(null); setModal('addRecurring')}} onEditRecurring={(item) => {setSelectedRecurring(item); setModal('editRecurring')}}
                onUpdateRecurring={setRecurring as any} onRemoveRecurring={setRecurring as any}
                onAddTransfer={() => {setSelectedTransfer(null); setModal('addTransfer')}} onEditTransfer={(t) => {setSelectedTransfer(t); setModal('editTransfer')}}
                onDeleteTransfer={(id) => setTransfers(p => p.filter(t => t.id !== id))} onOpenFilter={() => setModal('filters')}
                ownerProfile={ownerProfile} isLoading={isLoading}
                focusedInvoice={focusedInvoice} setFocusedInvoice={setFocusedInvoice}
             />;
            case 'familyDashboard': return <FamilyDashboardPage 
                transactions={transactions} users={users} goals={goals} categories={categories}
                getCategoryName={getCategoryName} subscription={subscription}
                onGoToSubscription={() => setCurrentPage('subscription')}
            />;
            case 'planning': return <PlanningPage 
                categories={categories} budgets={budgets} setBudgets={setBudgets} goals={goals} setGoals={setGoals} 
                accounts={accounts} adjustAccountBalance={adjustAccountBalance} setTransactions={setTransactions} 
                addToast={addToast} transactions={transactions} isLoading={isLoading} addXp={addXp}
            />;
            case 'reports': return <ReportsPage transactions={transactions} accounts={accounts} cards={cards} categories={categories} getCategoryName={getCategoryName} />;
            case 'calendar': return <CalendarPage transactions={transactions} reminders={reminders} setReminders={setReminders} getInstallmentDueDate={getInstallmentDueDate} getCategoryName={getCategoryName}/>;
            case 'profile': return ownerProfile ? <ProfilePage 
                ownerProfile={ownerProfile} users={users} subscription={subscription}
                onUpdateUser={(user) => setUsers(prev => prev.map(u => u.id === user.id ? user : u))}
                onAddUser={(name, email) => setUsers(prev => [...prev, { id: Date.now().toString(), name, email, avatar: null, role: 'member' }])}
                onRemoveUser={(id) => setUsers(p => p.filter(u => u.id !== id))}
                addToast={addToast} onGoToSubscription={() => setCurrentPage('subscription')}
                themePreference={themePreference} onSetThemePreference={setThemePreference}
                isLoading={isLoading}
                onOpenImport={() => setModal('import')}
                appState={stateToExport}
                gamification={gamification}
                onLogout={handleLogout}
            /> : <div className="flex items-center justify-center h-full"><p>Carregando perfil...</p></div>;
            case 'subscription': return <SubscriptionPage 
                currentSubscription={subscription} isLoading={isLoading} addToast={addToast}
                onUpgradePlan={(plan, slots) => { setSubscription({ plan, memberSlots: slots, expires: null }); addToast('Plano atualizado com sucesso!'); setCurrentPage('profile');}}
            />;
            case 'terms': return <TermosDeUsoPage />;
            case 'privacy': return <PoliticaPrivacidadePage />;
            case 'contact': return <ContatoSuportePage />;
            case 'about': return <SobrePage />;
            case 'faq': return <FAQPage />;
            default: return null;
        }
    };

    return (
        <div className={cn("bg-slate-100 dark:bg-slate-950 text-slate-900 dark:text-slate-50", themePreference === 'system' ? '' : themePreference)}>
            <div className="flex min-h-screen">
                <Sidebar 
                  currentPage={currentPage} setCurrentPage={setCurrentPage} 
                  onOpenAccounts={() => setModal('accounts')} onOpenCards={() => setModal('cards')} onOpenCategories={() => setModal('categories')}
                  isMinimized={isSidebarMinimized} setIsMinimized={setIsSidebarMinimized}
                  isMobileMenuOpen={isMobileMenuOpen} setIsMobileMenuOpen={setIsMobileMenuOpen}
                  onGoToLanding={async () => {
                    await supabase.auth.signOut();
                    window.location.href = '/auth';
                  }}
                  subscription={subscription}
                />
                <div className={cn("flex-1 flex flex-col transition-all duration-300 ease-in-out", isSidebarMinimized ? "md:ml-20" : "md:ml-64")}>
                    <GlobalHeader 
                        currentPage={currentPage}
                        notifications={notifications}
                        onClearNotifications={() => setNotifications([])}
                        onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
                        isMobileMenuOpen={isMobileMenuOpen}
                        gamification={gamification}
                    />
                    <main className="flex-1 p-4 sm:p-6 overflow-y-auto">
                        <div className="pb-32 w-full">
                            {pageContent()}
                        </div>
                    </main>
                </div>
            </div>
            
            {/* Modals */}
            <TransactionForm isOpen={modal === 'addTransaction' || modal === 'editTransaction'} onClose={() => {setModal(null); setSelectedTransaction(null)}} onSubmit={handleTransactionSubmit} transaction={selectedTransaction} accounts={accounts} cards={cards} categories={categories} isLoading={isLoading} />
            <TransactionDetailModal transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} onEdit={(tx) => {setSelectedTransaction(tx); setModal('editTransaction')}} onDelete={(id) => setTransactions(p => p.filter(t => t.id !== id))} onPay={(details) => setPayingInstallment(details)} onUnpay={handleUnpayInstallment} getInstallmentDueDate={getInstallmentDueDate} getCategoryName={getCategoryName} accounts={accounts} cards={cards} onFocusInvoice={handleFocusInvoice} />
            <PaymentModal payingInstallment={payingInstallment} onClose={() => setPayingInstallment(null)} onConfirm={handlePayInstallment} />
            <TransactionFilterModal isOpen={modal === 'filters'} onClose={() => setModal(null)} onApply={setFilters} onClear={() => setFilters({ description: '', categoryId: '', accountId: '', cardId: '', status: 'all', startDate: '', endDate: '' })} initialFilters={filters} accounts={accounts} cards={cards} categories={categories} />
            <Dialog open={modal === 'addRecurring' || modal === 'editRecurring'} onOpenChange={() => {setModal(null); setSelectedRecurring(null);}}><DialogContent><DialogHeader><DialogTitle>{modal === 'editRecurring' ? 'Editar' : 'Adicionar'} Recorrência</DialogTitle></DialogHeader><RecurringForm recurringItem={selectedRecurring} onAdd={(item) => {setRecurring(p=>[...p, {...item, id: Date.now().toString()}]); setModal(null);}} onUpdate={(item) => {setRecurring(p=>p.map(r=>r.id===item.id?item:r)); setModal(null);}} accounts={accounts} cards={cards} categories={categories} onClose={() => setModal(null)} isLoading={isLoading}/></DialogContent></Dialog>
            <Dialog open={modal === 'addTransfer' || modal === 'editTransfer'} onOpenChange={() => {setModal(null); setSelectedTransfer(null);}}><DialogContent><DialogHeader><DialogTitle>{modal === 'editTransfer' ? 'Editar' : 'Nova'} Transferência</DialogTitle></DialogHeader><TransferForm accounts={accounts} transfer={selectedTransfer} onTransfer={onAddTransfer} onUpdate={(t) => {setTransfers(p=>p.map(tr=>tr.id===t.id?t:tr)); setModal(null)}} onDismiss={() => setModal(null)} onError={addToast} isLoading={isLoading}/></DialogContent></Dialog>
            <Dialog open={modal === 'accounts'} onOpenChange={() => setModal(null)}><DialogContent className="w-full"><DialogHeader><DialogTitle>Contas</DialogTitle></DialogHeader><AccountList accounts={accounts} setAccounts={setAccounts} adjustAccountBalance={adjustAccountBalance} setTransactions={setTransactions} addToast={addToast} onConfirmDelete={(acc) => {}} /><AccountForm setAccounts={setAccounts} setTransactions={setTransactions} /></DialogContent></Dialog>
            <Dialog open={modal === 'cards'} onOpenChange={() => setModal(null)}><DialogContent className="w-full"><DialogHeader><DialogTitle>Cartões</DialogTitle></DialogHeader><CardList cards={cards} setCards={setCards} transactions={transactions} addToast={addToast} onConfirmDelete={(c) => {}} accounts={accounts}/><CardForm setCards={setCards} accounts={accounts} addToast={addToast}/></DialogContent></Dialog>
            <Dialog open={modal === 'categories'} onOpenChange={() => setModal(null)}><DialogContent className="flex flex-col"><DialogHeader><DialogTitle>Categorias</DialogTitle></DialogHeader><CategoryManager categories={categories} setCategories={setCategories} transactions={transactions} recurring={recurring} /></DialogContent></Dialog>
            <ImportTransactionsModal isOpen={modal === 'import'} onClose={() => setModal(null)} accounts={accounts} onConfirmImport={(txs) => {}} addToast={addToast} isLoading={isLoading} />

            {/* Global UI */}
            {ownerProfile && <YaraChat 
                subscription={subscription} 
                yaraUsage={yaraUsage} 
                incrementYaraUsage={incrementYaraUsage}
                onUpgradeClick={() => setCurrentPage('subscription')}
                onTransactionAdded={refreshTransactions}
            />}
            {showOnboarding && <OnboardingTour onComplete={() => {setShowOnboarding(false); setOnboardingCompleted();}} />}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
};

export default App;