import React, { useState } from 'react';
import { Account, Card } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { supabase } from '@/src/integrations/supabase/client';
import { cardSchema } from '../../utils/validation';

interface CardFormProps {
  setCards: React.Dispatch<React.SetStateAction<Card[]>>;
  accounts: Account[];
  addToast: (message: string, type?: 'error' | 'success') => void;
  userId: string;
}

const CardForm: React.FC<CardFormProps> = ({ setCards, accounts, addToast, userId }) => {
  const [name, setName] = useState('');
  const [closingDay, setClosingDay] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [limit, setLimit] = useState('');
  const [accountId, setAccountId] = useState(accounts.find(a => a.isDefault)?.id || (accounts.length > 0 ? accounts[0].id : ''));
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    const limitAmount = parseFloat(limit) || 0;
    const closingDayNum = parseInt(closingDay);
    const dueDayNum = parseInt(dueDay);

    // Validate input
    const validation = cardSchema.safeParse({
      name,
      limitAmount,
      closingDay: closingDayNum,
      dueDay: dueDayNum
    });
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      addToast(firstError.message, 'error');
      return;
    }
    
    if (!accountId) {
      addToast('Por favor, selecione uma conta vinculada.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      // Check if this will be the first card
      const { data: existingCards } = await supabase
        .from('cards')
        .select('id')
        .eq('user_id', userId);
      
      const isFirstCard = !existingCards || existingCards.length === 0;

      const { data: newCard, error } = await supabase
        .from('cards')
        .insert({
          name,
          closing_day: closingDayNum,
          due_day: dueDayNum,
          limit_amount: limitAmount,
          account_id: accountId,
          is_default: isFirstCard,
          user_id: userId
        })
        .select()
        .single();

      if (error) throw error;

      if (newCard) {
        setCards(prev => [...prev, newCard]);
      }

      addToast('Cartão adicionado com sucesso!', 'success');
      setName('');
      setClosingDay('');
      setDueDay('');
      setLimit('');
    } catch (error) {
      console.error('Erro ao criar cartão:', error);
      addToast('Erro ao adicionar cartão. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 border-t space-y-3">
      <h4 className="font-semibold">Adicionar Cartão</h4>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div><Label>Nome do Cartão</Label><Input value={name} onChange={e => setName(e.target.value)} /></div>
        <div>
          <Label>Conta Vinculada</Label>
          <select value={accountId} onChange={e => setAccountId(e.target.value)} className="w-full p-2 h-10 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700">
            {accounts.length === 0 ? (
              <option disabled>Nenhuma conta disponível</option>
            ) : (
              accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)
            )}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div><Label>Dia Fech.</Label><Input type="number" min="1" max="31" value={closingDay} onChange={e => setClosingDay(e.target.value)} /></div>
        <div><Label>Dia Venc.</Label><Input type="number" min="1" max="31" value={dueDay} onChange={e => setDueDay(e.target.value)} /></div>
        <div><Label>Limite</Label><Input type="number" min="0" value={limit} onChange={e => setLimit(e.target.value)} /></div>
      </div>
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Adicionando...' : 'Adicionar'}
      </Button>
    </form>
  );
};

export default CardForm;