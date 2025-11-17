import React, { useState, useMemo, useEffect } from 'react';
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowDown, ArrowUp, BarChart3, ChevronDown, Filter, LineChart as LineChartIcon, PieChart as PieChartIcon, Replace } from 'lucide-react';
import { Transaction, Account, Card as CardType, Category } from '../types';
import { toCurrency, cn, monthKey, displayMonthYear, displayDate } from '../utils/helpers';
import ReportSummary from '../components/reports/ReportSummary';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Label } from '../components/ui/Label';
import { Checkbox } from '../components/ui/Checkbox';
import SummaryCard from '../components/shared/SummaryCard';
import { PIE_COLORS } from '../data/initialData';

interface ReportsPageProps {
  transactions: Transaction[];
  accounts: Account[];
  cards: CardType[];
  categories: Category[];
  getCategoryName: (id: string | null) => string;
}

const getMonthRange = (date: Date) => {
  const start = new Date(date.getFullYear(), date.getMonth(), 1);
  const end = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
};

const getYearRange = (date: Date) => {
  const start = new Date(date.getFullYear(), 0, 1);
  const end = new Date(date.getFullYear(), 11, 31);
  return {
    startDate: start.toISOString().slice(0, 10),
    endDate: end.toISOString().slice(0, 10),
  };
};


const ReportsPage: React.FC<ReportsPageProps> = ({ transactions, accounts, cards, categories, getCategoryName }) => {
  const [reportType, setReportType] = useState<'evolution' | 'category' | 'comparison'>('evolution');
  
  const [periodA, setPeriodA] = useState(getMonthRange(new Date()));
  const [periodB, setPeriodB] = useState({ startDate: '', endDate: '' });
  const [useCompare, setUseCompare] = useState(false);
  const [compareType, setCompareType] = useState<'previous_period' | 'previous_year'>('previous_period');

  const [selectedAccounts, setSelectedAccounts] = useState<string[]>(accounts.map(a => a.id));
  const [selectedCards, setSelectedCards] = useState<string[]>(cards.map(c => c.id));
  const [selectedCategories, setSelectedCategories] = useState<string[]>(categories.map(c => c.id));
  const [txType, setTxType] = useState<'all' | 'income' | 'expense'>('expense');

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [reportType]);

  useEffect(() => {
    if (!useCompare || !periodA.startDate || !periodA.endDate) {
      setPeriodB({ startDate: '', endDate: '' });
      return;
    };

    const primStart = new Date(periodA.startDate + 'T12:00:00Z');
    const primEnd = new Date(periodA.endDate + 'T12:00:00Z');
    let compStart: Date;
    let compEnd: Date;

    if (compareType === 'previous_year') {
        compStart = new Date(primStart);
        compEnd = new Date(primEnd);
        compStart.setUTCFullYear(compStart.getUTCFullYear() - 1);
        compEnd.setUTCFullYear(compEnd.getUTCFullYear() - 1);
    } else { // 'previous_period'
        const durationMs = primEnd.getTime() - primStart.getTime();
        compEnd = new Date(primStart.getTime() - (24 * 60 * 60 * 1000)); // One day before primStart
        compStart = new Date(compEnd.getTime() - durationMs);
    }

    setPeriodB({
        startDate: compStart.toISOString().slice(0, 10),
        endDate: compEnd.toISOString().slice(0, 10),
    });
  }, [periodA, useCompare, compareType]);


  const filteredData = useMemo(() => {
    const filterFunction = (tx: Transaction, range: { startDate: string, endDate: string }) => {
      // FIX: Removed the `!tx.paid` check, as a transaction can have paid installments within the range
      // even if the parent transaction object is not fully paid yet.
      
      const hasPaymentsInDate = tx.installmentsSchedule.some(s => {
        if (!s.paid || !s.paymentDate) return false;
        return s.paymentDate >= range.startDate && s.paymentDate <= range.endDate;
      });

      if(!hasPaymentsInDate) return false;

      const isInAccount = selectedAccounts.length === accounts.length || selectedAccounts.includes(tx.account);
      const isInCard = selectedCards.length === cards.length || (tx.card && selectedCards.includes(tx.card));
      const isInCategories = selectedCategories.length === categories.length || (tx.categoryId && selectedCategories.includes(tx.categoryId));
      const isCorrectType = txType === 'all' || (txType === 'income' && tx.isIncome) || (txType === 'expense' && !tx.isIncome);
      
      const isCardTx = tx.type === 'card' && !tx.isIncome;
      const paymentSourceMatches = isCardTx ? isInCard : isInAccount;

      return paymentSourceMatches && isInCategories && isCorrectType;
    };

    const primaryTxs = transactions.filter(tx => filterFunction(tx, periodA));
    const compareTxs = useCompare ? transactions.filter(tx => filterFunction(tx, periodB)) : [];

    return { primaryTxs, compareTxs };
  }, [transactions, periodA, useCompare, periodB, selectedAccounts, selectedCards, selectedCategories, txType, accounts, cards, categories]);

  const reportData = useMemo(() => {
    const processCategoryTxs = (txs: Transaction[], range: { startDate: string, endDate: string }) => {
        const expenses = txs.filter(tx => !tx.isIncome);
        const byCategory: Record<string, number> = {};
        let total = 0;
        expenses.forEach(tx => {
            tx.installmentsSchedule.forEach(s => {
                if(s.paid && s.paymentDate && s.paymentDate >= range.startDate && s.paymentDate <= range.endDate){
                    const amount = s.paidAmount || s.amount;
                    const catId = tx.categoryId || 'none';
                    byCategory[catId] = (byCategory[catId] || 0) + amount;
                    total += amount;
                }
            });
        });

        if (total === 0) return { pieData: [], tableData: [], total: 0 };

        const sorted = Object.entries(byCategory).sort(([,a], [,b]) => b - a);

        return {
          pieData: sorted.map(([id, value], i) => ({ id, name: getCategoryName(id), value, fill: PIE_COLORS[i % PIE_COLORS.length] })),
          tableData: sorted.map(([id, value]) => ({ id, name: getCategoryName(id), value, percentage: (value / total) * 100 })),
          total
        };
    };

    const processEvolutionTxs = (txs: Transaction[]) => {
      const monthly: Record<string, { income: number, expense: number }> = {};
      txs.forEach(tx => {
        tx.installmentsSchedule.forEach(s => {
          if (s.paid && s.paymentDate) {
            const mKey = monthKey(s.paymentDate);
            if (!monthly[mKey]) monthly[mKey] = { income: 0, expense: 0 };
            const amount = s.paidAmount || s.amount;
            if (tx.isIncome) monthly[mKey].income += amount;
            else monthly[mKey].expense += amount;
          }
        });
      });
      const sortedKeys = Object.keys(monthly).sort();
      return sortedKeys.map(key => ({
        month: displayMonthYear(key),
        Receita: monthly[key]?.income || 0,
        Despesa: monthly[key]?.expense || 0,
      }));
    };
    
    const categoryDataA = processCategoryTxs(filteredData.primaryTxs, periodA);
    const evolutionDataA = processEvolutionTxs(filteredData.primaryTxs);
    
    let categoryDataB = null;
    let evolutionDataB = null;

    if (useCompare) {
      categoryDataB = processCategoryTxs(filteredData.compareTxs, periodB);
      evolutionDataB = processEvolutionTxs(filteredData.compareTxs);
    }
    
    return { categoryDataA, categoryDataB, evolutionDataA, evolutionDataB };

  }, [filteredData, useCompare, periodA, periodB, getCategoryName]);

  const comparisonData = useMemo(() => {
      const calculateMetrics = (txs: Transaction[], range: { startDate: string, endDate: string }) => {
          let income = 0; let expense = 0;
          txs.forEach(tx => {
              const paidAmountInDate = tx.installmentsSchedule
                  .filter(s => s.paid && s.paymentDate && s.paymentDate >= range.startDate && s.paymentDate <= range.endDate)
                  .reduce((sum, s) => sum + (s.paidAmount || s.amount), 0);
              
              if (tx.isIncome) income += paidAmountInDate; else expense += paidAmountInDate;
          });
          return { income, expense, balance: income - expense };
      };
      
      const primary = calculateMetrics(filteredData.primaryTxs, periodA);
      const compare = useCompare ? calculateMetrics(filteredData.compareTxs, periodB) : { income: 0, expense: 0, balance: 0 };
      
      const calcChange = (p: number, c: number) => c === 0 ? (p > 0 ? 100 : 0) : ((p - c) / Math.abs(c)) * 100;
      
      return {
          primary, compare,
          incomeChange: calcChange(primary.income, compare.income),
          expenseChange: calcChange(primary.expense, compare.expense),
          balanceChange: calcChange(primary.balance, compare.balance)
      };
  }, [filteredData, useCompare, periodA, periodB]);
  
  const handleSetPreset = (preset: 'this_month' | 'last_month' | 'this_year') => {
    const today = new Date();
    if (preset === 'this_month') {
        setPeriodA(getMonthRange(today));
    } else if (preset === 'last_month') {
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        setPeriodA(getMonthRange(lastMonth));
    } else if (preset === 'this_year') {
        setPeriodA(getYearRange(today));
    }
  };


  const toggleAll = (type: 'accounts' | 'cards' | 'categories') => {
    const source = { accounts, cards, categories }[type];
    const selected = { accounts: selectedAccounts, cards: selectedCards, categories: selectedCategories }[type];
    const setter = { accounts: setSelectedAccounts, cards: setSelectedCards, categories: setSelectedCategories }[type];
    
    if (selected.length === source.length) setter([]);
    else setter(source.map(item => item.id));
  };
  
  const toggleItem = (id: string, type: 'accounts' | 'cards' | 'categories') => {
    const selected = { accounts: selectedAccounts, cards: selectedCards, categories: selectedCategories }[type];
    const setter = { accounts: setSelectedAccounts, cards: setSelectedCards, categories: setSelectedCategories }[type];

    if (selected.includes(id)) setter(selected.filter(i => i !== id));
    else setter([...selected, id]);
  };

  const renderEvolution = (data: any, title: string) => (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        {data.length > 0 ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis tickFormatter={(v) => toCurrency(v).replace('R$', '')} />
            <Tooltip formatter={(v: number) => toCurrency(v)} />
            <Legend />
            <Line type="monotone" dataKey="Receita" stroke="#22c55e" strokeWidth={2} />
            <Line type="monotone" dataKey="Despesa" stroke="#ef4444" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
        ) : <div className="text-center py-20 text-slate-500">Nenhum dado para o período.</div>}
      </CardContent>
    </Card>
  );

  const renderCategory = (data: any, title: string) => (
      <Card>
          <CardHeader><CardTitle className="text-base">Despesas por Categoria ({toCurrency(data.total)}) <span className="font-normal text-slate-500">{title}</span></CardTitle></CardHeader>
          <CardContent>
              {data.pieData.length > 0 ? (
                  <div className="grid lg:grid-cols-2 gap-6 items-center">
                      <ResponsiveContainer width="100%" height={300}>
                          <PieChart>
                          <Pie data={data.pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={120} labelLine={false} label={({ name, percent }: any) => `${((percent as number) * 100).toFixed(0)}%`}>
                              {data.pieData.map((entry: any, index: number) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                          </Pie>
                          <Tooltip formatter={(v: number) => toCurrency(v)} />
                          </PieChart>
                      </ResponsiveContainer>
                      <div className="overflow-x-auto">
                          <div className="max-h-[300px] overflow-y-auto">
                              <table className="min-w-full text-sm">
                                  <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800"><tr className="text-left"><th className="p-2 font-medium">Categoria</th><th className="p-2 font-medium text-right">Valor</th><th className="p-2 font-medium text-right">%</th></tr></thead>
                                  <tbody>
                                      {data.tableData.map((item: any) => (
                                          <tr key={item.id} className="border-t dark:border-slate-700"><td className="p-2">{item.name}</td><td className="p-2 text-right">{toCurrency(item.value)}</td><td className="p-2 text-right">{item.percentage.toFixed(1)}%</td></tr>
                                      ))}
                                  </tbody>
                                  <tfoot><tr className="border-t-2 font-bold"><td className="p-2">Total</td><td className="p-2 text-right">{toCurrency(data.total)}</td><td className="p-2 text-right">100%</td></tr></tfoot>
                              </table>
                          </div>
                      </div>
                  </div>
              ) : <div className="text-center py-20 text-slate-500">Nenhuma despesa encontrada para os filtros selecionados.</div>}
          </CardContent>
      </Card>
  );

  const renderReportContent = () => {
    const { categoryDataA, categoryDataB, evolutionDataA, evolutionDataB } = reportData;

    switch (reportType) {
      case 'evolution':
        return (
          <div className={cn("grid gap-6", useCompare && "xl:grid-cols-2")}>
            {renderEvolution(evolutionDataA, `Período A: ${displayDate(periodA.startDate)} - ${displayDate(periodA.endDate)}`)}
            {useCompare && evolutionDataB && renderEvolution(evolutionDataB, `Período B: ${displayDate(periodB.startDate)} - ${displayDate(periodB.endDate)}`)}
          </div>
        );
      case 'category':
        return (
          <div className={cn("grid gap-6", useCompare && "xl:grid-cols-2")}>
             {renderCategory(categoryDataA, `(${displayDate(periodA.startDate)} - ${displayDate(periodA.endDate)})`)}
             {useCompare && categoryDataB && renderCategory(categoryDataB, `(${displayDate(periodB.startDate)} - ${displayDate(periodB.endDate)})`)}
          </div>
        );
        case 'comparison':
            if (!useCompare) return <div className="text-center py-20 text-slate-500">Ative a opção "Comparar com outro período" nos filtros para usar este relatório.</div>;
            
            const ChangeIndicator: React.FC<{ value: number; positiveIsGood?: boolean }> = ({ value, positiveIsGood = false }) => {
                const isPositive = value > 0;
                const isNegative = value < 0;
                // "Bad" change is red: (positive expense) OR (negative income/balance)
                const isBadChange = (isPositive && !positiveIsGood) || (isNegative && positiveIsGood);

                const colorClass = value === 0 ? 'text-slate-500' : (isBadChange ? 'text-red-500' : 'text-green-500');

                return (
                    <span className={cn("text-xs font-bold flex items-center", colorClass)}>
                        {value !== 0 && (isPositive ? <ArrowUp size={12} className="mr-1"/> : <ArrowDown size={12} className="mr-1"/>)}
                        {Math.abs(value).toFixed(1)}%
                    </span>
                );
            };

            return (
              <Card>
                <CardHeader><CardTitle>Comparativo entre Períodos</CardTitle></CardHeader>
                <CardContent className="space-y-6">
                  <div className="text-center text-sm text-slate-500">
                    Comparando Período A ({displayDate(periodA.startDate)} até {displayDate(periodA.endDate)}) com Período B ({displayDate(periodB.startDate)} até {displayDate(periodB.endDate)})
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <SummaryCard title="Receitas" value={toCurrency(comparisonData.primary.income)} icon={<ChangeIndicator value={comparisonData.incomeChange} positiveIsGood={true} />} colorClass="text-slate-800 dark:text-slate-100" />
                      <SummaryCard title="Despesas" value={toCurrency(comparisonData.primary.expense)} icon={<ChangeIndicator value={comparisonData.expenseChange} />} colorClass="text-slate-800 dark:text-slate-100" />
                      <SummaryCard title="Saldo Final" value={toCurrency(comparisonData.primary.balance)} icon={<ChangeIndicator value={comparisonData.balanceChange} positiveIsGood={true} />} colorClass="text-slate-800 dark:text-slate-100" />
                  </div>
                  <div className="text-sm text-slate-500 grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
                    <div>vs. {toCurrency(comparisonData.compare.income)}</div>
                    <div>vs. {toCurrency(comparisonData.compare.expense)}</div>
                    <div>vs. {toCurrency(comparisonData.compare.balance)}</div>
                  </div>
                </CardContent>
              </Card>
            );
      default: return null;
    }
  };


  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start w-full">
      <div className="lg:col-span-2 space-y-6">
        <Card>
          <CardHeader><CardTitle className="flex items-center gap-2"><Filter className="w-5 h-5"/> Filtros de Relatório</CardTitle></CardHeader>
          <CardContent className="space-y-4">
          <div>
            <Label>Período A</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-1">
              <Input type="date" value={periodA.startDate} onChange={e => setPeriodA(p => ({...p, startDate: e.target.value}))} />
              <Input type="date" value={periodA.endDate} onChange={e => setPeriodA(p => ({...p, endDate: e.target.value}))} />
              <div className="col-span-1 sm:col-span-2 flex items-center gap-2 flex-wrap">
                 <Button size="sm" variant="outline" onClick={() => handleSetPreset('this_month')}>Este Mês</Button>
                 <Button size="sm" variant="outline" onClick={() => handleSetPreset('last_month')}>Mês Passado</Button>
                 <Button size="sm" variant="outline" onClick={() => handleSetPreset('this_year')}>Este Ano</Button>
              </div>
            </div>
          </div>
           <div className="flex items-center gap-2 pt-2">
                <Checkbox id="use-compare" checked={useCompare} onCheckedChange={(checked) => setUseCompare(Boolean(checked))} />
                <Label htmlFor="use-compare" className="mb-0">Comparar Períodos</Label>
            </div>
            {useCompare && (
                <div className="space-y-4 pt-4 mt-4 border-t dark:border-slate-700">
                    <div className="flex items-center gap-4">
                        <Label className="mb-0 shrink-0">Comparar Período A com:</Label>
                        <select value={compareType} onChange={e => setCompareType(e.target.value as any)} className="p-1 h-8 text-sm border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700">
                            <option value="previous_period">Período Anterior</option>
                            <option value="previous_year">Ano Anterior</option>
                        </select>
                    </div>

                    <div>
                        <Label>Período B</Label>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mt-1">
                            <Input type="date" value={periodB.startDate} onChange={e => setPeriodB(p => ({...p, startDate: e.target.value}))} />
                            <Input type="date" value={periodB.endDate} onChange={e => setPeriodB(p => ({...p, endDate: e.target.value}))} />
                        </div>
                    </div>
                </div>
            )}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-4 border-t dark:border-slate-700">
            <div>
              <Label>Tipo de Movimentação</Label>
              <select value={txType} onChange={e => setTxType(e.target.value as any)} className="w-full p-2 h-10 border rounded-md bg-white dark:bg-slate-800 dark:border-slate-700"><option value="all">Todos</option><option value="income">Receitas</option><option value="expense">Despesas</option></select>
            </div>
            <div>
              <Label>Contas</Label>
              <div className="max-h-32 overflow-y-auto space-y-2 rounded-md border p-2 dark:border-slate-700">
                <div className="flex items-center gap-2"><Checkbox id="acc-all" checked={selectedAccounts.length === accounts.length} onCheckedChange={() => toggleAll('accounts')}/><Label htmlFor="acc-all" className="mb-0 font-normal">Todas</Label></div>
                {accounts.map(a => <div key={a.id} className="flex items-center gap-2"><Checkbox id={`acc-${a.id}`} checked={selectedAccounts.includes(a.id)} onCheckedChange={() => toggleItem(a.id, 'accounts')}/><Label htmlFor={`acc-${a.id}`} className="mb-0 font-normal">{a.name}</Label></div>)}
              </div>
            </div>
            <div>
              <Label>Cartões</Label>
              <div className="max-h-32 overflow-y-auto space-y-2 rounded-md border p-2 dark:border-slate-700">
                <div className="flex items-center gap-2"><Checkbox id="card-all" checked={selectedCards.length === cards.length} onCheckedChange={() => toggleAll('cards')}/><Label htmlFor="card-all" className="mb-0 font-normal">Todos</Label></div>
                {cards.map(c => <div key={c.id} className="flex items-center gap-2"><Checkbox id={`card-${c.id}`} checked={selectedCards.includes(c.id)} onCheckedChange={() => toggleItem(c.id, 'cards')}/><Label htmlFor={`card-${c.id}`} className="mb-0 font-normal">{c.name}</Label></div>)}
              </div>
            </div>
            <div>
              <Label>Categorias</Label>
              <div className="max-h-32 overflow-y-auto space-y-2 rounded-md border p-2 dark:border-slate-700">
                 <div className="flex items-center gap-2"><Checkbox id="cat-all" checked={selectedCategories.length === categories.length} onCheckedChange={() => toggleAll('categories')}/><Label htmlFor="cat-all" className="mb-0 font-normal">Todas</Label></div>
                {categories.map(c => <div key={c.id} className="flex items-center gap-2"><Checkbox id={`cat-${c.id}`} checked={selectedCategories.includes(c.id)} onCheckedChange={() => toggleItem(c.id, 'categories')}/><Label htmlFor={`cat-${c.id}`} className="mb-0 font-normal">{c.name}</Label></div>)}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 p-1 rounded-lg bg-slate-200 dark:bg-slate-800">
        <Button onClick={() => setReportType('evolution')} variant={reportType==='evolution' ? 'default' : 'ghost'} className="flex-1"><LineChartIcon className="w-4 h-4 mr-2"/>Evolução Mensal</Button>
        <Button onClick={() => setReportType('category')} variant={reportType==='category' ? 'default' : 'ghost'} className="flex-1"><PieChartIcon className="w-4 h-4 mr-2"/>Análise por Categoria</Button>
        <Button onClick={() => setReportType('comparison')} variant={reportType==='comparison' ? 'default' : 'ghost'} className="flex-1"><Replace className="w-4 h-4 mr-2"/>Comparativo</Button>
      </div>

      <div className="overflow-x-auto space-y-6">
        {renderReportContent()}
      </div>
      </div>
      <ReportSummary
        reportType={reportType}
        evolutionData={reportData.evolutionDataA}
        categoryData={reportData.categoryDataA}
        comparisonData={comparisonData}
      />
    </div>
  );
};

export default ReportsPage;