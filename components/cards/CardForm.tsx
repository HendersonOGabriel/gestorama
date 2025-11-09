import React, { useState } from 'react';
import { Account, Card } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';

interface CardFormProps {
  setCards: React.Dispatch<React.SetStateAction<Card[]>>;
  accounts: Account[];
  addToast: (message: string, type?: 'error' | 'success') => void;
}

const CardForm: React.FC<CardFormProps> = ({ setCards, accounts, addToast }) => {
  const [name, setName] = useState('');
  const [closingDay, setClosingDay] = useState('');
  const [dueDay, setDueDay] = useState('');
  const [limit, setLimit] = useState('');
  const [accountId, setAccountId] = useState(accounts.find(a => a.isDefault)?.id || (accounts.length > 0 ? accounts[0].id : ''));


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !closingDay || !dueDay || !accountId) {
      addToast('Por favor, preencha todos os campos, incluindo a conta vinculada.', 'error');
      return;
    }
    const newCard: Omit<Card, 'id' | 'isDefault'> = { name, closingDay: parseInt(closingDay), dueDay: parseInt(dueDay), limit: parseFloat(limit) || 0, accountId };
    setCards(prev => [...prev, { ...newCard, id: Date.now().toString(), isDefault: prev.length === 0 }]);
    setName(''); setClosingDay(''); setDueDay(''); setLimit('');
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
      <Button type="submit" className="w-full">Adicionar</Button>
    </form>
  );
};

export default CardForm;