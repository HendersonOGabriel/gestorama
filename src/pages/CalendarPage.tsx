import React, { useMemo, useState } from 'react';
import { Plus, Edit3, Clock, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { Transaction, Reminder } from '@/types';
import { toCurrency, cn, displayMonthYear, monthKey, addMonths, displayDate } from '@/utils/helpers';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import ReminderFormModal from '@/components/calendar/ReminderFormModal';
import { supabase } from '@/integrations/supabase/client';

interface CalendarPageProps {
  transactions: Transaction[];
  reminders: Reminder[];
  setReminders: React.Dispatch<React.SetStateAction<Reminder[]>>;
  getInstallmentDueDate: (tx: Transaction, inst: any) => string;
  getCategoryName: (id: string | null) => string;
  userId: string;
  addToast: (message: string, type?: 'error' | 'success') => void;
}

const CalendarPage: React.FC<CalendarPageProps> = ({ transactions, reminders, setReminders, getInstallmentDueDate, getCategoryName, userId, addToast }) => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState(new Date());
  const [modalOpen, setModalOpen] = useState(false);
  const [editReminder, setEditReminder] = useState<Reminder | null>(null);

  const handleSaveReminder = async (data: Omit<Reminder, 'id'>) => {
    try {
      const { data: newReminder, error } = await supabase
        .from('reminders')
        .insert({
          user_id: userId,
          date: data.date,
          description: data.desc,
          time: data.time
        })
        .select()
        .single();

      if (error) throw error;

      setReminders(p => [...p, {
        id: newReminder.id,
        date: newReminder.date,
        desc: newReminder.description,
        time: newReminder.time
      }]);
      
      addToast('Lembrete criado com sucesso!', 'success');
      setModalOpen(false);
    } catch (error) {
      console.error('Erro ao criar lembrete:', error);
      addToast('Erro ao criar lembrete. Tente novamente.', 'error');
    }
  };

  const handleUpdateReminder = async (id: string, data: Partial<Reminder>) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .update({
          date: data.date,
          description: data.desc,
          time: data.time
        })
        .eq('id', id);

      if (error) throw error;

      setReminders(p => p.map(r => r.id === id ? {...r, ...data} : r));
      addToast('Lembrete atualizado com sucesso!', 'success');
      setModalOpen(false);
    } catch (error) {
      console.error('Erro ao atualizar lembrete:', error);
      addToast('Erro ao atualizar lembrete. Tente novamente.', 'error');
    }
  };

  const handleDeleteReminder = async (id: string) => {
    try {
      const { error } = await supabase
        .from('reminders')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setReminders(p => p.filter(r => r.id !== id));
      addToast('Lembrete excluído com sucesso!', 'success');
      setModalOpen(false);
    } catch (error) {
      console.error('Erro ao excluir lembrete:', error);
      addToast('Erro ao excluir lembrete. Tente novamente.', 'error');
    }
  };

  const dayDataMap = useMemo(() => {
    const map = new Map<string, { reminders: Reminder[], transactions: { tx: Transaction, inst: any }[] }>();
    const year = currentMonth.getFullYear(); const month = currentMonth.getMonth();

    reminders.forEach(rem => {
      const remDate = new Date(rem.date + 'T12:00:00Z');
      if (remDate.getUTCFullYear() === year && remDate.getUTCMonth() === month) {
        const dayISO = rem.date;
        if (!map.has(dayISO)) map.set(dayISO, { reminders: [], transactions: [] });
        map.get(dayISO)!.reminders.push(rem);
      }
    });

    transactions.forEach(tx => {
      tx.installmentsSchedule.forEach(inst => {
        const dueDateObj = new Date(getInstallmentDueDate(tx, inst) + 'T12:00:00Z');
        if (dueDateObj.getUTCFullYear() === year && dueDateObj.getUTCMonth() === month) {
          const dayISO = dueDateObj.toISOString().slice(0, 10);
          if (!map.has(dayISO)) map.set(dayISO, { reminders: [], transactions: [] });
          map.get(dayISO)!.transactions.push({ tx, inst });
        }
      });
    });
    return map;
  }, [currentMonth, transactions, reminders, getInstallmentDueDate]);

  const calendarGrid = useMemo(() => {
    const grid: (Date | null)[] = [];
    const year = currentMonth.getFullYear(); const month = currentMonth.getMonth();
    const startOfMonth = new Date(year, month, 1);
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const startDayOfWeek = startOfMonth.getDay();

    for (let i = 0; i < startDayOfWeek; i++) grid.push(null);
    for (let i = 1; i <= daysInMonth; i++) grid.push(new Date(year, month, i));
    while (grid.length < 42) grid.push(null);
    return grid;
  }, [currentMonth]);

  const selectedDayISO = selectedDay.toISOString().slice(0, 10);
  const selectedDayData = dayDataMap.get(selectedDayISO) || { reminders: [], transactions: [] };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <Card className="lg:col-span-2">
        <CardHeader><div className="flex justify-between items-center">
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(p => addMonths(p, -1))}>Anterior</Button>
            <CardTitle>{displayMonthYear(monthKey(currentMonth))}</CardTitle>
            <Button variant="outline" size="sm" onClick={() => setCurrentMonth(p => addMonths(p, 1))}>Próximo</Button>
        </div></CardHeader>
        <CardContent>
            <div className="grid grid-cols-7 gap-1">
                {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(day => <div key={day} className="text-center font-medium text-xs text-slate-500 pb-2">{day}</div>)}
                {calendarGrid.map((day, index) => {
                    if (!day) return <div key={`pad-${index}`} className="rounded-lg h-24 bg-slate-50 dark:bg-slate-800/50"></div>;
                    const dayISO = day.toISOString().slice(0, 10);
                    return (<div key={dayISO} onClick={() => setSelectedDay(day)} className={cn("rounded-lg h-24 p-2 cursor-pointer border-2", dayISO === selectedDayISO ? "border-indigo-500 bg-indigo-50 dark:bg-indigo-950/50" : "border-transparent hover:bg-slate-100 dark:hover:bg-slate-800")}>
                        <span className="font-semibold">{day.getDate()}</span>
                        <div className="flex gap-1 mt-1.5 flex-wrap">
                            {dayDataMap.has(dayISO) && dayDataMap.get(dayISO)!.reminders.length > 0 && <span className="w-2 h-2 rounded-full bg-indigo-500"></span>}
                            {dayDataMap.has(dayISO) && dayDataMap.get(dayISO)!.transactions.some(t => !t.tx.isIncome) && <span className="w-2 h-2 rounded-full bg-red-500"></span>}
                            {dayDataMap.has(dayISO) && dayDataMap.get(dayISO)!.transactions.some(t => t.tx.isIncome) && <span className="w-2 h-2 rounded-full bg-green-500"></span>}
                        </div>
                    </div>)
                })}
            </div>
        </CardContent>
      </Card>
      <Card className="lg:col-span-1 h-fit sticky top-6">
        <CardHeader><CardTitle>Detalhes do Dia</CardTitle><p className="text-sm text-slate-500">{displayDate(selectedDayISO)}</p></CardHeader>
        <CardContent>
            <div>
                <div className="flex justify-between items-center mb-2"><h4 className="font-semibold">Lembretes</h4><Button size="sm" onClick={() => { setEditReminder(null); setModalOpen(true); }}><Plus className="w-4 h-4 mr-1"/> Adicionar</Button></div>
                {selectedDayData.reminders.length === 0 ? (
                  <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">Nenhum lembrete para este dia.</div>
                ) : (
                  <ul className="space-y-2">{selectedDayData.reminders.map(rem => (
                    <li key={rem.id} className="flex items-center gap-3 p-2 rounded-md bg-indigo-50 dark:bg-indigo-950/50 border border-indigo-200 dark:border-indigo-800/50">
                        <div className="flex-shrink-0 text-indigo-500">
                            <Clock className="w-4 h-4" />
                        </div>
                        <div className="flex-1 text-sm text-slate-800 dark:text-slate-200">
                            {rem.time && <span className="font-mono text-xs mr-2">{rem.time}</span>}
                            <span>{rem.desc}</span>
                        </div>
                        <Button size="icon" variant="ghost" className="h-7 w-7 flex-shrink-0 text-slate-500 hover:text-indigo-500" onClick={() => { setEditReminder(rem); setModalOpen(true); }}>
                            <Edit3 className="w-4 h-4" />
                        </Button>
                    </li>
                  ))}</ul>
                )}
            </div>
            <div className="mt-6">
                <h4 className="font-semibold mb-2">Transações do Dia</h4>
                {selectedDayData.transactions.length === 0 ? (
                  <div className="text-center text-sm text-slate-500 dark:text-slate-400 py-4">Nenhuma transação para este dia.</div>
                ) : (
                  <ul className="space-y-1">{selectedDayData.transactions.map(({ tx, inst }) => (
                    <li key={`${tx.id}-${inst.id}`} className="flex items-center gap-3 py-2 border-b border-slate-200 dark:border-slate-800 last:border-b-0">
                        <div className="flex-shrink-0">
                            {tx.isIncome ? (
                                <ArrowUpCircle className="w-5 h-5 text-green-500" />
                            ) : (
                                <ArrowDownCircle className="w-5 h-5 text-red-500" />
                            )}
                        </div>
                        <div className="flex-1 text-sm">
                            <p className="font-medium text-slate-800 dark:text-slate-200">{tx.desc} <span className="text-xs text-slate-500">({inst.id}/{tx.installments})</span></p>
                            <p className="text-xs text-slate-500 dark:text-slate-400">{getCategoryName(tx.categoryId)}</p>
                        </div>
                        <div className={cn("font-semibold text-right", tx.isIncome ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400")}>
                            {toCurrency(inst.amount)}
                        </div>
                    </li>
                  ))}</ul>
                )}
            </div>
        </CardContent>
      </Card>
      <ReminderFormModal isOpen={modalOpen} onClose={() => { setModalOpen(false); setEditReminder(null); }} onSave={handleSaveReminder} onUpdate={handleUpdateReminder} onDelete={handleDeleteReminder} reminder={editReminder} selectedDateISO={selectedDayISO} />
    </div>
  );
};

export default CalendarPage;
