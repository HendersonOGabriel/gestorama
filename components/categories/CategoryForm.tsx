import React, { useState } from 'react';
import { Category } from '../../types';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';

interface CategoryFormProps {
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
  existingGroups: string[];
}

const CategoryForm: React.FC<CategoryFormProps> = ({ setCategories, existingGroups }) => {
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;
    setCategories(prev => [...prev, { id: Date.now().toString(), name, group: group || null }]);
    setName(''); setGroup('');
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <h4 className="font-semibold mb-2">Adicionar Nova Categoria</h4>
      <div>
        <Label htmlFor="new-cat-name">Nome da Categoria</Label>
        <Input id="new-cat-name" value={name} onChange={e => setName(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="new-cat-group">Grupo</Label>
        <select 
          id="new-cat-group"
          value={group} 
          onChange={e => setGroup(e.target.value)} 
          className="w-full p-2 h-10 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"
        >
          <option value="">Selecione um grupo</option>
          {existingGroups.map(g => <option key={g} value={g}>{g}</option>)}
        </select>
      </div>
      <Button type="submit" className="w-full">Adicionar Categoria</Button>
    </form>
  );
};

export default CategoryForm;