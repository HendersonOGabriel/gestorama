import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus } from 'lucide-react';
import { mockTransactions, mockCategories } from '@/data/mockData';

export default function Transactions() {
  const [transactions] = useState(mockTransactions);

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId) return 'Sem categoria';
    const category = mockCategories.find(c => c.id === categoryId);
    return category?.name || 'Sem categoria';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Transações</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie suas receitas e despesas
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Nova Transação
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Todas as Transações</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {transactions.map((transaction) => (
              <div
                key={transaction.id}
                className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent transition-colors cursor-pointer"
              >
                <div className="flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    <p className="font-semibold">{transaction.desc}</p>
                    <Badge variant={transaction.isIncome ? "default" : "secondary"}>
                      {transaction.isIncome ? 'Receita' : 'Despesa'}
                    </Badge>
                    {transaction.installments > 1 && (
                      <Badge variant="outline">
                        {transaction.installments}x
                      </Badge>
                    )}
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{new Date(transaction.date).toLocaleDateString('pt-BR')}</span>
                    <span>{getCategoryName(transaction.categoryId)}</span>
                    {transaction.person && <span>{transaction.person}</span>}
                  </div>
                </div>
                <div className="text-right">
                  <div className={`text-xl font-bold ${transaction.isIncome ? 'text-income' : 'text-expense'}`}>
                    {transaction.isIncome ? '+' : '-'}R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1">
                    {transaction.paid ? (
                      <Badge variant="default" className="bg-income">Pago</Badge>
                    ) : (
                      <Badge variant="outline">Pendente</Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
