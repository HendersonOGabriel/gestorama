import React, { useState, useEffect, useMemo } from 'react';
import { Transaction, Installment } from '../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { Checkbox } from '../ui/Checkbox';
import { toCurrency, displayDate } from '../../utils/helpers';

interface SettleInstallmentsModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onConfirm: (
    txId: string,
    installmentsToSettle: { id: string; amount: number }[],
    totalPaidAmount: number
  ) => void;
  getInstallmentDueDate: (tx: Transaction, inst: Installment) => string;
}

const SettleInstallmentsModal: React.FC<SettleInstallmentsModalProps> = ({
  transaction,
  onClose,
  onConfirm,
  getInstallmentDueDate
}) => {
  const [selectedInstallments, setSelectedInstallments] = useState<Set<string>>(new Set());
  const [totalPaidAmount, setTotalPaidAmount] = useState('');

  const unpaidInstallments = useMemo(() => {
    return transaction?.installmentsSchedule.filter(inst => !inst.paid) || [];
  }, [transaction]);

  useEffect(() => {
    if (transaction) {
      // Reset state when a new transaction is opened
      setSelectedInstallments(new Set());
      const initialTotal = unpaidInstallments.reduce((sum, inst) => sum + inst.amount, 0);
      setTotalPaidAmount(initialTotal.toString());
    }
  }, [transaction, unpaidInstallments]);

  // Update total amount whenever selection changes
  useEffect(() => {
    if (!transaction) return;
    const newTotal = unpaidInstallments
      .filter(inst => selectedInstallments.has(inst.id))
      .reduce((sum, inst) => sum + inst.amount, 0);
    setTotalPaidAmount(newTotal.toFixed(2));
  }, [selectedInstallments, unpaidInstallments, transaction]);


  if (!transaction) return null;

  const handleToggleAll = (checked: boolean) => {
    if (checked) {
      const allIds = new Set(unpaidInstallments.map(inst => inst.id));
      setSelectedInstallments(allIds);
    } else {
      setSelectedInstallments(new Set());
    }
  };

  const handleToggleInstallment = (instId: string) => {
    setSelectedInstallments(prev => {
      const newSet = new Set(prev);
      if (newSet.has(instId)) {
        newSet.delete(instId);
      } else {
        newSet.add(instId);
      }
      return newSet;
    });
  };

  const handleConfirm = () => {
    const installmentsToSettle = unpaidInstallments
      .filter(inst => selectedInstallments.has(inst.id))
      .map(inst => ({ id: inst.id, amount: inst.amount }));

    if (installmentsToSettle.length === 0) return;

    onConfirm(transaction.id, installmentsToSettle, parseFloat(totalPaidAmount) || 0);
    onClose();
  };

  const originalTotalSelected = unpaidInstallments
    .filter(inst => selectedInstallments.has(inst.id))
    .reduce((sum, inst) => sum + inst.amount, 0);

  return (
    <Dialog open={!!transaction} onOpenChange={onClose}>
      <DialogContent className="max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Quitar Parcelas</DialogTitle>
          <p className="text-sm text-slate-500">Selecione as parcelas que deseja quitar e informe o valor total pago.</p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 -mr-2 space-y-3 min-h-0">
          <div className="flex items-center p-2 border-b">
            <Checkbox
              id="select-all"
              checked={selectedInstallments.size === unpaidInstallments.length && unpaidInstallments.length > 0}
              onCheckedChange={handleToggleAll}
            />
            <Label htmlFor="select-all" className="ml-2 font-semibold">Selecionar Todas</Label>
          </div>
          {unpaidInstallments.map((inst, index) => (
            <div key={inst.id} className="flex items-center justify-between p-2 rounded-md hover:bg-slate-50 dark:hover:bg-slate-800/50">
              <div className="flex items-center">
                <Checkbox
                  id={`inst-${inst.id}`}
                  checked={selectedInstallments.has(inst.id)}
                  onCheckedChange={() => handleToggleInstallment(inst.id)}
                />
                <div className="ml-3">
                  <Label htmlFor={`inst-${inst.id}`} className="font-medium">
                    Parcela {inst.installment_number}/{transaction.installments} - {toCurrency(inst.amount)}
                  </Label>
                  <p className="text-xs text-slate-500">Vencimento: {displayDate(getInstallmentDueDate(transaction, inst))}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-4 pt-4 border-t">
          <div className="space-y-2">
            <div>
              <Label htmlFor="total-paid" className="text-base">Valor Total Pago</Label>
              <p className="text-xs text-slate-500 mb-1">
                Valor original das parcelas selecionadas: {toCurrency(originalTotalSelected)}
              </p>
              <Input
                id="total-paid"
                type="number"
                value={totalPaidAmount}
                onChange={e => setTotalPaidAmount(e.target.value)}
                className="text-lg"
                placeholder={toCurrency(0)}
              />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-2 mt-4">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm} disabled={selectedInstallments.size === 0}>
            Confirmar Quitação
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SettleInstallmentsModal;