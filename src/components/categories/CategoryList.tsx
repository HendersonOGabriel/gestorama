
import React, { useState } from 'react';
import { Category, Transaction, RecurringItem } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface CategoryListProps {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  transactions: Transaction[];
  recurring: RecurringItem[];
  setAppError: (error: string | null) => void;
}

const CategoryList: React.FC<CategoryListProps> = ({ categories, setCategories, transactions, recurring, setAppError }) => {
  const [editCategory, setEditCategory] = useState<Category | null>(null);

  const canDelete = (id: string) => !transactions.some(t => t.categoryId === id) && !recurring.some(r => r.categoryId === id);

  return (
    <div className="space-y-2">
      {categories.map(c => (
        <div key={c.id} className="p-3 border rounded">
          {editCategory?.id === c.id ? (
            <div>
              <Input value={editCategory.name} onChange={e => setEditCategory({...editCategory, name: e.target.value})} />
              <Input value={editCategory.group || ''} onChange={e => setEditCategory({...editCategory, group: e.target.value})} />
              <Button onClick={() => { setCategories(p => p.map(cat => cat.id === editCategory.id ? editCategory : cat)); setEditCategory(null); }}>Salvar</Button>
            </div>
          ) : (
            <div className="flex justify-between">
              <div>{c.name} <span className="text-xs text-slate-500">{c.group}</span></div>
              <div>
                <Button size="sm" onClick={() => setEditCategory(c)}>Editar</Button>
                <Button size="sm" variant="destructive" disabled={!canDelete(c.id)} onClick={() => {if(canDelete(c.id)) setCategories(p=>p.filter(cat=>cat.id !== c.id)); else setAppError("Categoria em uso.")}}>Excluir</Button>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default CategoryList;