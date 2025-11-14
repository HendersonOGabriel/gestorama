import React, { useMemo, useState } from 'react';
import { Plus, Edit3, DollarSign, Landmark, Trash2, X, ChevronLeft, ChevronRight, Target } from 'lucide-react';
import { Category, Goal, Account, Transaction } from '../types';
import { toCurrency, cn, displayMonthYear, monthKey, addMonths } from '../utils/helpers';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/Dialog';

interface BudgetSectionProps {
  categories: Category[];
  budgets: Record<string, number>;
  onSetBudget: (categoryId: string, amount: number) => void;
  transactions: Transaction[];
  viewingMonth: Date;
  onMonthChange: (newMonth: Date) => void;
}

const BudgetSection: React.FC<BudgetSectionProps> = ({ categories, budgets, onSetBudget, transactions, viewingMonth, onMonthChange }) => {
    const [editingCatId, setEditingCatId] = useState<string | null>(null);
    const [tempBudgetValue, setTempBudgetValue] = useState("");

    const spentThisMonth = useMemo(() => {
        const selectedMonthKey = monthKey(viewingMonth);
        const spent: Record<string, number> = {};

        transactions.forEach(tx => {
            if (tx.isIncome || !tx.categoryId) return;

            tx.installmentsSchedule.forEach(inst => {
                if (inst.paid && inst.paymentDate) {
                    const paymentMonth = monthKey(inst.paymentDate);
                    if (paymentMonth === selectedMonthKey) {
                        spent[tx.categoryId!] = (spent[tx.categoryId!] || 0) + (inst.paidAmount || inst.amount);
                    }
                }
            });
        });
        return spent;
    }, [transactions, viewingMonth]);

    const categoryGroups = useMemo(() => {
        return categories.reduce((acc, cat) => {
            const groupName = cat.group || 'Sem Grupo';
            if (!acc[groupName]) acc[groupName] = [];
            acc[groupName].push(cat);
            return acc;
        }, {} as Record<string, Category[]>);
    }, [categories]);

    const handleSaveEdit = (catId: string) => {
        onSetBudget(catId, parseFloat(tempBudgetValue) || 0);
        setEditingCatId(null);
        setTempBudgetValue("");
    };
    
    return (
        <Card className="h-fit">
            <CardHeader>
              <CardTitle>Acompanhamento de Orçamento</CardTitle>
              <div className="flex justify-between items-center mt-2">
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onMonthChange(addMonths(viewingMonth, -1))}>
                      <ChevronLeft className="w-4 h-4" />
                  </Button>
                  <h3 className="font-semibold text-center">{displayMonthYear(monthKey(viewingMonth))}</h3>
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => onMonthChange(addMonths(viewingMonth, 1))}>
                      <ChevronRight className="w-4 h-4" />
                  </Button>
              </div>
            </CardHeader>
            <CardContent>
                <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                    {Object.keys(categoryGroups).sort().map(groupName => (
                        <div key={groupName}>
                            <h4 className="font-semibold text-indigo-600 dark:text-indigo-400 mb-2">{groupName}</h4>
                            <div className="space-y-3">
                                {categoryGroups[groupName].map(cat => {
                                    const budget = budgets[cat.id] || 0;
                                    const spent = spentThisMonth[cat.id] || 0;
                                    const remaining = budget - spent;
                                    const progress = budget > 0 ? (spent / budget) * 100 : 0;
                                    const isOverBudget = spent > budget;
                                    return (
                                        <div key={cat.id} className="pb-3">
                                            {editingCatId === cat.id ? (
                                                <div className="space-y-2">
                                                    <Label htmlFor={`budget-${cat.id}`}>{cat.name}</Label>
                                                    <div className="flex items-center gap-2">
                                                        <Input id={`budget-${cat.id}`} type="number" min="0" step="0.01" value={tempBudgetValue} onChange={(e) => setTempBudgetValue(e.target.value)} />
                                                        <Button size="sm" onClick={() => handleSaveEdit(cat.id)}>Salvar</Button>
                                                        <Button size="sm" variant="ghost" onClick={() => setEditingCatId(null)}><X className="w-4 h-4" /></Button>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div>
                                                    <div className="flex justify-between items-center mb-1"><span className="font-medium text-sm truncate">{cat.name}</span><Button size="sm" variant="ghost" onClick={() => { setEditingCatId(cat.id); setTempBudgetValue(budgets[cat.id]?.toString() || ''); }}><Edit3 className="w-3 h-3 mr-1" /> Editar</Button></div>
                                                    <div className="flex justify-between items-center text-sm mb-1"><span className={isOverBudget ? "font-bold text-red-500" : ""}>{toCurrency(spent)}</span><span className="text-sm text-slate-500">/ {toCurrency(budget)}</span></div>
                                                    <div className="w-full bg-slate-200 rounded-full h-2 dark:bg-slate-700"><div className={cn("h-2 rounded-full", isOverBudget ? "bg-red-500" : "bg-indigo-600")} style={{ width: `${Math.min(100, progress)}%` }}></div></div>
                                                </div>
                                            )}
                                        </div>
                                    )
                                })}
                            </div>
                        </div>
                    ))}
                </div>
            </CardContent>
        </Card>
    );
};


interface GoalsSectionProps {
    goals: Goal[];
    accounts: Account[];
    onAddGoal: (goal: Omit<Goal, 'id'>) => void;
    onUpdateGoal: (id: string, updates: Partial<Goal>) => void;
    onRemoveGoal: (id: string) => void;
    onAddFunds: (goalId: string, amount: number, accountId: string) => void;
    onWithdrawFunds: (goalId: string, amount: number, accountId: string) => void;
    addToast: (message: string, type?: 'error' | 'success') => void;
    isLoading: boolean;
    onOpenModal: (modal: 'add' | 'edit' | 'funds' | 'withdraw', goal?: Goal) => void;
    onCloseModal: () => void;
    modalOpen: 'add' | 'edit' | 'funds' | 'withdraw' | null;
    selectedGoal: Goal | null;
}

const GoalsSection: React.FC<GoalsSectionProps> = ({
    goals, accounts, onAddGoal, onUpdateGoal, onRemoveGoal, onAddFunds, onWithdrawFunds,
    addToast, isLoading, onOpenModal, onCloseModal, modalOpen, selectedGoal
}) => {
    const [form, setForm] = useState({ name: '', targetAmount: '' });
    const [fundsAmount, setFundsAmount] = useState('');
    const [fundsAccount, setFundsAccount] = useState(accounts[0]?.id || '');

    const handleGoalSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (modalOpen === 'add') {
            const goalData = {
                name: form.name,
                targetAmount: parseFloat(form.targetAmount),
                currentAmount: 0,
            };
            onAddGoal(goalData);
        } else if (selectedGoal) {
            const goalData = {
                name: form.name,
                targetAmount: parseFloat(form.targetAmount),
            };
            onUpdateGoal(selectedGoal.id, goalData);
        }
        onCloseModal();
    };
    
    const handleFundsSubmit = (e: React.FormEvent, isWithdraw: boolean) => {
        e.preventDefault();
        if (!selectedGoal) return;
        const amount = parseFloat(fundsAmount);
        if(isWithdraw) onWithdrawFunds(selectedGoal.id, amount, fundsAccount);
        else onAddFunds(selectedGoal.id, amount, fundsAccount);
        onCloseModal();
    };

    return (
        <Card className="h-fit">
            <CardHeader className="flex justify-between items-center"><CardTitle>Metas de Poupança</CardTitle><Button size="sm" onClick={() => { setForm({name: '', targetAmount: ''}); onOpenModal('add'); }}><Plus className="w-4 h-4 mr-1"/> Nova Meta</Button></CardHeader>
            <CardContent>
                {goals.length === 0 ? (
                  <div className="text-center py-16 border-2 border-dashed rounded-lg">
                    <div className="flex flex-col items-center gap-2 text-slate-500">
                      <Target className="w-12 h-12" />
                      <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-200 mt-2">Crie sua primeira meta</h3>
                      <p className="text-sm max-w-xs mx-auto">Defina objetivos financeiros como uma viagem, um novo carro ou sua reserva de emergência.</p>
                      <Button onClick={() => { setForm({name: '', targetAmount: ''}); onOpenModal('add'); }} size="sm" className="mt-4">
                        <Plus className="w-4 h-4 mr-1.5" /> Criar Primeira Meta
                      </Button>
                    </div>
                  </div>
                ) : goals.map(goal => (
                    <div key={goal.id} className="p-4 border rounded-lg mb-4">
                        <div className="flex justify-between items-start mb-3">
                            <div className="flex-1 min-w-0"><h4 className="font-semibold truncate">{goal.name}</h4><span className="text-sm text-slate-500">Alvo: {toCurrency(goal.targetAmount)}</span></div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => { onOpenModal('funds', goal); setFundsAmount(''); }}><DollarSign className="w-4 h-4"/></Button>
                                <Button size="sm" variant="outline" onClick={() => { onOpenModal('withdraw', goal); setFundsAmount(''); }}><Landmark className="w-4 h-4"/></Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => { onOpenModal('edit', goal); setForm({ name: goal.name, targetAmount: goal.targetAmount.toString() }); }}><Edit3 className="w-4 h-4"/></Button>
                                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => onRemoveGoal(goal.id)}><Trash2 className="w-4 h-4"/></Button>
                            </div>
                        </div>
                        <div className="w-full bg-slate-200 rounded-full h-2.5 mb-1"><div className="bg-indigo-600 h-2.5 rounded-full" style={{width: `${Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)}%`}}></div></div>
                        <div>{toCurrency(goal.currentAmount)} de {toCurrency(goal.targetAmount)} ({( (goal.currentAmount / goal.targetAmount) * 100).toFixed(0)}%)</div>
                    </div>
                ))}
            </CardContent>
            
            <Dialog open={modalOpen === 'add' || modalOpen === 'edit'} onOpenChange={onCloseModal}><DialogContent>
                <DialogHeader><DialogTitle>{modalOpen === 'add' ? 'Nova Meta' : 'Editar Meta'}</DialogTitle></DialogHeader>
                <form onSubmit={handleGoalSubmit} className="space-y-4">
                    <Label>Nome</Label><Input value={form.name} onChange={e=>setForm(f=>({...f, name: e.target.value}))}/>
                    <Label>Valor Alvo</Label><Input type="number" min="0" value={form.targetAmount} onChange={e=>setForm(f=>({...f, targetAmount: e.target.value}))}/>
                    <Button type="submit" loading={isLoading}>Salvar</Button>
                </form>
            </DialogContent></Dialog>
            <Dialog open={modalOpen === 'funds' || modalOpen === 'withdraw'} onOpenChange={onCloseModal}><DialogContent>
                <DialogHeader><DialogTitle>{modalOpen === 'funds' ? 'Adicionar Fundos' : 'Resgatar Fundos'}</DialogTitle></DialogHeader>
                <form onSubmit={(e) => handleFundsSubmit(e, modalOpen === 'withdraw')} className="space-y-4">
                    <div>
                        <div className="flex justify-between items-center">
                            <Label htmlFor="funds-amount" className="mb-0">Valor</Label>
                            {modalOpen === 'withdraw' && selectedGoal && (
                                <Button 
                                    type="button" 
                                    variant="link" 
                                    size="sm" 
                                    className="p-0 h-auto"
                                    onClick={() => setFundsAmount(selectedGoal.currentAmount.toString())}
                                >
                                    Resgatar tudo
                                </Button>
                            )}
                        </div>
                        <Input id="funds-amount" type="number" min="0" value={fundsAmount} onChange={e => setFundsAmount(e.target.value)} className="mt-1"/>
                    </div>
                    <div>
                        <Label htmlFor="funds-account">Conta</Label>
                        <select 
                            id="funds-account"
                            value={fundsAccount} 
                            onChange={e => setFundsAccount(e.target.value)} 
                            className="w-full p-2 h-10 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                        >
                            {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                        </select>
                    </div>
                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="ghost" onClick={onCloseModal}>Cancelar</Button>
                        <Button type="submit" loading={isLoading}>Confirmar</Button>
                    </div>
                </form>
            </DialogContent></Dialog>
        </Card>
    );
}

interface PlanningPageProps {
  categories: Category[];
  budgets: Record<string, number>;
  setBudgets: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  goals: Goal[];
  setGoals: React.Dispatch<React.SetStateAction<Goal[]>>;
  accounts: Account[];
  adjustAccountBalance: (accountId: string, delta: number) => void;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  addToast: (message: string, type?: 'error' | 'success') => void;
  transactions: Transaction[]; // Added transactions prop
  isLoading: boolean;
  addXp: (amount: number, reason: string) => void;
  onOpenGoalModal: (modal: 'add' | 'edit' | 'funds' | 'withdraw', goal?: Goal) => void;
  onCloseGoalModal: () => void;
  goalModalOpen: 'add' | 'edit' | 'funds' | 'withdraw' | null;
  selectedGoal: Goal | null;
}

const PlanningPage: React.FC<PlanningPageProps> = ({
    categories, budgets, setBudgets, goals, setGoals, accounts, adjustAccountBalance,
    setTransactions, addToast, transactions, isLoading, addXp,
    onOpenGoalModal, onCloseGoalModal, goalModalOpen, selectedGoal
}) => {
    
    const [viewingMonth, setViewingMonth] = useState(new Date());

    const handleSetBudget = (categoryId: string, amount: number) => {
      if (!budgets[categoryId] || budgets[categoryId] === 0) {
        addXp(50, 'Novo orçamento');
      }
      setBudgets(p => ({...p, [categoryId]: amount}));
    };
    const handleAddGoal = (goal: Omit<Goal, 'id'>) => {
      setGoals(p => [{...goal, id: Date.now().toString()}, ...p]);
      addXp(100, 'Nova meta criada');
    };
    const handleUpdateGoal = (id: string, updates: Partial<Goal>) => setGoals(p => p.map(g => g.id === id ? {...g, ...updates} : g));
    const handleRemoveGoal = (id: string) => setGoals(p => p.filter(g => g.id !== id));
    
    const createGoalTransaction = (goal: Goal, amount: number, accountId: string, isWithdraw: boolean) => {
        const dateStr = new Date().toISOString().slice(0, 10);
        const newTx: Omit<Transaction, 'id'> = {
            desc: `${isWithdraw ? 'Resgate' : 'Aplicação'} Meta: ${goal.name}`,
            amount, date: dateStr, installments: 1, type: 'cash', isIncome: isWithdraw, person: 'Meta', account: accountId, card: null, categoryId: isWithdraw ? 'cat15' : 'cat6',
            installmentsSchedule: [{id: 1, amount, postingDate: dateStr, paid: true, paymentDate: dateStr, paidAmount: amount}],
            paid: true
        };
        setTransactions(p => [{...newTx, id: Date.now().toString()}, ...p]);
        adjustAccountBalance(accountId, isWithdraw ? amount : -amount);
    };

    const handleAddFunds = (goalId: string, amount: number, accountId: string) => {
        const goal = goals.find(g => g.id === goalId);
        if(!goal) return;
        
        const wasCompleted = goal.currentAmount >= goal.targetAmount;
        
        setGoals(p => p.map(g => g.id === goalId ? {...g, currentAmount: g.currentAmount + amount} : g));
        createGoalTransaction(goal, amount, accountId, false);
        addXp(25, 'Depósito na meta');

        const isNowCompleted = (goal.currentAmount + amount) >= goal.targetAmount;
        if (!wasCompleted && isNowCompleted) {
            addXp(200, 'Meta Concluída!');
        }
    };
    const handleWithdrawFunds = (goalId: string, amount: number, accountId: string) => {
        const goal = goals.find(g => g.id === goalId);
        if(!goal || amount > goal.currentAmount) { addToast("O valor de resgate não pode ser maior que o saldo atual da meta."); return; }
        setGoals(p => p.map(g => g.id === goalId ? {...g, currentAmount: g.currentAmount - amount} : g));
        createGoalTransaction(goal, amount, accountId, true);
    };

    return (
        <div className="grid grid-cols-1 gap-6">
            <BudgetSection 
              categories={categories} 
              budgets={budgets} 
              onSetBudget={handleSetBudget} 
              transactions={transactions}
              viewingMonth={viewingMonth}
              onMonthChange={setViewingMonth}
            />
            <GoalsSection
                isLoading={isLoading} goals={goals} accounts={accounts}
                onAddGoal={handleAddGoal} onUpdateGoal={handleUpdateGoal} onRemoveGoal={handleRemoveGoal}
                onAddFunds={handleAddFunds} onWithdrawFunds={handleWithdrawFunds} addToast={addToast}
                onOpenModal={onOpenGoalModal} onCloseModal={onCloseGoalModal}
                modalOpen={goalModalOpen} selectedGoal={selectedGoal}
            />
        </div>
    );
};

export default PlanningPage;