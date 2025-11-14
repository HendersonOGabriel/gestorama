import React, { useState } from 'react';
import { Account, Transaction } from '../../types';
import { toCurrency } from '../../utils/helpers';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { buildInstallments } from '../../utils/helpers';
import { PiggyBank } from 'lucide-react';

interface AccountListProps {
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  adjustAccountBalance: (accountId: string, delta: number) => void;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  addToast: (message: string, type?: 'error' | 'success') => void;
  onConfirmDelete: (account: Account) => void;
}

const AccountList: React.FC<AccountListProps> = ({ accounts, setAccounts, adjustAccountBalance, setTransactions, addToast, onConfirmDelete }) => {
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [editName, setEditName] = useState('');
  const [editBalance, setEditBalance] = useState('');

  const handleSaveEdit = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;
    
    const newBalance = parseFloat(editBalance);
    const delta = newBalance - account.balance;

    if (delta !== 0) {
      const dateStr = new Date().toISOString().slice(0, 10);
      const adjustmentTx: Omit<Transaction, 'id'> = {
        desc: `Ajuste de Saldo (${editName || account.name})`,
        amount: Math.abs(delta),
        date: dateStr,
        installments: 1,
        type: 'cash',
        isIncome: delta > 0,
        person: 'Ajuste Interno',
        account: accountId,
        card: null,
        categoryId: null,
        installmentsSchedule: [{...buildInstallments(dateStr, Math.abs(delta), 1)[0], paid: true, paymentDate: dateStr, paidAmount: Math.abs(delta)}],
        paid: true
      };
      setTransactions(prev => [{...adjustmentTx, id: Date.now().toString()}, ...prev]);
      adjustAccountBalance(accountId, delta);
    }
    
    setAccounts(prev => prev.map(a => a.id === accountId ? {...a, name: editName } : a));
    setEditAccount(null);
  };

  const handleSetDefault = (id: string) => {
    setAccounts(prev => prev.map(acc => ({ ...acc, isDefault: acc.id === id })));
  };

  if (accounts.length === 0) {
    return (
      <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <PiggyBank className="w-12 h-12" />
          <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-200 mt-2">Nenhuma conta cadastrada</h3>
          <p className="text-sm">Use o formulário abaixo para adicionar sua primeira conta.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {accounts.map(a => (
        <div key={a.id} className="p-3 rounded border dark:border-slate-700">
          {editAccount?.id === a.id ? (
            <div className="space-y-3">
              <Input value={editName} onChange={(e) => setEditName(e.target.value)} />
              <Input type="number" min="0" value={editBalance} onChange={(e) => setEditBalance(e.target.value)} />
              <Button onClick={() => handleSaveEdit(a.id)}>Salvar</Button>
              <Button variant="ghost" onClick={() => setEditAccount(null)}>Cancelar</Button>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div>
                <span className="font-medium">
                  {a.name} {a.isDefault && <span className="ml-2 text-xs font-normal px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full dark:bg-indigo-900/50 dark:text-indigo-300">Padrão</span>}
                </span>
                <div className="text-sm">{toCurrency(a.balance)}</div>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={() => {setEditAccount(a); setEditName(a.name); setEditBalance(a.balance.toString())}}>Editar</Button>
                <Button size="sm" variant="ghost" disabled={a.isDefault} onClick={() => handleSetDefault(a.id)}>Padrão</Button>
                <Button 
                  size="sm" 
                  variant="destructive" 
                  onClick={() => {
                    if (accounts.length <= 1) {
                      addToast("Não é possível excluir a última conta. Deve haver pelo menos uma conta para registros.", 'error');
                      return;
                    }
                    onConfirmDelete(a);
                  }}
                >
                  Excluir
                </Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default AccountList;