import React, { useState } from 'react';
import { Account, Transaction } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { buildInstallments } from '../../utils/helpers';

interface AccountFormProps {
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
}

const AccountForm: React.FC<AccountFormProps> = ({ setAccounts, setTransactions }) => {
  const [name, setName] = useState('');
  const [balance, setBalance] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    
    const initialBalance = parseFloat(balance) || 0;
    const newAccountId = Date.now().toString();

    const newAccount: Account = {
      id: newAccountId,
      name,
      balance: initialBalance,
      isDefault: false, // Will be determined inside setAccounts
    };

    setAccounts(prev => {
      newAccount.isDefault = prev.length === 0;
      return [...prev, newAccount];
    });

    if (initialBalance !== 0) {
      const dateStr = new Date().toISOString().slice(0, 10);
      const adjustmentTx: Transaction = {
        id: `adj_init_${newAccountId}`,
        desc: `Saldo Inicial (${name})`,
        amount: Math.abs(initialBalance),
        date: dateStr,
        installments: 1,
        type: 'cash',
        isIncome: initialBalance > 0,
        person: 'Ajuste Interno',
        account: newAccountId,
        card: null,
        categoryId: null,
        installmentsSchedule: [{ ...buildInstallments(dateStr, Math.abs(initialBalance), 1)[0], paid: true, paymentDate: dateStr, paidAmount: Math.abs(initialBalance) }],
        paid: true,
      };
      setTransactions(prev => [adjustmentTx, ...prev]);
    }

    setName(''); setBalance('');
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 p-4 border-t space-y-3">
      <h4 className="font-semibold">Adicionar Conta</h4>
      <Label>Nome da Conta</Label><Input value={name} onChange={e => setName(e.target.value)} />
      <Label>Saldo Inicial</Label><Input type="number" min="0" value={balance} onChange={e => setBalance(e.target.value)} />
      <Button type="submit" className="w-full">Adicionar</Button>
    </form>
  );
};

export default AccountForm;