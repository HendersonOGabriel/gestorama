import React, { useState, useEffect } from 'react';
import { PayingInstallment } from '../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { toCurrency } from '../../utils/helpers';

interface PaymentModalProps {
  payingInstallment: PayingInstallment | null;
  onClose: () => void;
  onConfirm: (txId: string, instId: number, amount: number) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ payingInstallment, onClose, onConfirm }) => {
  const [amount, setAmount] = useState('');
  useEffect(() => {
    if (payingInstallment) setAmount(payingInstallment.inst.amount.toString());
  }, [payingInstallment]);

  if (!payingInstallment) return null;

  const handleConfirm = () => {
    onConfirm(payingInstallment.tx.id, payingInstallment.inst.id, parseFloat(amount));
    onClose();
  };

  return (
    <Dialog open={!!payingInstallment} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Confirmar Pagamento</DialogTitle></DialogHeader>
        <p>Valor Original: {toCurrency(payingInstallment.inst.amount)}</p>
        <Label>Valor Pago</Label>
        <Input type="number" min="0" value={amount} onChange={e => setAmount(e.target.value)} />
        <Button onClick={handleConfirm}>Confirmar</Button>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentModal;