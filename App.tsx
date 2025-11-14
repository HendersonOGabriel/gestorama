import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '@/src/integrations/supabase/client';
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
import { MOCK_ACCOUNTS, MOCK_CARDS, MOCK_TRANSACTIONS, MOCK_RECURRING, MOCK_BUDGETS, MOCK_GOALS } from './data/mockData';
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

const CategoryManager: React.FC<{
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  transactions: Transaction[];
  recurring: RecurringItem[];
}> = ({ categories, setCategories, transactions, recurring }) => {
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
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

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setCategories(prev => [...prev, { id: Date.now().toString(), name, group: group || null }]);
    setName(''); setGroup('');
  };

  const handleUpdate = () => {
    if (!editingCategory) return;
    setCategories(prev => prev.map(c => c.id === editingCategory.id ? editingCategory : c));
    setEditingCategory(null);
  };

  const handleDelete = (id: string) => {
    if (canDelete(id)) {
      setCategories(p => p.filter(cat => cat.id !== id));
    } else {
      // In a real app, we'd use the addToast prop here. For simplicity, an alert is used.
      alert("Não é possível excluir. Categoria em uso por transações ou recorrências.");
    }
  };

  const handleGroupAdded = (newGroup: string) => {
    setGroups(prev => [...prev, newGroup].sort());
    setGroup(newGroup);
  };

  return (
    <div className="space-y-6 max-h-[70vh] flex flex-col">
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {Object.keys(categoryGroups).sort().map(groupName => (
          <div key={groupName}>
            <h4 className="font-semibold text-indigo-600 dark:text-indigo-400 mb-2">{groupName}</h4>
            <div className="space-y-2">
              {categoryGroups[groupName].map(cat => (
                <div key={cat.id} className="p-3 border rounded-lg dark:border-slate-700">
                  {editingCategory?.id === cat.id ? (
                    <div className="space-y-2">
                      <Input value={editingCategory.name} onChange={e => setEditingCategory({ ...editingCategory, name: e.target.value })} placeholder="Nome da Categoria"/>
                      <Input value={editingCategory.group || ''} onChange={e => setEditingCategory({ ...editingCategory, group: e.target.value })} placeholder="Nome do Grupo"/>
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
      <div className="mt-4 p-4 border-t bg-white dark:bg-slate-950 sticky bottom-0">
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
        <GroupForm existingGroups={groups} onGroupAdded={handleGroupAdded} />
      </div>
    </div>
  );
};


const App: React.FC = () => {
    // Main App State
    const [isLoading, setIsLoading] = useState(true);

    // Data State
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [cards, setCards] = useState<CardType[]>([]);
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [transfers, setTransfers] = useState<Transfer[]>([]);
    const [recurring, setRecurring] = useState<RecurringItem[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [budgets, setBudgets] = useState<Record<string, number>>({});
    const [goals, setGoals] = useState<Goal[]>([]);
    const [reminders, setReminders] = useState<Reminder[]>([]);

    // User & Subscription State
    const [users, setUsers] = useState<User[]>([]);
    const [subscription, setSubscription] = useState<Subscription>({ plan: 'free', memberSlots: 1, expires: null });
    
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
    const [gamification, setGamification] = useState<GamificationState>({ level: 1, xp: 0, xpToNextLevel: 100 });
    const [yaraUsage, setYaraUsage] = useState<YaraUsage>({count: 0, lastReset: new Date().toISOString().slice(0, 10)});

    // -- Derived State --
    const ownerProfile = useMemo(() => users.find(u => u.role === 'owner')!, [users]);

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
        setTransactions(prev => prev.map(t => t.id === tx.id ? tx : t));
        addToast('Transação atualizada com sucesso!', 'success');
      } else {
        setTransactions(prev => [tx, ...prev]);
        addToast('Transação adicionada com sucesso!', 'success');
        addXp(10, 'Transação adicionada');
      }
      setModal(null);
    };

    const handlePayInvoice = (cardId: string, month: string) => {
        let totalPaid = 0;
        let accountId: string | null = null;
        const card = cards.find(c => c.id === cardId);
        if (!card) return;

        setTransactions(prev => prev.map(tx => {
            if (tx.card !== cardId) return tx;
            const newSchedule = tx.installmentsSchedule.map(s => {
                const invoiceM = getInvoiceMonthKey(s.postingDate, card.closingDay);
                if (invoiceM === month && !s.paid) {
                    totalPaid += s.amount;
                    accountId = tx.account;
                    return { ...s, paid: true, paymentDate: new Date().toISOString().slice(0, 10), paidAmount: s.amount };
                }
                return s;
            });
            return { ...tx, installmentsSchedule: newSchedule, paid: newSchedule.every(s => s.paid) };
        }));

        if (accountId && totalPaid > 0) {
            adjustAccountBalance(accountId, -totalPaid);
            addToast(`Fatura de ${toCurrency(totalPaid)} paga!`, 'success');
        }
    };
    
    const handleUnpayInvoice = (details: UnpayInvoiceDetails) => {
      if (details.cardId && details.total > 0 && details.accountId) {
        adjustAccountBalance(details.accountId, details.total);
        addToast('Estorno da fatura realizado.', 'success');
      }
    }

    const onAddTransfer = (transfer: Transfer) => {
        setTransfers(prev => [transfer, ...prev]);
        adjustAccountBalance(transfer.fromAccount, -transfer.amount);
        adjustAccountBalance(transfer.toAccount, transfer.amount);
        addToast('Transferência realizada!', 'success');
        setModal(null);
    }
    
    const handleEnterApp = (page?: string) => {
        setCurrentPage(page || 'dashboard');
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        window.location.href = '/auth';
    };
    
    // -- Effects --
    useEffect(() => {
        // FIX: Onboarding status is now checked for all users, not just new ones.
        // resetOnboardingStatus(); // TEMP: Uncomment to force tour on every refresh
        const stored = loadState();
        const isNewUser = !(stored.accounts && stored.accounts.length > 0);

        if (isNewUser) {
            // First time load with mock data
            setAccounts(MOCK_ACCOUNTS);
            setCards(MOCK_CARDS);
            setTransactions(MOCK_TRANSACTIONS);
            setRecurring(MOCK_RECURRING);
            setCategories(DEFAULT_CATEGORIES);
            setBudgets(MOCK_BUDGETS);
            setGoals(MOCK_GOALS);
            setUsers([{ id: 'user1', name: 'Usuário', email: 'user@gestorama.com', avatar: null, role: 'owner' }]);
        } else {
            // Load from storage
            setAccounts(stored.accounts!);
            setCards(stored.cards || []);
            setTransactions(stored.transactions || []);
            setTransfers(stored.transfers || []);
            setRecurring(stored.recurring || []);
            setCategories(stored.categories || DEFAULT_CATEGORIES);
            setBudgets(stored.budgets || {});
            setGoals(stored.goals || []);
            setReminders(stored.reminders || []);
            setUsers(stored.users || [{ id: 'user1', name: 'Usuário', email: 'user@gestorama.com', avatar: null, role: 'owner' }]);
            setSubscription(stored.subscription || { plan: 'free', memberSlots: 1, expires: null });
            setThemePreference(stored.themePreference || 'system');
            setGamification(stored.gamification || { level: 1, xp: 0, xpToNextLevel: 100 });
            setYaraUsage(stored.yaraUsage || { count: 0, lastReset: new Date().toISOString().slice(0, 10)});
        }

        const onboardingCompleted = getOnboardingStatus();
        if (!onboardingCompleted) {
            // Add a small delay to ensure the dashboard page has started rendering
            setTimeout(() => setShowOnboarding(true), 1000);
        }

        setIsLoading(false);
    }, []);

    useEffect(() => {
        if (!isLoading) {
            saveState({ 
                accounts, cards, transactions, transfers, recurring, categories, budgets, goals, reminders, users, subscription, themePreference, gamification, yaraUsage,
                // These are reset on each save for simplicity in this example
                notifiedGoalIds: [], notifiedBudgetKeys: [], notifiedInvoiceKeys: [], notifiedReminderIds: [], notifiedTxReminderKeys: [], notifiedAnomalyKeys: []
            });
        }
    }, [accounts, cards, transactions, transfers, recurring, categories, budgets, goals, reminders, users, subscription, themePreference, isLoading, gamification, yaraUsage]);

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
            case 'dashboard': return <DashboardPage
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
            case 'profile': return <ProfilePage 
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
            />;
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
                <main className={cn("flex-1 p-4 sm:p-6 transition-all duration-300 ease-in-out", isSidebarMinimized ? "md:ml-20" : "md:ml-64")}>
                    <GlobalHeader 
                        currentPage={currentPage}
                        notifications={notifications}
                        onClearNotifications={() => setNotifications([])}
                        onToggleMobileMenu={() => setIsMobileMenuOpen(prev => !prev)}
                        isMobileMenuOpen={isMobileMenuOpen}
                        gamification={gamification}
                    />
                    <div className="mt-4 pb-32 w-full">
                        {pageContent()}
                    </div>
                </main>
            </div>
            
            {/* Modals */}
            <TransactionForm isOpen={modal === 'addTransaction' || modal === 'editTransaction'} onClose={() => {setModal(null); setSelectedTransaction(null)}} onSubmit={handleTransactionSubmit} transaction={selectedTransaction} accounts={accounts} cards={cards} categories={categories} isLoading={isLoading} />
            <TransactionDetailModal transaction={selectedTransaction} onClose={() => setSelectedTransaction(null)} onEdit={(tx) => {setSelectedTransaction(tx); setModal('editTransaction')}} onDelete={(id) => setTransactions(p => p.filter(t => t.id !== id))} onPay={(details) => setPayingInstallment(details)} onUnpay={(txId, instId) => {}} getInstallmentDueDate={getInstallmentDueDate} getCategoryName={getCategoryName} accounts={accounts} cards={cards} />
            <PaymentModal payingInstallment={payingInstallment} onClose={() => setPayingInstallment(null)} onConfirm={(txId, instId, amount) => {}} />
            <TransactionFilterModal isOpen={modal === 'filters'} onClose={() => setModal(null)} onApply={setFilters} onClear={() => setFilters({ description: '', categoryId: '', accountId: '', cardId: '', status: 'all', startDate: '', endDate: '' })} initialFilters={filters} accounts={accounts} cards={cards} categories={categories} />
            <Dialog open={modal === 'addRecurring' || modal === 'editRecurring'} onOpenChange={() => {setModal(null); setSelectedRecurring(null);}}><DialogContent><DialogHeader><DialogTitle>{modal === 'editRecurring' ? 'Editar' : 'Adicionar'} Recorrência</DialogTitle></DialogHeader><RecurringForm recurringItem={selectedRecurring} onAdd={(item) => {setRecurring(p=>[...p, {...item, id: Date.now().toString()}]); setModal(null);}} onUpdate={(item) => {setRecurring(p=>p.map(r=>r.id===item.id?item:r)); setModal(null);}} accounts={accounts} cards={cards} categories={categories} onClose={() => setModal(null)} isLoading={isLoading}/></DialogContent></Dialog>
            <Dialog open={modal === 'addTransfer' || modal === 'editTransfer'} onOpenChange={() => {setModal(null); setSelectedTransfer(null);}}><DialogContent><DialogHeader><DialogTitle>{modal === 'editTransfer' ? 'Editar' : 'Nova'} Transferência</DialogTitle></DialogHeader><TransferForm accounts={accounts} transfer={selectedTransfer} onTransfer={onAddTransfer} onUpdate={(t) => {setTransfers(p=>p.map(tr=>tr.id===t.id?t:tr)); setModal(null)}} onDismiss={() => setModal(null)} onError={addToast} isLoading={isLoading}/></DialogContent></Dialog>
            <Dialog open={modal === 'accounts'} onOpenChange={() => setModal(null)}><DialogContent><DialogHeader><DialogTitle>Contas</DialogTitle></DialogHeader><AccountList accounts={accounts} setAccounts={setAccounts} adjustAccountBalance={adjustAccountBalance} setTransactions={setTransactions} addToast={addToast} onConfirmDelete={(acc) => {}} /><AccountForm setAccounts={setAccounts} setTransactions={setTransactions} /></DialogContent></Dialog>
            <Dialog open={modal === 'cards'} onOpenChange={() => setModal(null)}><DialogContent><DialogHeader><DialogTitle>Cartões</DialogTitle></DialogHeader><CardList cards={cards} setCards={setCards} transactions={transactions} addToast={addToast} onConfirmDelete={(c) => {}} accounts={accounts}/><CardForm setCards={setCards} accounts={accounts} addToast={addToast}/></DialogContent></Dialog>
            <Dialog open={modal === 'categories'} onOpenChange={() => setModal(null)}><DialogContent className="max-h-[90vh] flex flex-col"><DialogHeader><DialogTitle>Categorias</DialogTitle></DialogHeader><CategoryManager categories={categories} setCategories={setCategories} transactions={transactions} recurring={recurring} /></DialogContent></Dialog>
            <ImportTransactionsModal isOpen={modal === 'import'} onClose={() => setModal(null)} accounts={accounts} onConfirmImport={(txs) => {}} addToast={addToast} isLoading={isLoading} />

            {/* Global UI */}
            {ownerProfile && <YaraChat 
                subscription={subscription} 
                yaraUsage={yaraUsage} 
                incrementYaraUsage={() => setYaraUsage(p => ({...p, count: p.count+1}))}
                onUpgradeClick={() => setCurrentPage('subscription')}
            />}
            {showOnboarding && <OnboardingTour onComplete={() => {setShowOnboarding(false); setOnboardingCompleted();}} />}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </div>
    );
};

export default App;