import React, { useState } from 'react';
import { Card, Transaction, Account } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { toCurrency, cn } from '../../utils/helpers';
import { CreditCard } from 'lucide-react';

interface CardListProps {
  cards: Card[];
  setCards: React.Dispatch<React.SetStateAction<Card[]>>;
  transactions: Transaction[];
  addToast: (message: string, type?: 'error' | 'success') => void;
  onConfirmDelete: (card: Card) => void;
  accounts: Account[];
}

const CardList: React.FC<CardListProps> = ({ cards, setCards, transactions, addToast, onConfirmDelete, accounts }) => {
  const [editCard, setEditCard] = useState<Card | null>(null);

  const handleUpdate = () => {
    if (!editCard) return;
    setCards(prev => prev.map(c => c.id === editCard.id ? editCard : c));
    setEditCard(null);
  };
  
  const handleSetDefault = (id: string) => {
    setCards(prev => prev.map(card => ({ ...card, isDefault: card.id === id })));
  };

  const handleDeleteClick = (cardToDelete: Card) => {
    const hasUnpaidInvoices = transactions.some(tx => {
        if (tx.card !== cardToDelete.id || tx.isIncome) return false;
        // Check if any installment for this card transaction is unpaid
        return tx.installmentsSchedule.some(inst => !inst.paid);
    });

    if (hasUnpaidInvoices) {
        addToast("Pague todas as faturas pendentes deste cartão antes de excluí-lo.", 'error');
    } else {
        onConfirmDelete(cardToDelete);
    }
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
                  <div className="text-xs text-slate-500">Fecha: {c.closingDay} | Vence: {c.dueDay} | Limite: {toCurrency(c.limit)}</div>
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
  );
};

export default CardList;