import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { toCurrency } from '../../utils/helpers';

interface ReportSummaryProps {
  reportType: 'evolution' | 'category' | 'comparison';
  evolutionData: any[];
  categoryData: any;
  comparisonData: any;
}

const ReportSummary: React.FC<ReportSummaryProps> = ({ reportType, evolutionData, categoryData, comparisonData }) => {
  return (
    <Card className="h-fit sticky top-6">
      <CardHeader>
        <CardTitle>Resumo do Relatório</CardTitle>
      </CardHeader>
      <CardContent>
        {reportType === 'evolution' && (
          <div>
            <h3 className="font-semibold mb-2">Evolução Mensal</h3>
            <p className="text-sm text-slate-500">
              Analisando {evolutionData.length} meses.
            </p>
          </div>
        )}
        {reportType === 'category' && (
          <div>
            <h3 className="font-semibold mb-2">Análise por Categoria</h3>
            <p className="text-sm text-slate-500">
              Total de despesas: {toCurrency(categoryData.total)}
            </p>
          </div>
        )}
        {reportType === 'comparison' && (
          <div>
            <h3 className="font-semibold mb-2">Comparativo</h3>
            <p className="text-sm text-slate-500">
              Saldo do período: {toCurrency(comparisonData.primary.balance)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReportSummary;
