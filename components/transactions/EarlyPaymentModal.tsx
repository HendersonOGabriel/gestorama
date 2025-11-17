import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { toCurrency } from '../../utils/helpers';
import { Transaction } from '../../types';

interface EarlyPaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: Transaction | null;
  onConfirm: (paidAmount: number) => void;
}

const EarlyPaymentModal: React.FC<EarlyPaymentModalProps> = ({ isOpen, onClose, transaction, onConfirm }) => {
  const [amount, setAmount] = useState('');

  if (!transaction) return null;

  const remainingAmount = transaction.installmentsSchedule
    .filter(i => !i.paid)
    .reduce((acc, i) => acc + i.amount, 0);

  const handleConfirm = () => {
    const paidAmount = parseFloat(amount);
    if (!isNaN(paidAmount) && paidAmount > 0) {
      onConfirm(paidAmount);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Quitação Antecipada</DialogTitle>
        </DialogHeader>
        <div className="py-4">
          <p className="mb-4">Deseja quitar antecipadamente a transação "{transaction.desc}"?</p>
          <p className="mb-4 font-semibold">Valor restante: {toCurrency(remainingAmount)}</p>
          <div className="space-y-2">
            <Label htmlFor="payment-amount">Valor a ser pago</Label>
            <Input
              id="payment-amount"
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="Digite o valor pago"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleConfirm}>Confirmar Quitação</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default EarlyPaymentModal;