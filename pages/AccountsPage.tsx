import React, { useState } from 'react';
import { Account, Transaction } from '../types';
import { toCurrency, buildInstallments } from '../utils/helpers';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { PiggyBank, Plus, Edit3, Trash2 } from 'lucide-react';
import AnimatedItem from '../components/animations/AnimatedItem';

// Props combinadas de AccountList e AccountForm
interface AccountsPageProps {
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  adjustAccountBalance: (accountId: string, delta: number) => void;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  addToast: (message: string, type?: 'error' | 'success') => void;
}

const AccountsPage: React.FC<AccountsPageProps> = ({ accounts, setAccounts, adjustAccountBalance, setTransactions, addToast }) => {
  // Estado para edição de conta (da AccountList)
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [editName, setEditName] = useState('');
  const [editBalance, setEditBalance] = useState('');

  // Estado para o formulário de nova conta (da AccountForm)
  const [newName, setNewName] = useState('');
  const [newBalance, setNewBalance] = useState('');

  const handleSaveEdit = (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;

    const parsedBalance = parseFloat(editBalance);
    const delta = parsedBalance - account.balance;

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

    setAccounts(prev => prev.map(a => a.id === accountId ? {...a, name: editName, balance: parsedBalance } : a));
    setEditAccount(null);
    addToast('Conta atualizada com sucesso!', 'success');
  };

  const handleDelete = (accountToDelete: Account) => {
    if (accounts.length <= 1) {
      addToast("Não é possível excluir a última conta.", 'error');
      return;
    }
    if (accountToDelete.isDefault) {
       addToast("Não é possível excluir a conta padrão.", 'error');
      return;
    }
    setAccounts(prev => prev.filter(a => a.id !== accountToDelete.id));
    addToast('Conta excluída com sucesso!', 'success');
  };

  const handleSetDefault = (id: string) => {
    setAccounts(prev => prev.map(acc => ({ ...acc, isDefault: acc.id === id })));
    addToast('Conta definida como padrão.', 'success');
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName) {
        addToast('O nome da conta é obrigatório.', 'error');
        return;
    };

    const initialBalance = parseFloat(newBalance) || 0;
    const newAccountId = Date.now().toString();

    const newAccount: Account = {
      id: newAccountId,
      name: newName,
      balance: initialBalance,
      isDefault: false,
    };

    setAccounts(prev => {
      newAccount.isDefault = prev.length === 0;
      return [...prev, newAccount];
    });

    if (initialBalance !== 0) {
      const dateStr = new Date().toISOString().slice(0, 10);
      const adjustmentTx: Transaction = {
        id: `adj_init_${newAccountId}`,
        desc: `Saldo Inicial (${newName})`,
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

    setNewName('');
    setNewBalance('');
    addToast('Conta adicionada com sucesso!', 'success');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <AnimatedItem>
          <Card>
            <CardHeader>
              <CardTitle>Minhas Contas</CardTitle>
            </CardHeader>
            <CardContent>
              {accounts.length === 0 ? (
                <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg">
                  <div className="flex flex-col items-center gap-2 text-slate-500">
                    <PiggyBank className="w-12 h-12" />
                    <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-200 mt-2">Nenhuma conta cadastrada</h3>
                    <p className="text-sm">Use o formulário ao lado para adicionar sua primeira conta.</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {accounts.map(a => (
                    <div key={a.id} className="p-3 rounded-lg border dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50">
                      {editAccount?.id === a.id ? (
                        <div className="space-y-3">
                          <div>
                            <Label htmlFor={`edit-name-${a.id}`}>Nome da Conta</Label>
                            <Input id={`edit-name-${a.id}`} value={editName} onChange={(e) => setEditName(e.target.value)} />
                          </div>
                          <div>
                             <Label htmlFor={`edit-balance-${a.id}`}>Saldo</Label>
                             <Input id={`edit-balance-${a.id}`} type="number" value={editBalance} onChange={(e) => setEditBalance(e.target.value)} />
                          </div>
                          <div className="flex gap-2 justify-end">
                            <Button variant="ghost" onClick={() => setEditAccount(null)}>Cancelar</Button>
                            <Button onClick={() => handleSaveEdit(a.id)}>Salvar</Button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                          <div>
                            <span className="font-medium">
                              {a.name} {a.isDefault && <span className="ml-2 text-xs font-normal px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full dark:bg-indigo-900/50 dark:text-indigo-300">Padrão</span>}
                            </span>
                            <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">{toCurrency(a.balance)}</div>
                          </div>
                          <div className="flex flex-wrap gap-2 justify-end self-end sm:self-center">
                            <Button size="sm" variant="outline" onClick={() => {setEditAccount(a); setEditName(a.name); setEditBalance(a.balance.toString())}}><Edit3 className="w-4 h-4 mr-1.5"/>Editar</Button>
                            <Button size="sm" variant="ghost" disabled={a.isDefault} onClick={() => handleSetDefault(a.id)}>Definir como Padrão</Button>
                            <Button size="sm" variant="destructive" onClick={() => handleDelete(a)} disabled={a.isDefault}><Trash2 className="w-4 h-4 mr-1.5"/>Excluir</Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </AnimatedItem>
      </div>

      <div className="lg:col-span-1">
        <AnimatedItem delay={100}>
            <Card>
                <CardHeader><CardTitle>Adicionar Nova Conta</CardTitle></CardHeader>
                <CardContent>
                    <form onSubmit={handleAddSubmit} className="space-y-4">
                        <div>
                            <Label htmlFor="new-acc-name">Nome da Conta</Label>
                            <Input id="new-acc-name" value={newName} onChange={e => setNewName(e.target.value)} placeholder="Ex: Carteira" />
                        </div>
                        <div>
                            <Label htmlFor="new-acc-balance">Saldo Inicial (Opcional)</Label>
                            <Input id="new-acc-balance" type="number" value={newBalance} onChange={e => setNewBalance(e.target.value)} placeholder="0.00" />
                        </div>
                        <Button type="submit" className="w-full"><Plus className="w-4 h-4 mr-2"/>Adicionar Conta</Button>
                    </form>
                </CardContent>
            </Card>
        </AnimatedItem>
      </div>
    </div>
  );
};

export default AccountsPage;
