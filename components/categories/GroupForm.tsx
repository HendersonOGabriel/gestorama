import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';

interface GroupFormProps {
  existingGroups: string[];
  onGroupAdded: (newGroup: string) => void;
}

const GroupForm: React.FC<GroupFormProps> = ({ existingGroups, onGroupAdded }) => {
  const [newGroupName, setNewGroupName] = useState('');

  const handleAddGroup = (e: React.FormEvent) => {
    e.preventDefault();
    if (newGroupName && !existingGroups.includes(newGroupName)) {
      onGroupAdded(newGroupName);
      setNewGroupName('');
    }
  };

  return (
    <form onSubmit={handleAddGroup} className="space-y-3">
      <h4 className="font-semibold">Adicionar Novo Grupo</h4>
      <div>
        <Label htmlFor="new-group-name">Nome do Grupo</Label>
        <Input
          id="new-group-name"
          value={newGroupName}
          onChange={e => setNewGroupName(e.target.value)}
          placeholder="Ex: Moradia"
        />
      </div>
      <Button type="submit" className="w-full">Adicionar Grupo</Button>
    </form>
  );
};

export default GroupForm;