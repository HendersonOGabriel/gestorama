import React from 'react';
import { Transaction, Installment, PayingInstallment, Account, Card as CardType, Category } from '../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { toCurrency, displayDate, cn, getInvoiceMonthKey } from '../../utils/helpers';
import { Edit3, Trash2, CheckCircle2, Clock, DollarSign, Calendar, Tag, CreditCard, PiggyBank, User } from 'lucide-react';

interface TransactionDetailModalProps {
  transaction: Transaction | null;
  onClose: () => void;
  onEdit: (tx: Transaction) => void;
  onDelete: (id: string) => void;
  onPay: (details: PayingInstallment) => void;
  onUnpay: (txId: string, instId: number) => void;
  getInstallmentDueDate: (tx: Transaction, inst: Installment) => string;
  getCategoryName: (id: string | null) => string;
  accounts: Account[];
  cards: CardType[];
  onFocusInvoice: (cardId: string, month: string) => void;
}

const DetailItem: React.FC<{ icon: React.ReactNode, label: string, value: string | React.ReactNode }> = ({ icon, label, value }) => (
  <div className="flex items-start text-sm">
    <div className="flex-shrink-0 w-6 mt-0.5 text-slate-500 dark:text-slate-400">{icon}</div>
    <div className="flex-1">
      <span className="font-semibold text-slate-700 dark:text-slate-300">{label}:</span>
      <span className="ml-2 text-slate-600 dark:text-slate-200">{value}</span>
    </div>
  </div>
);

const TransactionDetailModal: React.FC<TransactionDetailModalProps> = ({
  transaction, onClose, onEdit, onDelete, onPay, onUnpay, getInstallmentDueDate, getCategoryName, accounts, cards
}) => {
  if (!transaction) return null;

  const accountName = accounts.find(a => a.id === transaction.account)?.name || 'N/A';
  const cardData = cards.find(c => c.id === transaction.card);
  const cardName = cardData ? `${cardData.name}${cardData.deleted ? ' (Excluído)' : ''}` : 'N/A';
  const categoryName = getCategoryName(transaction.categoryId);
  const totalPaid = transaction.installmentsSchedule.filter(s => s.paid).reduce((acc, s) => acc + (s.paidAmount || s.amount), 0);

  const getTransactionTypeLabel = () => {
    switch (transaction.type) {
      case 'card': return 'Cartão de Crédito';
      case 'cash': return 'À Vista / Débito';
      case 'prazo': return 'A Prazo (Boleto/Carnê)';
      default: return 'N/A';
    }
  };

  const handleEdit = () => {
    onEdit(transaction);
    onClose();
  };

  const handleDelete = () => {
    onDelete(transaction.id);
    onClose();
  };

  return (
    <Dialog open={!!transaction} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{transaction.desc}</DialogTitle>
          <p className={cn("text-2xl font-bold", transaction.isIncome ? 'text-green-500' : 'text-red-500')}>
            {transaction.isIncome ? '+' : '-'} {toCurrency(transaction.amount)}
          </p>
        </DialogHeader>
        <div className="space-y-3 mt-4 max-h-[70vh] overflow-y-auto pr-2">
          {/* Details Section */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-lg space-y-3">
            <DetailItem icon={<Calendar size={16} />} label="Data da Compra" value={displayDate(transaction.date)} />
            <DetailItem icon={<Tag size={16} />} label="Categoria" value={categoryName} />
            <DetailItem icon={<PiggyBank size={16} />} label="Conta" value={accountName} />
            {transaction.type === 'card' && <DetailItem icon={<CreditCard size={16} />} label="Cartão" value={cardName} />}
            {transaction.type === 'prazo' && transaction.person && <DetailItem icon={<User size={16} />} label={transaction.isIncome ? "Devedor" : "Credor"} value={transaction.person} />}
            <DetailItem icon={<DollarSign size={16} />} label="Tipo" value={getTransactionTypeLabel()} />
            <DetailItem icon={transaction.paid ? <CheckCircle2 size={16} className="text-green-500" /> : <Clock size={16} className="text-amber-500" />} label="Status Geral" value={
              transaction.paid ? `Quitado (${toCurrency(totalPaid)})` : `Pendente (${toCurrency(totalPaid)} de ${toCurrency(transaction.amount)} pago)`
            } />
          </div>

          {/* Installments & Payment Section */}
          {!transaction.isIncome && (
            <div>
              <h4 className="font-semibold mb-2 mt-4 text-md">
                {transaction.installments > 1 ? 'Parcelamento' : 'Pagamento'}
              </h4>
              <div className="space-y-2 border border-slate-200 dark:border-slate-700 rounded-lg p-3">
                {transaction.installmentsSchedule.map(inst => {
                    const isAmountDifferent = inst.paid && inst.paidAmount !== null && inst.paidAmount !== inst.amount;
                    const isCardTx = transaction.type === 'card';

                    const amountDisplay = isAmountDifferent ? (
                      <>
                        <span className="text-slate-500 line-through mr-2">{toCurrency(inst.amount)}</span>
                        <span>{toCurrency(inst.paidAmount)}</span>
                      </>
                    ) : (
                      toCurrency(inst.amount)
                    );

                    return (
                      <div key={inst.id} className="flex justify-between items-center py-2 border-b border-slate-200 dark:border-slate-700 last:border-b-0">
                        <div>
                          <div className="font-medium">
                            {transaction.installments > 1 ? `Parcela ${inst.id}/${transaction.installments} - ` : ''}
                            {amountDisplay}
                          </div>
                          <div className="text-xs text-slate-500">Vencimento: {displayDate(getInstallmentDueDate(transaction, inst))}</div>
                          {inst.paid && inst.paymentDate && <div className="text-xs text-green-600">Pago em: {displayDate(inst.paymentDate)}</div>}
                        </div>
                        {isCardTx ? (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                                if (!cardData) return;
                                const month = getInvoiceMonthKey(inst.postingDate, cardData.closingDay);
                                onFocusInvoice(cardData.id, month);
                            }}
                          >
                            Fatura
                          </Button>
                        ) : (
                          <Button
                            size="sm"
                            variant={inst.paid ? 'outline' : 'default'}
                            onClick={() => inst.paid ? onUnpay(transaction.id, inst.id) : onPay({ tx: transaction, inst })}
                          >
                            {inst.paid ? 'Estornar' : 'Pagar'}
                          </Button>
                        )}
                      </div>
                    );
                })}
              </div>
            </div>
          )}
        </div>
        <div className="flex justify-between gap-2 mt-6">
          <Button variant="destructive" onClick={handleDelete}><Trash2 className="w-4 h-4 mr-2"/>Excluir</Button>
          <div className="flex gap-2">
            <Button variant="ghost" onClick={onClose}>Fechar</Button>
            <Button onClick={handleEdit}><Edit3 className="w-4 h-4 mr-2"/>Editar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TransactionDetailModal;