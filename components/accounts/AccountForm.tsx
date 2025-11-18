import React, { useState } from 'react';
import { Account, Transaction } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { buildInstallments } from '../../utils/helpers';
import { supabase } from '@/src/integrations/supabase/client';
import { accountSchema } from '../../utils/validation';

import { XP_VALUES } from '../../services/gamificationService';

interface AccountFormProps {
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  userId: string;
  addToast: (message: string, type?: 'error' | 'success') => void;
  addXp: (amount: number) => void;
}

const AccountForm: React.FC<AccountFormProps> = ({ setAccounts, setTransactions, userId, addToast, addXp }) => {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    
    const initialBalance = parseFloat(balance) || 0;

    // Validate input
    const validation = accountSchema.safeParse({ name, balance: initialBalance });
    if (!validation.success) {
      const firstError = validation.error.issues[0];
      addToast(firstError.message, 'error');
      return;
    }
    
    setIsSubmitting(true);

    try {
      // Check if this will be the first account
      const { data: existingAccounts } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', userId);
      
      const isFirstAccount = !existingAccounts || existingAccounts.length === 0;

      // Create account in Supabase
      const { data: newAccount, error: accountError } = await supabase
        .from('accounts')
        .insert({
          name,
          balance: initialBalance,
          is_default: isFirstAccount,
          user_id: userId
        })
        .select()
        .single();

      if (accountError) throw accountError;

      // Create initial balance transaction if needed
      if (initialBalance !== 0 && newAccount) {
        const dateStr = new Date().toISOString().slice(0, 10);
        
        const { data: newTx, error: txError } = await supabase
          .from('transactions')
          .insert({
            description: `Saldo Inicial (${name})`,
            amount: Math.abs(initialBalance),
            date: dateStr,
            installments: 1,
            type: 'cash',
            is_income: initialBalance > 0,
            person: 'Ajuste Interno',
            account_id: newAccount.id,
            card_id: null,
            category_id: null,
            paid: true,
            user_id: userId
          })
          .select()
          .single();

        if (txError) throw txError;

        // Create installment record
        if (newTx) {
          const installment = buildInstallments(dateStr, Math.abs(initialBalance), 1)[0];
          await supabase.from('installments').insert({
            transaction_id: newTx.id,
            installment_number: installment.installmentNumber,
            amount: installment.amount,
            posting_date: installment.postingDate,
            paid: true,
            payment_date: dateStr,
            paid_amount: Math.abs(initialBalance)
          });
        }
      }

      addToast('Conta adicionada com sucesso!', 'success');
      addXp(XP_VALUES.ADD_ACCOUNT);
      setName('');
      setBalance('');
    } catch (error) {
      console.error('Erro ao criar conta:', error);
      addToast('Erro ao adicionar conta. Tente novamente.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 border-t space-y-3">
      <h4 className="font-semibold">Adicionar Conta</h4>
      <Label>Nome da Conta</Label><Input value={name} onChange={e => setName(e.target.value)} />
      <Label>Saldo Inicial</Label><Input type="number" min="0" value={balance} onChange={e => setBalance(e.target.value)} />
      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Adicionando...' : 'Adicionar'}
      </Button>
    </form>
  );
};

export default AccountForm;