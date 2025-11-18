
import React, { useMemo } from 'react';
import { Category } from '../../types';

interface GroupListProps {
  categories: Category[];
  setCategories: React.Dispatch<React.SetStateAction<Category[]>>;
}

const GroupList: React.FC<GroupListProps> = ({ categories, setCategories }) => {
  const groups = useMemo(() => Array.from(new Set(categories.map(c => c.group || 'Sem Grupo'))).sort(), [categories]);

  return (
    <div className="space-y-2">
      {groups.map(group => <div key={group} className="p-2 border rounded">{group}</div>)}
    </div>
  );
};

export default GroupList;