import React, { useState } from 'react';
import { Account, Transaction } from '@/types';
import { toCurrency } from '@/utils/helpers';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { buildInstallments } from '@/utils/helpers';
import { PiggyBank } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/Dialog';

interface AccountListProps {
  accounts: Account[];
  setAccounts: React.Dispatch<React.SetStateAction<Account[]>>;
  adjustAccountBalance: (accountId: string, delta: number) => void;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  addToast: (message: string, type?: 'error' | 'success') => void;
  onConfirmDelete: (account: Account) => void;
  userId: string;
  transactions: Transaction[];
  onDataNeedsRefresh: () => void;
}

const AccountList: React.FC<AccountListProps> = ({ accounts, setAccounts, adjustAccountBalance, setTransactions, addToast, onConfirmDelete, userId, transactions, onDataNeedsRefresh }) => {
  const [editAccount, setEditAccount] = useState<Account | null>(null);
  const [editName, setEditName] = useState('');
  const [editBalance, setEditBalance] = useState('');
  const [accountToDelete, setAccountToDelete] = useState<Account | null>(null);
  const [newAccountId, setNewAccountId] = useState('');

  const handleSaveEdit = async (accountId: string) => {
    const account = accounts.find(a => a.id === accountId);
    if (!account) return;

    const newBalance = parseFloat(editBalance);
    const delta = newBalance - account.balance;

    try {
      // 1. Update account name
      if (editName !== account.name) {
        const { error: updateError } = await supabase
          .from('accounts')
          .update({ name: editName })
          .eq('id', accountId);
        if (updateError) throw updateError;
      }

      // 2. Create balance adjustment transfer if balance has changed
      if (delta !== 0) {
        const isIncome = delta > 0;
        
        // Create a transaction record for "Internal Adjustment"
        const dateStr = new Date().toISOString().slice(0, 10);

        const { data: newTx, error: txError } = await supabase
          .from('transactions')
          .insert({
            description: 'Ajuste de Saldo',
            amount: Math.abs(delta),
            date: dateStr,
            installments: 1,
            type: 'cash',
            is_income: isIncome,
            person: 'Ajuste Interno',
            account_id: accountId,
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
          const installment = buildInstallments(dateStr, Math.abs(delta), 1)[0];
          const { error: instError } = await supabase
            .from('installments')
            .insert({
              transaction_id: newTx.id,
              installment_number: installment.installmentNumber,
              amount: installment.amount,
              posting_date: installment.postingDate,
              paid: true,
              payment_date: dateStr,
              paid_amount: Math.abs(delta)
            });

          if (instError) throw instError;
        }

        // Directly update the account's balance
        const { error: balanceError } = await supabase
          .from('accounts')
          .update({ balance: account.balance + delta })
          .eq('id', accountId);

        if (balanceError) throw balanceError;
      }

      addToast('Conta atualizada com sucesso!', 'success');
      setEditAccount(null);
      onDataNeedsRefresh(); // This will refetch all data and update the UI

    } catch (error: any) {
      console.error('Erro ao editar conta:', error);
      addToast(error.message || 'Erro ao atualizar conta. Tente novamente.', 'error');
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      // Unset all defaults first
      await supabase
        .from('accounts')
        .update({ is_default: false })
        .eq('user_id', userId);

      // Set new default
      const { error } = await supabase
        .from('accounts')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;

      addToast('Conta padrão atualizada!', 'success');
    } catch (error) {
      console.error('Erro ao definir conta padrão:', error);
      addToast('Erro ao definir conta padrão.', 'error');
    }
  };

  const handleDeleteClick = (account: Account) => {
    const hasTransactions = transactions.some(t => t.account === account.id);
    if (hasTransactions) {
      setAccountToDelete(account);
      setNewAccountId(accounts.find(a => a.id !== account.id)?.id || '');
    } else {
      handleConfirmDelete(account.id, null);
    }
  };

  const handleConfirmDelete = async (accountId: string, newAccId: string | null) => {
    try {
      if (newAccId) {
        // Re-associate transactions to new account
        const { error: updateError } = await supabase
          .from('transactions')
          .update({ account_id: newAccId })
          .eq('account_id', accountId);

        if (updateError) throw updateError;
      }

      // Delete account
      const { error: deleteError } = await supabase
        .from('accounts')
        .delete()
        .eq('id', accountId);

      if (deleteError) throw deleteError;

      addToast('Conta excluída com sucesso!', 'success');
      setAccountToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir conta:', error);
      addToast('Erro ao excluir conta. Tente novamente.', 'error');
    }
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
    <>
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
                    handleDeleteClick(a);
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

      {/* Modal de Re-associação de Transações */}
      {accountToDelete && (
        <Dialog open={!!accountToDelete} onOpenChange={() => setAccountToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir Conta</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>A conta "{accountToDelete.name}" possui transações associadas.</p>
              <p>Selecione outra conta para transferir essas transações:</p>
              <Label>Nova Conta</Label>
              <select 
                value={newAccountId} 
                onChange={(e) => setNewAccountId(e.target.value)}
                className="w-full p-2 h-10 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
              >
                <option value="">Selecione uma conta</option>
                {accounts.filter(a => a.id !== accountToDelete.id).map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setAccountToDelete(null)}>Cancelar</Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleConfirmDelete(accountToDelete.id, newAccountId)}
                  disabled={!newAccountId}
                >
                  Confirmar Exclusão
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default AccountList;