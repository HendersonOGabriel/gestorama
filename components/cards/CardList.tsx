import React, { useState } from 'react';
import { Card, Transaction, Account } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { toCurrency, cn } from '../../utils/helpers';
import { CreditCard } from 'lucide-react';
import { supabase } from '@/src/integrations/supabase/client';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';

interface CardListProps {
  cards: Card[];
  setCards: React.Dispatch<React.SetStateAction<Card[]>>;
  transactions: Transaction[];
  addToast: (message: string, type?: 'error' | 'success') => void;
  onConfirmDelete: (card: Card) => void;
  accounts: Account[];
  userId: string;
}

const CardList: React.FC<CardListProps> = ({ cards, setCards, transactions, addToast, onConfirmDelete, accounts, userId }) => {
  const [editCard, setEditCard] = useState<Card | null>(null);
  const [cardToDelete, setCardToDelete] = useState<Card | null>(null);
  const [newCardId, setNewCardId] = useState<string>('none');

  const handleUpdate = async () => {
    if (!editCard) return;

    try {
      const { error } = await supabase
        .from('cards')
        .update({
          name: editCard.name,
          closing_day: editCard.closingDay,
          due_day: editCard.dueDay,
          limit_amount: editCard.limit,
          account_id: editCard.accountId
        })
        .eq('id', editCard.id);

      if (error) throw error;

      addToast('Cartão atualizado com sucesso!', 'success');
      setEditCard(null);
    } catch (error) {
      console.error('Erro ao atualizar cartão:', error);
      addToast('Erro ao atualizar cartão. Tente novamente.', 'error');
    }
  };
  
  const handleSetDefault = async (id: string) => {
    try {
      // Unset all defaults first
      await supabase
        .from('cards')
        .update({ is_default: false })
        .eq('user_id', userId);

      // Set new default
      const { error } = await supabase
        .from('cards')
        .update({ is_default: true })
        .eq('id', id);

      if (error) throw error;

      addToast('Cartão padrão atualizado!', 'success');
    } catch (error) {
      console.error('Erro ao definir cartão padrão:', error);
      addToast('Erro ao definir cartão padrão.', 'error');
    }
  };

  const handleDeleteClick = (card: Card) => {
    const hasTransactions = transactions.some(tx => tx.card === card.id);
    if (hasTransactions) {
      setCardToDelete(card);
      setNewCardId('none');
    } else {
      handleConfirmDelete(card.id, 'none');
    }
  };

  const handleConfirmDelete = async (cardId: string, newCId: string) => {
    try {
      if (newCId !== 'none') {
        // Re-associate transactions to new card
        const { error: updateError } = await supabase
          .from('transactions')
          .update({ card_id: newCId })
          .eq('card_id', cardId);

        if (updateError) throw updateError;
      } else {
        // Remove card association (set to null)
        const { error: updateError } = await supabase
          .from('transactions')
          .update({ card_id: null, type: 'cash' })
          .eq('card_id', cardId);

        if (updateError) throw updateError;
      }

      // Mark card as deleted (soft delete)
      const { error: deleteError } = await supabase
        .from('cards')
        .update({ deleted: true })
        .eq('id', cardId);

      if (deleteError) throw deleteError;

      addToast('Cartão excluído com sucesso!', 'success');
      setCardToDelete(null);
    } catch (error) {
      console.error('Erro ao excluir cartão:', error);
      addToast('Erro ao excluir cartão. Tente novamente.', 'error');
    }
  };


  // Calculate available limit for each card
  const calculateAvailableLimit = (card: Card) => {
    const openInvoicesTotal = transactions
      .filter(tx => tx.card === card.id && !tx.isIncome)
      .reduce((sum, tx) => {
        const unpaidInstallments = tx.installmentsSchedule.filter(inst => !inst.paid);
        return sum + unpaidInstallments.reduce((instSum, inst) => instSum + inst.amount, 0);
      }, 0);
    
    return card.limit - openInvoicesTotal;
  };

  if (cards.length === 0) {
    return (
      <div className="text-center py-10 px-4 border-2 border-dashed rounded-lg">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <CreditCard className="w-12 h-12" />
          <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-200 mt-2">Nenhum cartão cadastrado</h3>
          <p className="text-sm">Use o formulário abaixo para adicionar seu primeiro cartão.</p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-3">
        {cards.map(c => (
        <div key={c.id} className="p-3 rounded border dark:border-slate-700">
          {editCard?.id === c.id ? (
            <div className="space-y-3">
              <div><Label>Nome do Cartão</Label><Input value={editCard.name} onChange={e => setEditCard({...editCard, name: e.target.value})} /></div>
              <div><Label>Conta Vinculada</Label>
                <select value={editCard.accountId} onChange={e => setEditCard(card => card ? {...card, accountId: e.target.value} : null)} className="w-full p-2 h-10 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700">
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-3 gap-2">
                <div><Label>Dia Fech.</Label><Input type="number" min="1" max="31" value={editCard.closingDay} onChange={e => setEditCard(card => card ? {...card, closingDay: parseInt(e.target.value) || 1} : null)} /></div>
                <div><Label>Dia Venc.</Label><Input type="number" min="1" max="31" value={editCard.dueDay} onChange={e => setEditCard(card => card ? {...card, dueDay: parseInt(e.target.value) || 1} : null)} /></div>
                <div><Label>Limite</Label><Input type="number" min="0" value={editCard.limit} onChange={e => setEditCard(card => card ? {...card, limit: parseFloat(e.target.value) || 0} : null)} /></div>
              </div>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setEditCard(null)}>Cancelar</Button>
                <Button onClick={handleUpdate}>Salvar</Button>
              </div>
            </div>
          ) : (
            <div className="flex justify-between items-center">
              <div>
                  <span className="font-medium">
                    {c.name} {c.isDefault && <span className="ml-2 text-xs font-normal px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full dark:bg-indigo-900/50 dark:text-indigo-300">Padrão</span>}
                  </span>
                  <div className="text-sm text-slate-500 dark:text-slate-400">
                    {accounts.find(a => a.id === c.accountId)?.name || 'Conta não encontrada'}
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    Fecha: {c.closingDay} | Vence: {c.dueDay}
                  </div>
                  <div className="text-xs font-medium">
                    Limite: {toCurrency(c.limit)} | Disponível: <span className={cn(calculateAvailableLimit(c) >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>{toCurrency(calculateAvailableLimit(c))}</span>
                  </div>
              </div>
              <div className="flex flex-wrap gap-2 justify-end">
                <Button size="sm" variant="outline" onClick={() => setEditCard(c)}>Editar</Button>
                <Button size="sm" variant="ghost" disabled={c.isDefault} onClick={() => handleSetDefault(c.id)}>Padrão</Button>
                <Button
                    size="sm" 
                    variant="destructive"
                    onClick={() => handleDeleteClick(c)}
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
      {cardToDelete && (
        <Dialog open={!!cardToDelete} onOpenChange={() => setCardToDelete(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Excluir Cartão</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <p>O cartão "{cardToDelete.name}" possui transações associadas.</p>
              <p>Selecione uma opção:</p>
              <Label>Nova Configuração</Label>
              <select 
                value={newCardId} 
                onChange={(e) => setNewCardId(e.target.value)}
                className="w-full p-2 h-10 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
              >
                <option value="none">Remover cartão (converter para à vista)</option>
                {cards.filter(c => c.id !== cardToDelete.id).map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <div className="flex gap-2 justify-end">
                <Button variant="ghost" onClick={() => setCardToDelete(null)}>Cancelar</Button>
                <Button 
                  variant="destructive" 
                  onClick={() => handleConfirmDelete(cardToDelete.id, newCardId)}
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

export default CardList;