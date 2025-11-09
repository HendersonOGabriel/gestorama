import React, { useState, useEffect } from 'react';
import { Account, Transfer } from '../../types';
import { toCurrency } from '../../utils/helpers';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';

interface TransferFormProps {
  accounts: Account[];
  transfer?: Transfer | null;
  // FIX: Changed the type of onTransfer to accept a full Transfer object, as the component generates the ID.
  onTransfer: (transfer: Transfer) => void;
  onUpdate?: (transfer: Transfer) => void;
  onDismiss: () => void;
  onError: (message: string) => void;
  isLoading: boolean;
}

const TransferForm: React.FC<TransferFormProps> = ({ accounts, transfer, onTransfer, onUpdate, onDismiss, onError, isLoading }) => {
  const [fromAccount, setFromAccount] = useState(accounts[0]?.id || '');
  const [toAccount, setToAccount] = useState(accounts[1]?.id || '');
  const [amount, setAmount] = useState('');
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (transfer) {
      setFromAccount(transfer.fromAccount);
      setToAccount(transfer.toAccount);
      setAmount(transfer.amount.toString());
      setDate(transfer.date);
    } else {
      setFromAccount(accounts.find(a => a.isDefault)?.id || accounts[0]?.id || '');
      setToAccount(accounts.find(a => !a.isDefault) ? accounts.find(a => !a.isDefault)?.id : (accounts[1]?.id || ''));
      setAmount('');
      setDate(new Date().toISOString().slice(0, 10));
    }
  }, [transfer, accounts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fromAccount || !toAccount || !amount || parseFloat(amount) <= 0) {
      onError('Por favor, preencha todos os campos com valores válidos.'); return;
    }
    if (fromAccount === toAccount) {
      onError('A conta de origem e destino não podem ser as mesmas.'); return;
    }

    if (transfer && onUpdate) {
        onUpdate({ ...transfer, fromAccount, toAccount, amount: parseFloat(amount), date });
    } else {
        onTransfer({ id: Date.now().toString(), fromAccount, toAccount, amount: parseFloat(amount), date });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1">
        <Label htmlFor="fromAccount">De</Label>
        <select id="fromAccount" value={fromAccount} onChange={e => setFromAccount(e.target.value)} className="w-full p-2 h-10 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700">{accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({toCurrency(a.balance)})</option>)}</select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="toAccount">Para</Label>
        <select id="toAccount" value={toAccount} onChange={e => setToAccount(e.target.value)} className="w-full p-2 h-10 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700">{accounts.map(a => <option key={a.id} value={a.id}>{a.name} ({toCurrency(a.balance)})</option>)}</select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1">
          <Label htmlFor="amount">Valor</Label>
          <Input id="amount" type="number" min="0" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="date">Data</Label>
          <Input id="date" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="ghost" onClick={onDismiss}>Cancelar</Button>
        <Button type="submit" loading={isLoading}>{transfer ? 'Salvar' : 'Transferir'}</Button>
      </div>
    </form>
  );
};

export default TransferForm;