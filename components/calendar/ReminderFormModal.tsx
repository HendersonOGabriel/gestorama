
import React, { useState, useEffect } from 'react';
import { Reminder } from '../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';

interface ReminderFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: Omit<Reminder, 'id'>) => void;
  onUpdate: (id: string, data: Partial<Reminder>) => void;
  onDelete: (id: string) => void;
  reminder: Reminder | null;
  selectedDateISO: string;
}

const ReminderFormModal: React.FC<ReminderFormModalProps> = ({ isOpen, onClose, onSave, onUpdate, onDelete, reminder, selectedDateISO }) => {
  const [desc, setDesc] = useState('');
  const [time, setTime] = useState('');
  const [date, setDate] = useState(selectedDateISO);

  useEffect(() => {
    if (reminder) {
      setDesc(reminder.desc);
      setTime(reminder.time || '');
      setDate(reminder.date);
    } else {
      setDesc('');
      setTime('');
      setDate(selectedDateISO);
    }
  }, [reminder, selectedDateISO, isOpen]);
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!desc) return;
    const data = { date, desc, time: time || null };
    if (reminder) onUpdate(reminder.id, data);
    else onSave(data);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>{reminder ? 'Editar' : 'Novo'} Lembrete</DialogTitle></DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <Label>Descrição</Label><Input value={desc} onChange={e=>setDesc(e.target.value)} />
          <div className="grid grid-cols-2 gap-4">
            <div><Label>Data</Label><Input type="date" value={date} onChange={e=>setDate(e.target.value)} /></div>
            <div><Label>Hora (Opc.)</Label><Input type="time" value={time} onChange={e=>setTime(e.target.value)} /></div>
          </div>
          <div className="flex justify-between">
            {reminder && <Button type="button" variant="destructive" onClick={() => { onDelete(reminder.id); onClose(); }}>Excluir</Button>}
            <div className="flex-grow flex justify-end gap-2"><Button type="button" variant="ghost" onClick={onClose}>Cancelar</Button><Button type="submit">Salvar</Button></div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ReminderFormModal;