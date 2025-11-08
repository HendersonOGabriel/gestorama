import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, CreditCard } from 'lucide-react';
import { mockCards, mockAccounts } from '@/data/mockData';

export default function Cards() {
  const getAccountName = (accountId: string) => {
    const account = mockAccounts.find(acc => acc.id === accountId);
    return account?.name || 'Conta não encontrada';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Cartões</h1>
          <p className="text-muted-foreground mt-1">
            Gerencie seus cartões de crédito
          </p>
        </div>
        <Button>
          <Plus className="h-4 w-4 mr-2" />
          Novo Cartão
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {mockCards.map((card) => (
          <Card key={card.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="space-y-1">
                <CardTitle className="text-lg">{card.name}</CardTitle>
                {card.isDefault && (
                  <Badge variant="default" className="text-xs">Cartão Padrão</Badge>
                )}
              </div>
              <CreditCard className="h-8 w-8 text-muted-foreground" />
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Limite</p>
                  <p className="text-lg font-bold">
                    R$ {card.limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Disponível</p>
                  <p className="text-lg font-bold text-income">
                    R$ {card.limit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Fechamento</p>
                  <p className="font-medium">Dia {card.closingDay}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Vencimento</p>
                  <p className="font-medium">Dia {card.dueDay}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground">Conta vinculada</p>
                <p className="font-medium">{getAccountName(card.accountId)}</p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button variant="outline" size="sm" className="flex-1">
                  Editar
                </Button>
                <Button variant="outline" size="sm" className="flex-1">
                  Fatura
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
