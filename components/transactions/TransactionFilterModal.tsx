import React, { useState, useEffect, useMemo } from 'react';
import { Account, Card, Category } from '../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';

interface FilterState {
  description: string; categoryId: string; accountId: string; cardId: string; status: string; startDate: string; endDate: string;
}

interface TransactionFilterModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  onClear: () => void;
  initialFilters: FilterState;
  accounts: Account[];
  cards: Card[];
  categories: Category[];
}

const TransactionFilterModal: React.FC<TransactionFilterModalProps> = ({ isOpen, onClose, onApply, onClear, initialFilters, accounts, cards, categories }) => {
  const [filters, setFilters] = useState(initialFilters);

  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters, isOpen]);

  const handleApply = () => { onApply(filters); onClose(); };
  
  const handleClear = () => { 
    onClear(); 
    onClose(); 
  };
  
  const groupedCategories = useMemo(() => {
    return categories.reduce((acc, cat) => {
      const group = cat.group || 'Outros';
      if (!acc[group]) acc[group] = [];
      acc[group].push(cat);
      return acc;
    }, {} as Record<string, Category[]>);
  }, [categories]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Filtrar Transações</DialogTitle></DialogHeader>
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-2">
            <div className="space-y-1">
              <Label htmlFor="filter-desc">Descrição</Label>
              <Input id="filter-desc" value={filters.description} onChange={e=>setFilters(f=>({...f, description: e.target.value}))}/>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="filter-cat">Categoria</Label>
                <select id="filter-cat" value={filters.categoryId} onChange={e=>setFilters(f=>({...f, categoryId: e.target.value}))} className="w-full p-2 h-10 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700">
                  <option value="">Todas</option>
                  {Object.keys(groupedCategories).sort().map(group => (
                    <optgroup label={group} key={group}>
                      {groupedCategories[group].map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </optgroup>
                  ))}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="filter-status">Status</Label>
                <select id="filter-status" value={filters.status} onChange={e=>setFilters(f=>({...f, status: e.target.value}))} className="w-full p-2 h-10 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700">
                  <option value="all">Todos</option>
                  <option value="paid">Pago</option>
                  <option value="pending">Pendente</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label htmlFor="filter-account">Conta</Label>
                <select id="filter-account" value={filters.accountId} onChange={e=>setFilters(f=>({...f, accountId: e.target.value}))} className="w-full p-2 h-10 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700">
                  <option value="">Todas</option>
                  {accounts.map(a => <option key={a.id} value={a.id}>{a.name}</option>)}
                </select>
              </div>
              <div className="space-y-1">
                <Label htmlFor="filter-card">Cartão</Label>
                <select id="filter-card" value={filters.cardId} onChange={e=>setFilters(f=>({...f, cardId: e.target.value}))} className="w-full p-2 h-10 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700">
                  <option value="">Todos</option>
                  {cards.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label htmlFor="filter-start">Data Início</Label>
                    <Input id="filter-start" type="date" value={filters.startDate} onChange={e=>setFilters(f=>({...f, startDate: e.target.value}))}/>
                </div>
                <div className="space-y-1">
                    <Label htmlFor="filter-end">Data Fim</Label>
                    <Input id="filter-end" type="date" value={filters.endDate} onChange={e=>setFilters(f=>({...f, endDate: e.target.value}))}/>
                </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-between items-center pt-4 gap-2">
                <Button variant="ghost" onClick={handleClear} className="w-full sm:w-auto">Limpar Filtros</Button>
                <div className="flex flex-col-reverse sm:flex-row gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={onClose} className="w-full sm:w-auto">Cancelar</Button>
                    <Button onClick={handleApply} className="w-full sm:w-auto">Aplicar</Button>
                </div>
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionFilterModal;