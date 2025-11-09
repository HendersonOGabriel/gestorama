import React from 'react';
import { RecurringItem, Account, Card, Category } from '../../types';
import { toCurrency, displayDate } from '../../utils/helpers';
import { Button } from '../ui/Button';
import { Edit3, Trash2, Repeat, Plus } from 'lucide-react';

interface RecurringListProps {
  recurring: RecurringItem[];
  onAdd: () => void;
  onEdit: (item: RecurringItem) => void;
  onUpdate: (item: RecurringItem) => void;
  onRemove: (id: string) => void;
  accounts: Account[];
  cards: Card[];
  categories: Category[];
}

const RecurringList: React.FC<RecurringListProps> = ({ recurring, onAdd, onEdit, onUpdate, onRemove, accounts, cards, categories }) => {
  if (recurring.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="flex flex-col items-center gap-2 text-slate-500">
          <Repeat className="w-12 h-12" />
          <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-200 mt-2">Nenhuma recorrência cadastrada</h3>
          <p className="text-sm">Adicione despesas ou receitas fixas como aluguel e assinaturas.</p>
          <Button onClick={onAdd} size="sm" className="mt-4">
            <Plus className="w-4 h-4 mr-1.5" /> Adicionar Recorrência
          </Button>
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-3">
      {recurring.map(item => (
        <div key={item.id} className="p-3 border rounded-lg dark:border-slate-700">
          <div className="flex justify-between items-center">
            <div>
              <span className="font-medium">{item.desc}</span>
              <div className={item.isIncome ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"}>{toCurrency(item.amount)}</div>
              <div className="text-xs text-slate-500 dark:text-slate-400">Todo dia {item.day} • Próxima: {displayDate(item.nextRun)}</div>
            </div>
            <div className="flex items-center gap-1">
                <Button size="icon" variant="ghost" className="h-8 w-8" title="Editar" onClick={() => onEdit(item)}>
                    <Edit3 className="w-4 h-4" />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" title="Excluir" onClick={() => onRemove(item.id)}>
                    <Trash2 className="w-4 h-4" />
                </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default RecurringList;