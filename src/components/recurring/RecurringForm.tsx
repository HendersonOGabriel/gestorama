import React, { useState, useEffect, useMemo } from 'react';
import { RecurringItem, Account, Card, Category } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { XP_VALUES } from '../../services/gamificationService';
import { recurringSchema } from '../../utils/validation';

interface RecurringFormProps {
  recurringItem?: RecurringItem | null;
  onAdd: (item: Omit<RecurringItem, 'id'>) => void;
  onUpdate: (item: RecurringItem) => void;
  accounts: Account[];
  cards: Card[];
  categories: Category[];
  onClose: () => void;
  isLoading: boolean;
  addXp: (amount: number) => void;
}

const RecurringForm: React.FC<RecurringFormProps> = ({ recurringItem, onAdd, onUpdate, accounts, cards, categories, onClose, isLoading, addXp }) => {
    const [desc, setDesc] = useState('');
    const [amount, setAmount] = useState('');
    const [day, setDay] = useState(new Date().getDate().toString());
    const [type, setType] = useState<'cash' | 'card'>('cash');
    const [isIncome, setIsIncome] = useState(false);
    const [account, setAccount] = useState(accounts.find(a => a.isDefault)?.id || accounts[0]?.id || '');
    const [card, setCard] = useState(cards.find(c => c.isDefault)?.id || cards[0]?.id || '');
    const [categoryId, setCategoryId] = useState('');
    
    const isCardTransaction = type === 'card';

    useEffect(() => {
        if (recurringItem) {
            setDesc(recurringItem.desc);
            setAmount(recurringItem.amount.toString());
            setDay(recurringItem.day.toString());
            setType(recurringItem.type);
            setIsIncome(recurringItem.isIncome);
            setAccount(recurringItem.account);
            setCard(recurringItem.card || (cards.find(c => c.isDefault)?.id || cards[0]?.id || ''));
            setCategoryId(recurringItem.categoryId || '');
        } else {
            setDesc('');
            setAmount('');
            setDay(new Date().getDate().toString());
            setType('cash');
            setIsIncome(false);
            setAccount(accounts.find(a => a.isDefault)?.id || accounts[0]?.id || '');
            setCard(cards.find(c => c.isDefault)?.id || cards[0]?.id || '');
            setCategoryId('');
        }
    }, [recurringItem, accounts, cards]);

    useEffect(() => {
        if (isCardTransaction && card) {
            const selectedCardData = cards.find(c => c.id === card);
            if (selectedCardData) {
                setAccount(selectedCardData.accountId);
            }
        }
    }, [isCardTransaction, card, cards]);


    const groupedCategories = useMemo(() => {
        return categories.reduce((acc, cat) => {
          const group = cat.group || 'Outros';
          if (!acc[group]) acc[group] = [];
          acc[group].push(cat);
          return acc;
        }, {} as Record<string, Category[]>);
    }, [categories]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validate with Zod schema
        const validation = recurringSchema.safeParse({
            desc,
            amount: parseFloat(amount),
            day: parseInt(day)
        });
        
        if (!validation.success) {
            const firstError = validation.error.issues[0];
            alert(firstError.message);
            return;
        }
        
        if (recurringItem) {
            const updatedItem: RecurringItem = {
                ...recurringItem,
                desc,
                amount: parseFloat(amount),
                day: parseInt(day),
                type,
                isIncome,
                account,
                card: isCardTransaction ? card : null,
                categoryId: categoryId || null,
            };
            onUpdate(updatedItem);
        } else {
            const dayOfMonth = parseInt(day, 10);
            const today = new Date();

            // Use UTC components of today's date to avoid timezone issues
            const year = today.getUTCFullYear();
            const month = today.getUTCMonth();
            
            // Set the first run date for the current month, even if the day has passed.
            // The service logic will handle creating the transaction immediately if needed.
            let nextRunDate = new Date(Date.UTC(year, month, dayOfMonth));
            
            onAdd({
                desc, 
                amount: parseFloat(amount), 
                day: dayOfMonth, 
                type, 
                isIncome, 
                account, 
                card: isCardTransaction ? card : null,
                categoryId: categoryId || null,
                enabled: true, 
                lastRun: null, 
                nextRun: nextRunDate.toISOString().slice(0, 10)
            });
            addXp(XP_VALUES.ADD_RECURRING);
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
            <div className="space-y-1">
                <Label>Descrição</Label>
                <Input value={desc} onChange={e => setDesc(e.target.value)} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label>Valor</Label>
                    <Input type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} />
                </div>
                <div className="space-y-1">
                    <Label>Dia do Mês</Label>
                    <Input type="number" min="1" max="31" value={day} onChange={e => setDay(e.target.value)} />
                </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label>Finalidade</Label>
                    <select value={isIncome.toString()} onChange={e => setIsIncome(e.target.value === 'true')} className="w-full p-2 h-10 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700">
                        <option value="false">Despesa</option>
                        <option value="true">Receita</option>
                    </select>
                </div>
                <div className="space-y-1">
                    <Label>Tipo</Label>
                    <select value={type} onChange={e => setType(e.target.value as any)} className="w-full p-2 h-10 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700">
                        <option value="cash">Débito / Dinheiro</option>
                        <option value="card">Cartão de Crédito</option>
                    </select>
                </div>
            </div>

            {isCardTransaction && (
                <div className="space-y-1">
                    <Label>Cartão</Label>
                    <select value={card} onChange={e => setCard(e.target.value)} className="w-full p-2 h-10 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700">
                        {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>
            )}
            
            <div className="space-y-1">
                <Label>Conta</Label>
                <select value={account} onChange={e => setAccount(e.target.value)} className="w-full p-2 h-10 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700" disabled={isCardTransaction}>
                    {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
            </div>
            
            <div className="space-y-1">
                <Label>Categoria</Label>
                <select value={categoryId} onChange={e => setCategoryId(e.target.value)} className="w-full p-2 h-10 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700">
                    <option value="">Nenhuma</option>
                    {Object.keys(groupedCategories).sort().map(group => (
                        <optgroup label={group} key={group}>
                            {groupedCategories[group].map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </optgroup>
                    ))}
                </select>
            </div>
            
            <div className="flex justify-end gap-2 pt-4">
              <Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button>
              <Button type="submit" loading={isLoading}>{recurringItem ? 'Salvar' : 'Adicionar'}</Button>
            </div>
        </form>
    );
};

export default RecurringForm;