import React, { useState, useEffect } from 'react';
import { Transaction, Account, Card, Category } from '../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { buildInstallments } from '../../utils/helpers';
import { transactionSchema } from '../../utils/validation';

// FIX: Added an interface for the form state to prevent type inference issues.
interface TransactionFormData {
  desc: string;
  amount: string;
  date: string;
  installments: number;
  type: 'cash' | 'card' | 'prazo';
  isIncome: boolean;
  categoryId: string;
  person: string;
  reminderDaysBefore: string;
}

interface TransactionFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (transaction: Transaction) => void;
  transaction: Transaction | null;
  accounts: Account[];
  cards: Card[];
  categories: Category[];
  isLoading: boolean;
}

const TransactionForm: React.FC<TransactionFormProps> = ({ isOpen, onClose, onSubmit, transaction, accounts, cards, categories, isLoading }) => {
  // FIX: Used the TransactionFormData interface to correctly type the form state.
  const [form, setForm] = useState<TransactionFormData>({ desc: '', amount: '', date: new Date().toISOString().slice(0, 10), installments: 1, type: 'card', isIncome: false, categoryId: '', person: '', reminderDaysBefore: '' });
  const [selectedAccount, setSelectedAccount] = useState(accounts.find(a=>a.isDefault)?.id || accounts[0]?.id || '');
  const [selectedCard, setSelectedCard] = useState(cards.find(c=>c.isDefault)?.id || cards[0]?.id || '');
  const [validationErrors, setValidationErrors] = useState<Record<string, string[]>>({});
  
  const isCardExpense = form.type === 'card' && !form.isIncome;

  useEffect(() => {
    if (transaction) {
      setForm({
        desc: transaction.desc,
        amount: transaction.amount.toString(),
        date: transaction.date,
        installments: transaction.installments,
        type: transaction.type,
        isIncome: transaction.isIncome,
        categoryId: transaction.categoryId || '',
        person: transaction.person || '',
        reminderDaysBefore: transaction.reminderDaysBefore?.toString() || '',
      });
      setSelectedAccount(transaction.account);
      setSelectedCard(transaction.card || (cards.find(c=>c.isDefault)?.id || cards[0]?.id || ''));
    } else {
      setForm({ desc: '', amount: '', date: new Date().toISOString().slice(0, 10), installments: 1, type: 'card', isIncome: false, categoryId: '', person: '', reminderDaysBefore: '' });
      setSelectedAccount(accounts.find(a=>a.isDefault)?.id || accounts[0]?.id || '');
      setSelectedCard(cards.find(c=>c.isDefault)?.id || cards[0]?.id || '');
    }
  }, [transaction, isOpen, accounts, cards]);
  
  useEffect(() => {
    if (isCardExpense && selectedCard) {
        const cardData = cards.find(c => c.id === selectedCard);
        if (cardData) {
            setSelectedAccount(cardData.accountId);
        }
    }
  }, [isCardExpense, selectedCard, cards]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    
    // Validate using Zod schema
    const validation = transactionSchema.safeParse({
      description: form.desc,
      amount: amount,
      date: form.date,
      person: form.person || undefined,
    });

    if (!validation.success) {
      setValidationErrors(validation.error.flatten().fieldErrors);
      return;
    }

    setValidationErrors({});

    const installmentsCount = form.type === 'cash' ? 1 : form.installments;
    const schedule = buildInstallments(form.date, amount, installmentsCount);
    
    if (form.isIncome || form.type === 'cash') {
      schedule.forEach(s => { s.paid = true; s.paymentDate = form.date; s.paidAmount = s.amount; });
    }

    const tx: Transaction = {
      ...(transaction || { id: Date.now().toString() }),
      ...form,
      amount,
      installments: installmentsCount,
      person: form.type === 'prazo' ? form.person || null : null,
      account: selectedAccount,
      card: isCardExpense ? selectedCard : null,
      installmentsSchedule: schedule,
      paid: schedule.every(s => s.paid),
      reminderDaysBefore: form.reminderDaysBefore ? parseInt(form.reminderDaysBefore, 10) : null,
    };
    onSubmit(tx);
  };

  const handleTypeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newType = e.target.value as 'card' | 'cash' | 'prazo';
    setForm(f => ({
      ...f,
      type: newType,
      installments: newType === 'cash' ? 1 : (f.installments > 1 ? f.installments : 1),
    }));
  };
  
  const groupedCategories = categories.reduce((acc, cat) => {
    const group = cat.group || 'Outros';
    if (!acc[group]) acc[group] = [];
    acc[group].push(cat);
    return acc;
  }, {} as Record<string, Category[]>);

  const expenseLabel = form.type === 'card' ? 'Despesa' : 'Despesa';
  const incomeLabel = form.type === 'card' ? 'Cashback/desconto' : 'Receita';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>{transaction ? 'Editar' : 'Adicionar'} Transação</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
            <div className="space-y-1">
              <Label htmlFor="desc">Descrição</Label>
              <Input id="desc" value={form.desc} onChange={e=>setForm(f=>({...f, desc: e.target.value}))}/>
              {validationErrors.description && (
                <p className="text-sm text-red-600">{validationErrors.description[0]}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="amount">Valor</Label>
                <Input id="amount" type="number" min="0" step="0.01" value={form.amount} onChange={e=>setForm(f=>({...f, amount: e.target.value}))}/>
                {validationErrors.amount && (
                  <p className="text-sm text-red-600">{validationErrors.amount[0]}</p>
                )}
              </div>
              <div className="space-y-1">
                <Label htmlFor="date">Data da Compra</Label>
                <Input id="date" type="date" value={form.date} onChange={e=>setForm(f=>({...f, date: e.target.value}))}/>
                {validationErrors.date && (
                  <p className="text-sm text-red-600">{validationErrors.date[0]}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="isIncome">Finalidade</Label>
                <select
                    id="isIncome"
                    value={form.isIncome ? 'receita' : 'despesa'}
                    onChange={(e) => setForm(f => ({ ...f, isIncome: e.target.value === 'receita' }))}
                    className="w-full p-2 h-10 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
                >
                    <option value="despesa">{expenseLabel}</option>
                    <option value="receita">{incomeLabel}</option>
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="type">Tipo</Label>
                <select id="type" value={form.type} onChange={handleTypeChange} className="w-full p-2 h-10 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700">
                    <option value="card">Cartão de Crédito</option>
                    <option value="cash">À Vista / Débito</option>
                    <option value="prazo">A Prazo (Boleto/Carnê)</option>
                </select>
              </div>
            </div>
            
            {isCardExpense && (
              <div className="space-y-1">
                <Label htmlFor="card">Cartão</Label>
                <select id="card" value={selectedCard} onChange={e => setSelectedCard(e.target.value)} className="w-full p-2 h-10 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700">
                  {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            )}
            
            {form.type === 'prazo' && (
              <div className="space-y-1">
                <Label htmlFor="person">{form.isIncome ? 'Devedor' : 'Credor'}</Label>
                <Input
                  id="person"
                  value={form.person}
                  onChange={e => setForm(f => ({ ...f, person: e.target.value }))}
                  placeholder={form.isIncome ? 'Ex: Cliente A' : 'Ex: Loja B'}
                />
                {validationErrors.person && (
                  <p className="text-sm text-red-600">{validationErrors.person[0]}</p>
                )}
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="account">Conta</Label>
                <select id="account" value={selectedAccount} onChange={e => setSelectedAccount(e.target.value)} className="w-full p-2 h-10 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700" disabled={isCardExpense}>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>

              {(form.type === 'card' || form.type === 'prazo') && (
                <div className="space-y-1">
                  <Label htmlFor="installments">Parcelas</Label>
                  <Input id="installments" type="number" min="1" value={form.installments} onChange={e=>setForm(f=>({...f, installments: parseInt(e.target.value) || 1}))}/>
                </div>
              )}
            </div>
            
            <div className="space-y-1">
              <Label htmlFor="category">Categoria</Label>
              <select id="category" value={form.categoryId} onChange={e => setForm(f => ({ ...f, categoryId: e.target.value }))} className="w-full p-2 h-10 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700">
                <option value="">Nenhuma</option>
                {Object.keys(groupedCategories).sort().map(group => (
                  <optgroup label={group} key={group}>
                    {groupedCategories[group].map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </optgroup>
                ))}
              </select>
            </div>
            
            {!form.isIncome && (form.type === 'card' || form.type === 'prazo') && (
               <div className="p-3 bg-slate-100 dark:bg-slate-800/50 rounded-md">
                 <Label htmlFor="reminderDaysBefore">Lembrete (Opcional)</Label>
                 <div className="flex items-center gap-2 mt-1">
                   <span>Lembrar-me</span>
                   <Input 
                     id="reminderDaysBefore" 
                     type="number"
                     min="1"
                     className="w-20 text-center"
                     value={form.reminderDaysBefore}
                     onChange={(e) => setForm(f => ({ ...f, reminderDaysBefore: e.target.value }))}
                   />
                   <span>dias antes do vencimento.</span>
                 </div>
               </div>
            )}

            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button type="submit" loading={isLoading}>Salvar</Button>
            </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionForm;