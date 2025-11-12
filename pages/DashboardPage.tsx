import React, { useMemo, useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area, CartesianGrid, LineChart, Line } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, Wallet, AlertTriangle, FileText, Repeat, RefreshCw, Plus, Filter, Edit3, Trash2, CheckCircle2, Clock, BarChart3, LineChart as LineChartIcon, AreaChart as AreaChartIcon, PieChart as PieChartIcon, Layers, ChevronLeft, ChevronRight, Target, BrainCircuit, Lightbulb, TrendingUp } from 'lucide-react';
// FIX: Aliased Card type import to CardType to resolve name collision with Card component.
import { Transaction, Account, Card as CardType, Transfer, RecurringItem, Category, UnpayInvoiceDetails, User as UserType } from '../types';
import { toCurrency, displayDate, monthKey, addMonths, displayMonthYear, getInvoiceMonthKey, getInvoiceDueDate, cn } from '../utils/helpers';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Label } from '../components/ui/Label';
import SummaryCard from '../components/shared/SummaryCard';
import RecurringList from '../components/recurring/RecurringList';
import { PIE_COLORS } from '../data/initialData';
import AnimatedItem from '../components/animations/AnimatedItem';

interface DashboardPageProps {
  transactions: Transaction[];
  filters: { description: string; categoryId: string; accountId: string; cardId: string; status: string; startDate: string; endDate: string; };
  accounts: Account[];
  // FIX: Updated cards prop to use aliased CardType.
  cards: CardType[];
  transfers: Transfer[];
  recurring: RecurringItem[];
  categories: Category[];
  getCategoryName: (id: string | null) => string;
  getInstallmentDueDate: (tx: Transaction, inst: any) => string;
  addToast: (message: string, type?: 'error' | 'success') => void;
  onPayInvoice: (cardId: string, month: string) => void;
  onUnpayInvoice: (details: UnpayInvoiceDetails) => void;
  onAddTransaction: () => void;
  onAddRecurring: () => void;
  onEditRecurring: (item: RecurringItem) => void;
  onViewTransaction: (tx: Transaction) => void;
  // FIX: Changed prop types to accept state setter functions.
  onUpdateRecurring: React.Dispatch<React.SetStateAction<RecurringItem[]>>;
  onRemoveRecurring: React.Dispatch<React.SetStateAction<RecurringItem[]>>;
  onAddTransfer: () => void;
  onEditTransfer: (t: Transfer) => void;
  onDeleteTransfer: (id: string) => void;
  onOpenFilter: () => void;
  ownerProfile: UserType;
  isLoading: boolean;
}

const InsightCard: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; }> = ({ icon, title, children }) => (
  <Card className="bg-indigo-50 dark:bg-slate-800/50 border-indigo-200 dark:border-slate-700/50">
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-indigo-800 dark:text-indigo-300">{title}</CardTitle>
      <span className="text-indigo-500 animate-pulse">{icon}</span>
    </CardHeader>
    <CardContent>
      <div className="text-sm text-slate-600 dark:text-slate-400">
        {children}
      </div>
    </CardContent>
  </Card>
);


const DashboardPage: React.FC<DashboardPageProps> = (props) => {
    const {
        transactions, filters, accounts, cards, transfers, recurring, categories,
        getCategoryName, getInstallmentDueDate, addToast,
        onPayInvoice, onUnpayInvoice, onAddTransaction,
        onViewTransaction, onAddRecurring, onEditRecurring, onUpdateRecurring,
        onRemoveRecurring, onAddTransfer, onEditTransfer, onDeleteTransfer, onOpenFilter,
        ownerProfile,
        isLoading
    } = props;

  const [mainTab, setMainTab] = useState('transactions');
  const [summaryChartPeriod, setSummaryChartPeriod] = useState(6);
  const [trendChartPeriod, setTrendChartPeriod] = useState(6);
  const [projectionChartPeriod, setProjectionChartPeriod] = useState(6);
  const [invoiceMonth, setInvoiceMonth] = useState(new Date());
  const [invoiceOverviewRange, setInvoiceOverviewRange] = useState(6);
  const [currentInsight, setCurrentInsight] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  
  const [summaryChartType, setSummaryChartType] = useState<'bar' | 'line' | 'pie' | 'stacked'>('bar');
  const [trendsChartType, setTrendsChartType] = useState<'bar' | 'line' | 'area'>('bar');
  const [projectionsChartType, setProjectionsChartType] = useState<'area' | 'line' | 'bar'>('area');

  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) return 'Bom dia';
    if (hour >= 12 && hour < 18) return 'Boa tarde';
    return 'Boa noite';
  }, []);

  const greetingImage = useMemo(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) { // Morning
      return "https://images.unsplash.com/photo-1470252649378-9c29740c9fa8?q=80&w=2070&auto=format&fit=crop";
    }
    if (hour >= 12 && hour < 18) { // Afternoon
      return "https://images.unsplash.com/photo-1590302521915-320b33035540?q=80&w=2070&auto=format&fit=crop";
    }
    // Night
    return "https://images.unsplash.com/photo-1534796636912-3b95b3ab5986?q=80&w=2071&auto=format&fit=crop";
  }, []);

    const insights = [
    {
      icon: <BrainCircuit size={20} />,
      title: "Análise da Yara",
      content: "Nossa IA está analisando seus dados para gerar insights valiosos em breve."
    },
    {
      icon: <Lightbulb size={20} />,
      title: "Oportunidade de Economia",
      content: "Aguarde! Em breve, você receberá dicas personalizadas para economizar mais."
    },
    {
      icon: <TrendingUp size={20} />,
      title: "Projeção Inteligente",
      content: "A Yara está calculando as projeções para seu futuro financeiro. Volte em breve!"
    }
  ];

  const nextInsight = () => {
    setCurrentInsight(prev => (prev + 1) % insights.length);
  };

  const prevInsight = () => {
    setCurrentInsight(prev => (prev - 1 + insights.length) % insights.length);
  };

  useEffect(() => {
    const autoPlayInterval = setInterval(nextInsight, 5000);
    return () => clearInterval(autoPlayInterval);
  }, [currentInsight]);

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX - touchEndX;
    if (diff > 50) { // Swiped left
      nextInsight();
    } else if (diff < -50) { // Swiped right
      prevInsight();
    }
    setTouchStartX(null);
  };

  const totalBalance = useMemo(() => accounts.reduce((acc, a) => acc + a.balance, 0), [accounts]);
  
  const displayTransactions = useMemo(() => {
    return transactions
      .filter(t => t.person !== 'Ajuste Interno')
      .filter(t => !filters.description || t.desc.toLowerCase().includes(filters.description.toLowerCase()))
      .filter(t => !filters.categoryId || t.categoryId === filters.categoryId)
      .filter(t => !filters.accountId || t.account === filters.accountId)
      .filter(t => !filters.cardId || t.card === filters.cardId)
      .filter(t => filters.status === 'all' || t.paid === (filters.status === 'paid'))
      .filter(t => {
        // Enhanced date filtering to include overdue pending items by default
        const isAfterStartDate = !filters.startDate || t.date >= filters.startDate;
        const isBeforeEndDate = !filters.endDate || t.date <= filters.endDate;
  
        // If an item is pending, it should appear as long as it's not after a defined end date.
        // This naturally includes all past (overdue) and future pending items if no end date is set.
        if (!t.paid) {
          return isBeforeEndDate;
        }
        
        // If an item is paid, it must be within the specified date range.
        return isAfterStartDate && isBeforeEndDate;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filters]);

  const summaryData = useMemo(() => {
    return transactions.reduce((acc, t) => {
      t.installmentsSchedule.forEach(s => {
        const amount = s.paidAmount || s.amount;
        if (s.paid) {
          if (t.isIncome) acc.paidIncome += amount; else acc.paidExpense += amount;
        } else if (!t.isIncome) {
          acc.pendingBills += amount;
        }
      });
      return acc;
    }, { paidIncome: 0, paidExpense: 0, pendingBills: 0 });
  }, [transactions]);
  
  const categoryExpenseData = useMemo(() => {
    const expenses: { [key: string]: { name: string, value: number, id: string } } = {};
    let totalPaidExpense = 0;
    
    transactions.forEach(t => {
      if (t.isIncome) return;
      t.installmentsSchedule.forEach(s => {
        if (s.paid) {
          const catId = t.categoryId || 'none';
          expenses[catId] = expenses[catId] || { name: getCategoryName(catId), value: 0, id: catId };
          expenses[catId].value += s.paidAmount || s.amount;
          totalPaidExpense += s.paidAmount || s.amount;
        }
      });
    });

    if (totalPaidExpense === 0) return [];
    return Object.values(expenses)
      .map((cat, index) => ({ ...cat, percentage: (cat.value / totalPaidExpense) * 100, fill: PIE_COLORS[index % PIE_COLORS.length] }))
      .sort((a, b) => b.value - a.value);
  }, [transactions, getCategoryName]);

  const upcomingPaymentsData = useMemo(() => {
    const payments: { id: string, desc: string, amount: number, date: string }[] = [];
    const today = new Date().toISOString().slice(0, 10);
    const futureLimit = addMonths(new Date(), 2).toISOString().slice(0, 10);
    
    transactions.forEach(t => {
      if (t.isIncome) return;
      t.installmentsSchedule.forEach(s => {
        const dueDate = getInstallmentDueDate(t, s);
        if (!s.paid && dueDate >= today && dueDate <= futureLimit) {
          payments.push({ id: `${t.id}-${s.id}`, desc: `${t.desc} (Parc. ${s.id}/${t.installments})`, amount: s.amount, date: dueDate });
        }
      });
    });
    return payments.sort((a,b) => a.date.localeCompare(b.date)).slice(0, 5);
  }, [transactions, getInstallmentDueDate]);

  const summaryByTypeData = useMemo(() => {
    const statements: { [key: string]: { month: string, cartao: number, prazo: number, vista: number } } = {};
    const today = new Date();
    
    const startMonth = addMonths(today, -summaryChartPeriod);
    
    // Always show one month into the future for better visualization context
    const endMonth = addMonths(today, 1);

    for (let d = startMonth; d <= endMonth; d = addMonths(d, 1)) {
      statements[monthKey(d)] = { month: monthKey(d), cartao: 0, prazo: 0, vista: 0 };
    }
    
    transactions.forEach(t => {
      if (t.isIncome) return;
      t.installmentsSchedule.forEach(s => {
        const m = monthKey(s.postingDate);
        if (statements[m]) {
          if (t.type === 'card') statements[m].cartao += s.amount;
          else if (t.type === 'prazo') statements[m].prazo += s.amount;
          else if (t.type === 'cash') statements[m].vista += s.amount;
        }
      });
    });
    return Object.values(statements).sort((a,b) => a.month.localeCompare(b.month));
  }, [transactions, summaryChartPeriod]);

  const summaryPieData = useMemo(() => {
    const totals = summaryByTypeData.reduce((acc, monthData) => {
        acc.cartao += monthData.cartao;
        acc.prazo += monthData.prazo;
        acc.vista += monthData.vista;
        return acc;
    }, { cartao: 0, prazo: 0, vista: 0 });

    return [
        { name: 'Cartão', value: totals.cartao, fill: '#6366f1' },
        { name: 'A Prazo', value: totals.prazo, fill: '#facc15' },
        { name: 'À Vista', value: totals.vista, fill: '#22c55e' },
    ].filter(d => d.value > 0);
  }, [summaryByTypeData]);

  const trendData = useMemo(() => {
    const statements: { [key: string]: { month: string, income: number, expense: number } } = {};
    const today = new Date();
    
    const startMonth = addMonths(today, -trendChartPeriod);
    const endMonth = addMonths(today, 1);
    
    const startDate = startMonth.toISOString().slice(0,10);
    const endDate = endMonth.toISOString().slice(0,10);
    
    for (let d = startMonth; d <= endMonth; d = addMonths(d, 1)) {
      statements[monthKey(d)] = { month: monthKey(d), income: 0, expense: 0 };
    }
    
    let totalIncome = 0; let totalExpense = 0;

    transactions.forEach(t => {
      t.installmentsSchedule.forEach(s => {
        if (s.paid && s.paymentDate && s.paymentDate >= startDate && s.paymentDate <= endDate) {
          const m = monthKey(s.paymentDate);
          const paidAmount = s.paidAmount || s.amount;
          if (statements[m]) {
            if (t.isIncome) { statements[m].income += paidAmount; totalIncome += paidAmount; }
            else { statements[m].expense += paidAmount; totalExpense += paidAmount; }
          }
        }
      });
    });
    
    return { monthlyData: Object.values(statements).sort((a,b) => a.month.localeCompare(b.month)), totalIncome, totalExpense, totalBalance: totalIncome - totalExpense };
  }, [transactions, trendChartPeriod]);
  
  const projectionData = useMemo(() => {
    let currentBalance = totalBalance;
    const projections = [];
    const today = new Date();

    projections.push({ month: "Atual", "Saldo Projetado": currentBalance });

    for (let i = 1; i <= projectionChartPeriod; i++) {
        const targetMonthDate = addMonths(today, i);
        const targetMonthKey = monthKey(targetMonthDate);
        
        let income = 0;
        let expense = 0;

        recurring.forEach(r => {
            if (r.enabled) {
                if (r.isIncome) income += r.amount; else expense += r.amount;
            }
        });

        transactions.forEach(t => {
            if (t.isIncome) return;
            t.installmentsSchedule.forEach(s => {
                if (!s.paid) {
                    const dueDate = getInstallmentDueDate(t, s);
                    if (monthKey(new Date(dueDate + 'T12:00:00Z')) === targetMonthKey) {
                        expense += s.amount;
                    }
                }
            });
        });
        
        currentBalance += income - expense;
        projections.push({
            month: displayMonthYear(targetMonthKey).split(' de ')[0].substring(0, 3),
            "Saldo Projetado": Math.round(currentBalance * 100) / 100
        });
    }
    return projections;
  }, [totalBalance, recurring, transactions, getInstallmentDueDate, projectionChartPeriod]);

  const internalMovements = useMemo(() => {
    const fromTransfers = transfers.map(t => ({ id: t.id, desc: `Transferência`, from: accounts.find(a=>a.id===t.fromAccount)?.name || 'N/A', to: accounts.find(a=>a.id===t.toAccount)?.name || 'N/A', amount: t.amount, date: t.date, type: 'transfer' as const }));
    const fromAdjustments = transactions.filter(t => t.person === 'Ajuste Interno').map(t => ({ id: t.id, desc: t.desc, from: t.isIncome ? 'Externo' : (accounts.find(a=>a.id===t.account)?.name || 'N/A'), to: t.isIncome ? (accounts.find(a=>a.id===t.account)?.name || 'N/A') : 'Externo', amount: t.amount, date: t.date, type: 'adjustment' as const, originalTx: t}));
    const fromGoals = transactions.filter(t => t.person === 'Meta').map(t => ({
        id: t.id,
        desc: t.desc,
        from: t.isIncome 
            ? t.desc.replace('Resgate Meta: ', 'Meta: ')
            : accounts.find(a => a.id === t.account)?.name || 'N/A',
        to: t.isIncome 
            ? accounts.find(a => a.id === t.account)?.name || 'N/A' 
            : t.desc.replace('Aplicação Meta: ', 'Meta: '),
        amount: t.amount,
        date: t.date,
        type: 'goal' as const,
        originalTx: t
    }));
    return [...fromTransfers, ...fromAdjustments, ...fromGoals].sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, transfers, accounts]);
  
    const invoiceOverviewData = useMemo(() => {
    const range = invoiceOverviewRange;
    const today = new Date();
    const results: { [key: string]: { monthKey: string; total: number } } = {};

    const cardTransactions = transactions.filter(t => t.type === 'card' && !t.isIncome);

    for (let i = -range; i <= range; i++) {
        const targetMonthDate = addMonths(today, i);
        const targetMonthKey = monthKey(targetMonthDate);
        results[targetMonthKey] = { monthKey: targetMonthKey, total: 0 };
    }

    cards.forEach(card => {
        cardTransactions.forEach(tx => {
            if (tx.card !== card.id) return;
            tx.installmentsSchedule.forEach(inst => {
                const invoiceMonth = getInvoiceMonthKey(inst.postingDate, card.closingDay);
                if (results[invoiceMonth]) {
                    results[invoiceMonth].total += inst.amount;
                }
            });
        });
    });

    return Object.values(results)
        .filter(r => r.total > 0)
        .sort((a, b) => a.monthKey.localeCompare(b.monthKey));
  }, [transactions, cards, invoiceOverviewRange, getInvoiceMonthKey]);


  const yAxisFormatter = (value: number) => {
    if (Math.abs(value) >= 1000) {
        return `${(value / 1000).toLocaleString('pt-BR', { maximumFractionDigits: 1 })}k`;
    }
    return value.toLocaleString('pt-BR');
  };

  return (
    <div className="space-y-6">
      <AnimatedItem>
        <div className="relative rounded-xl overflow-hidden mb-6 p-8 min-h-[160px] flex flex-col justify-center text-white bg-slate-900">
            <img
                src={greetingImage}
                alt="Imagem de saudação contextual"
                className="absolute inset-0 w-full h-full object-cover opacity-30"
                aria-hidden="true"
            />
            <div className="relative z-10">
                <h2 className="text-3xl font-bold">{greeting}, {ownerProfile.name}!</h2>
                <p className="mt-1 text-slate-300">Aqui está um resumo de suas finanças hoje.</p>
            </div>
        </div>
      </AnimatedItem>
      
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4" data-tour-id="summary-cards">
        <AnimatedItem delay={100}><SummaryCard title="Receita Paga" value={toCurrency(summaryData.paidIncome)} colorClass="text-green-500" icon={<ArrowUpCircle />} className="p-3 sm:p-4" /></AnimatedItem>
        <AnimatedItem delay={200}><SummaryCard title="Despesa Paga" value={toCurrency(summaryData.paidExpense)} colorClass="text-red-500" icon={<ArrowDownCircle />} className="p-3 sm:p-4" /></AnimatedItem>
        <AnimatedItem delay={300}><SummaryCard title="Saldo Atual" value={toCurrency(totalBalance)} colorClass="text-indigo-500" icon={<Wallet />} className="p-3 sm:p-4" /></AnimatedItem>
        <AnimatedItem delay={400}><SummaryCard title="Contas a Pagar" value={toCurrency(summaryData.pendingBills)} colorClass="text-amber-500" icon={<AlertTriangle />} className="p-3 sm:p-4" /></AnimatedItem>
      </div>

      <div className="relative">
        {/* Desktop Grid */}
        <div className="hidden lg:grid grid-cols-1 lg:grid-cols-3 gap-6">
          {insights.map((insight, index) => (
            <AnimatedItem delay={500 + index * 100} key={index}>
              <InsightCard icon={insight.icon} title={insight.title}>
                {insight.content}
              </InsightCard>
            </AnimatedItem>
          ))}
        </div>

        {/* Mobile Carousel */}
        <AnimatedItem delay={500}>
          <div
            className="lg:hidden"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <InsightCard icon={insights[currentInsight].icon} title={insights[currentInsight].title}>
              {insights[currentInsight].content}
            </InsightCard>
          </div>
        </AnimatedItem>
        
        {/* Dots */}
        <div className="lg:hidden flex justify-center items-center gap-2 pt-8">
          {insights.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentInsight(index)}
              className={cn(
                "h-2 rounded-full transition-all",
                currentInsight === index ? "w-6 bg-indigo-500" : "w-2 bg-slate-300 dark:bg-slate-600"
              )}
              aria-label={`Ir para o insight ${index + 1}`}
            />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <AnimatedItem delay={600}>
          <Card className="lg:col-span-1">
            <CardHeader><CardTitle>Despesas por Categoria</CardTitle></CardHeader>
            <CardContent>{categoryExpenseData.length > 0 ? (<>
                  <ResponsiveContainer width="100%" height={200}><PieChart><Pie data={categoryExpenseData} cx="50%" cy="50%" innerRadius={60} outerRadius={80} fill="#8884d8" paddingAngle={2} dataKey="value">{categoryExpenseData.map((entry, index) => (<Cell key={`cell-${index}`} fill={entry.fill} />))}</Pie><Tooltip formatter={(value: number) => toCurrency(value)} /></PieChart></ResponsiveContainer>
                  <div className="mt-4 space-y-2 text-sm">{categoryExpenseData.map((entry) => (<div key={entry.id} className="flex justify-between items-center"><div className="flex items-center gap-2"><span className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.fill }}></span><span>{entry.name}</span></div><span className="font-medium">{entry.percentage.toFixed(1)}%</span></div>))}</div>
                  </>) : (<div className="h-[200px] flex items-center justify-center text-slate-500">Nenhuma despesa paga.</div>)}
            </CardContent>
          </Card>
        </AnimatedItem>

        <AnimatedItem delay={700}>
          <Card className="lg:col-span-2">
              <CardHeader><CardTitle>Próximos Pagamentos</CardTitle></CardHeader>
              <CardContent>
                  {upcomingPaymentsData.length > 0 ? (
                      <ul className="divide-y divide-slate-200 dark:divide-slate-700">
                          {upcomingPaymentsData.map((payment) => (
                              <li key={payment.id} className="py-3 sm:py-4 flex items-center space-x-4">
                                  <div className="flex-shrink-0"><span className="flex h-8 w-8 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900"><AlertTriangle className="h-4 w-4 text-amber-500" /></span></div>
                                  <div className="flex-1 min-w-0"><p className="text-sm font-medium truncate">{payment.desc}</p><p className="text-sm text-slate-500 dark:text-slate-400 truncate">Venc: {displayDate(payment.date)}</p></div>
                                  <div className="inline-flex items-center text-base font-semibold text-red-500">{toCurrency(payment.amount)}</div>
                              </li>
                          ))}
                      </ul>
                  ) : (<div className="h-[200px] flex items-center justify-center text-slate-500">Nenhum pagamento pendente.</div>)}
              </CardContent>
          </Card>
        </AnimatedItem>
      </div>

      <AnimatedItem delay={800}>
        <Card>
          <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center !pb-2 gap-2">
            <CardTitle>Resumo Geral</CardTitle>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1 p-0.5 rounded-md border bg-slate-100 dark:bg-slate-800">
                  <Button onClick={() => setSummaryChartType('bar')} variant={summaryChartType === 'bar' ? 'default' : 'ghost'} size="sm" className="h-7 px-2" aria-label="Ver gráfico em barras"><BarChart3 className="w-4 h-4"/></Button>
                  <Button onClick={() => setSummaryChartType('stacked')} variant={summaryChartType === 'stacked' ? 'default' : 'ghost'} size="sm" className="h-7 px-2" aria-label="Ver gráfico em barras empilhadas"><Layers className="w-4 h-4"/></Button>
                  <Button onClick={() => setSummaryChartType('line')} variant={summaryChartType === 'line' ? 'default' : 'ghost'} size="sm" className="h-7 px-2" aria-label="Ver gráfico de linhas"><LineChartIcon className="w-4 h-4"/></Button>
                  <Button onClick={() => setSummaryChartType('pie')} variant={summaryChartType === 'pie' ? 'default' : 'ghost'} size="sm" className="h-7 px-2" aria-label="Ver gráfico de pizza"><PieChartIcon className="w-4 h-4"/></Button>
              </div>
              <div className="text-sm flex items-center gap-2">
                <Label htmlFor="summary-period" className="mb-0">Período</Label>
                <select id="summary-period" value={summaryChartPeriod} onChange={e => setSummaryChartPeriod(parseInt(e.target.value))} className="p-1 rounded border dark:bg-slate-700 h-8 text-xs"><option value={3}>3 meses</option><option value={6}>6 meses</option><option value={12}>12 meses</option></select>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={260}>
              {summaryChartType === 'bar' ? (
                  <BarChart data={summaryByTypeData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}><XAxis dataKey="month" stroke="currentColor" className="text-xs" /><YAxis stroke="currentColor" tickFormatter={(v: number) => v.toFixed(0)} /><Tooltip formatter={(v: number) => toCurrency(v)} /><Legend /><Bar dataKey="cartao" name="Cartão" fill="#6366f1" radius={[4, 4, 0, 0]} /><Bar dataKey="prazo" name="A prazo" fill="#facc15" radius={[4, 4, 0, 0]} /><Bar dataKey="vista" name="À vista" fill="#22c55e" radius={[4, 4, 0, 0]} /></BarChart>
              ) : summaryChartType === 'stacked' ? (
                  <BarChart data={summaryByTypeData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}><XAxis dataKey="month" stroke="currentColor" className="text-xs" /><YAxis stroke="currentColor" tickFormatter={(v: number) => v.toFixed(0)} /><Tooltip formatter={(v: number) => toCurrency(v)} /><Legend /><Bar dataKey="cartao" name="Cartão" fill="#6366f1" stackId="a" radius={[4, 4, 0, 0]} /><Bar dataKey="prazo" name="A prazo" fill="#facc15" stackId="a" /><Bar dataKey="vista" name="À vista" fill="#22c55e" stackId="a" radius={[0, 0, 4, 4]} /></BarChart>
              ) : summaryChartType === 'pie' ? (
                  <PieChart><Tooltip formatter={(value: number) => toCurrency(value)} /><Legend /><Pie data={summaryPieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100}>{summaryPieData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}</Pie></PieChart>
              ) : (
                  <LineChart data={summaryByTypeData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}><XAxis dataKey="month" stroke="currentColor" className="text-xs" /><YAxis stroke="currentColor" tickFormatter={(v: number) => v.toFixed(0)} /><Tooltip formatter={(v: number) => toCurrency(v)} /><Legend /><Line type="monotone" dataKey="cartao" name="Cartão" stroke="#6366f1" strokeWidth={2} /><Line type="monotone" dataKey="prazo" name="A prazo" stroke="#facc15" strokeWidth={2} /><Line type="monotone" dataKey="vista" name="À vista" stroke="#22c55e" strokeWidth={2} /></LineChart>
              )}
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </AnimatedItem>
      
      <AnimatedItem delay={900}>
        <div className="border-b border-slate-300 dark:border-slate-700">
          <nav className="-mb-px flex space-x-6">
            <button onClick={() => setMainTab('transactions')} className={`py-3 px-1 border-b-2 text-sm ${mainTab === 'transactions' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>Transações</button>
            <button onClick={() => setMainTab('invoices')} className={`py-3 px-1 border-b-2 text-sm ${mainTab === 'invoices' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>Faturas</button>
            <button onClick={() => setMainTab('recurring')} className={`py-3 px-1 border-b-2 text-sm ${mainTab === 'recurring' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>Recorrências</button>
            <button onClick={() => setMainTab('transfers')} className={`py-3 px-1 border-b-2 text-sm ${mainTab === 'transfers' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-slate-500'}`}>Transferências</button>
          </nav>
        </div>
      </AnimatedItem>

        {mainTab === 'transactions' && (
             <Card data-tour-id="transactions-list">
                <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                  <CardTitle>Transações</CardTitle>
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button onClick={onOpenFilter} size="sm" variant="outline" className="relative w-full sm:w-auto"><Filter className="w-4 h-4 mr-1.5" />Filtrar</Button>
                    <div data-tour-id="add-transaction-button">
                      <Button onClick={onAddTransaction} size="sm" className="w-full sm:w-auto"><Plus className="w-4 h-4 mr-1.5" /> Adicionar</Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto"><table className="min-w-full text-sm">
                      <thead className="border-b border-slate-200 dark:border-slate-700">
                        <tr>
                          <th className="p-3 text-left font-semibold">Descrição</th>
                          <th className="p-3 text-right font-semibold">Valor</th>
                          <th className="p-3 text-left font-semibold hidden sm:table-cell">Data</th>
                          <th className="p-3 text-center font-semibold">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayTransactions.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="text-center py-16">
                              <div className="flex flex-col items-center gap-2 text-slate-500">
                                <FileText className="w-12 h-12" />
                                <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-200 mt-2">Nenhuma transação encontrada</h3>
                                <p className="text-sm">Comece a registrar suas movimentações financeiras.</p>
                                <Button onClick={onAddTransaction} size="sm" className="mt-4">
                                  <Plus className="w-4 h-4 mr-1.5" /> Adicionar Primeira Transação
                                </Button>
                              </div>
                            </td>
                          </tr>
                        ) : (
                          displayTransactions.map(t => (
                            <tr 
                              key={t.id} 
                              className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer"
                              onClick={() => onViewTransaction(t)}
                              tabIndex={0}
                              onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') onViewTransaction(t); }}
                            >
                              <td className="p-3">
                                <p className="font-medium">{t.desc}</p>
                                <p className="text-xs text-slate-500">{getCategoryName(t.categoryId)}</p>
                              </td>
                              <td className={`p-3 text-right font-medium ${t.isIncome ? 'text-green-500' : 'text-red-500'}`}>
                                {toCurrency(t.amount)}
                              </td>
                              <td className="p-3 hidden sm:table-cell">{displayDate(t.date)}</td>
                              <td className="p-3 text-center"><span className={`text-xs px-2 py-1 rounded-full ${t.paid ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300' : 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'}`}>{t.paid ? 'Pago' : 'Pendente'}</span></td>
                            </tr>
                          ))
                        )}
                      </tbody>
                  </table></div>
                </CardContent>
            </Card>
        )}
        
        {mainTab === 'invoices' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                  <div className="flex justify-between items-center">
                      <CardTitle>Visão Geral das Faturas</CardTitle>
                      <div className="text-sm flex items-center gap-2">
                        <Label htmlFor="invoice-overview-period" className="mb-0">Período</Label>
                        <select 
                            id="invoice-overview-period"
                            value={invoiceOverviewRange} 
                            onChange={e => setInvoiceOverviewRange(parseInt(e.target.value))} 
                            className="p-1 rounded border dark:bg-slate-700 h-8 text-xs"
                        >
                            <option value={3}>±3 meses</option>
                            <option value={6}>±6 meses</option>
                            <option value={12}>±12 meses</option>
                        </select>
                      </div>
                  </div>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto max-h-60">
                  <table className="min-w-full text-sm">
                    <thead className="sticky top-0 bg-slate-50 dark:bg-slate-800/50">
                      <tr>
                        <th className="p-2 text-left font-semibold">Mês</th>
                        <th className="p-2 text-right font-semibold">Valor Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoiceOverviewData.length === 0 ? (
                         <tr><td colSpan={2} className="text-center py-8 text-slate-500">Nenhuma fatura no período.</td></tr>
                      ) : (
                        invoiceOverviewData.map(row => (
                          <tr 
                            key={row.monthKey} 
                            className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
                            onClick={() => setInvoiceMonth(new Date(row.monthKey + '-02T12:00:00Z'))}
                            tabIndex={0}
                            onKeyDown={(e) => { if(e.key === 'Enter' || e.key === ' ') setInvoiceMonth(new Date(row.monthKey + '-02T12:00:00Z')); }}
                          >
                            <td className="p-2">{displayMonthYear(row.monthKey)}</td>
                            <td className="p-2 text-right font-medium">{toCurrency(row.total)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex justify-between items-center">
                        <CardTitle>Detalhes da Fatura</CardTitle>
                        <div className="flex items-center gap-2">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setInvoiceMonth(addMonths(invoiceMonth, -1))} aria-label="Mês anterior">
                                <ChevronLeft className="w-4 h-4" />
                            </Button>
                            <span className="font-semibold text-sm w-32 text-center" aria-live="polite">{displayMonthYear(monthKey(invoiceMonth))}</span>
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => setInvoiceMonth(addMonths(invoiceMonth, 1))} aria-label="Próximo mês">
                                <ChevronRight className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {cards.filter(c => !c.deleted).length === 0 ? (
                        <div className="text-center text-slate-500 py-12">
                            Nenhum cartão cadastrado.
                        </div>
                    ) : cards.map(card => {
                        const selectedMonthKey = monthKey(invoiceMonth);
                        const groupedInvoices = transactions.filter(t => t.card === card.id).reduce((acc, tx) => {
                            tx.installmentsSchedule.forEach(s => {
                                const m = getInvoiceMonthKey(s.postingDate, card.closingDay);
                                acc[m] = acc[m] || { total: 0, items: [], accountId: tx.account };
                                if(!s.paid) acc[m].total += s.amount;
                                acc[m].items.push({ ...s, tx });
                            });
                            return acc;
                        }, {} as Record<string, { total: number; items: any[]; accountId: string; }>);

                        const invoiceForMonth = groupedInvoices[selectedMonthKey];
                        const isCardDeleted = !!card.deleted;

                        return (<div key={card.id} className="mb-6">
                            <h4 className="font-semibold text-lg mb-2">{card.name}{isCardDeleted ? ' (Excluído)' : ''}</h4>
                            {!invoiceForMonth || invoiceForMonth.items.length === 0 ? (
                                <div className="text-sm text-slate-500 text-center py-8 border rounded-md mt-2 bg-slate-50 dark:bg-slate-800/50">
                                    Nenhuma fatura para este cartão no mês selecionado.
                                </div>
                            ) : (
                                <div className="border p-4 rounded-lg bg-slate-50 dark:bg-slate-800/50">
                                    <div className="flex justify-between items-start mb-3">
                                      <div>
                                        <span className="font-semibold">{displayMonthYear(selectedMonthKey)}</span>
                                        <p className="text-xs text-slate-500 dark:text-slate-400">
                                            Vencimento: {displayDate(getInvoiceDueDate(invoiceForMonth.items[0].postingDate, card.closingDay, card.dueDay))}
                                        </p>
                                      </div>
                                      <div className="flex items-center gap-2">
                                          <span className="font-semibold text-lg">{toCurrency(invoiceForMonth.total)}</span>
                                          <div className="flex flex-col gap-1">
                                            <Button size="sm" loading={isLoading} disabled={invoiceForMonth.total <= 0.005 || isCardDeleted} onClick={() => onPayInvoice(card.id, selectedMonthKey)}>Pagar</Button>
                                            {invoiceForMonth.total <= 0.005 && <Button size="sm" variant="outline" loading={isLoading} onClick={() => onUnpayInvoice({cardId: card.id, month: selectedMonthKey, accountId: invoiceForMonth.accountId, total: invoiceForMonth.items.filter(i => i.paid).reduce((sum: number, i: any) => sum + (i.paidAmount || i.amount), 0)})} disabled={isCardDeleted} title={isCardDeleted ? "Não é possível estornar faturas de cartões excluídos." : ""}>Estornar</Button>}
                                          </div>
                                      </div>
                                    </div>
                                    <div className="text-sm space-y-1.5 divide-y divide-slate-200 dark:divide-slate-700">
                                        {invoiceForMonth.items.map((s, i) => (
                                            <div key={i} className={`flex justify-between pt-1.5 first:pt-0 ${s.paid ? 'text-green-600' : ''}`}>
                                                <span>{s.tx.desc} - {s.id}/{s.tx.installments}</span>
                                                <span>{toCurrency(s.amount)}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>);
                    })}
                </CardContent>
            </Card>
          </div>
        )}
      
        {mainTab === 'recurring' && <Card><CardHeader className="flex flex-row items-center gap-4"><CardTitle>Recorrências</CardTitle><Button onClick={onAddRecurring} size="sm"><Plus className="w-4 h-4 mr-1"/> Adicionar</Button></CardHeader><CardContent><RecurringList recurring={recurring} onAdd={onAddRecurring} onEdit={onEditRecurring} onUpdate={(item) => onUpdateRecurring(prev => prev.map(r => r.id === item.id ? item : r))} onRemove={(id) => onRemoveRecurring(prev => prev.filter(r => r.id !== id))} accounts={accounts} cards={cards} categories={categories} /></CardContent></Card>}
        
        {mainTab === 'transfers' && <Card><CardHeader className="flex flex-row items-center gap-4"><CardTitle>Transferências e Movimentações Internas</CardTitle><Button onClick={onAddTransfer} size="sm"><Plus className="w-4 h-4 mr-1"/>Adicionar</Button></CardHeader><CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="border-b border-slate-200 dark:border-slate-700">
                  <tr>
                    <th className="p-3 font-semibold">Descrição</th>
                    <th className="p-3 font-semibold">Origem</th>
                    <th className="p-3 font-semibold">Destino</th>
                    <th className="p-3 font-semibold text-right">Valor</th>
                    <th className="p-3 font-semibold">Data</th>
                    <th className="p-3 font-semibold text-center">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {internalMovements.length === 0 ? (
                    <tr>
                       <td colSpan={6} className="text-center py-16">
                          <div className="flex flex-col items-center gap-2 text-slate-500">
                            <RefreshCw className="w-12 h-12" />
                            <h3 className="font-semibold text-lg text-slate-700 dark:text-slate-200 mt-2">Nenhuma transferência</h3>
                            <p className="text-sm">Registre movimentações entre suas contas aqui.</p>
                            <Button onClick={onAddTransfer} size="sm" className="mt-4">
                              <Plus className="w-4 h-4 mr-1.5" /> Adicionar Transferência
                            </Button>
                          </div>
                        </td>
                    </tr>
                  ) : (
                    internalMovements.map(mov => (
                      <tr key={mov.id} className="border-b border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <td className="p-3">{mov.desc}</td>
                        <td className="p-3">{mov.from}</td>
                        <td className="p-3">{mov.to}</td>
                        <td className="p-3 text-right">{toCurrency(mov.amount)}</td>
                        <td className="p-3">{displayDate(mov.date)}</td>
                        <td className="p-3 text-center">
                          {mov.type === 'transfer' ? (
                            <div className="flex justify-center gap-1">
                              <Button size="icon" variant="ghost" className="h-8 w-8" aria-label={`Editar transferência de ${toCurrency(mov.amount)}`} onClick={() => onEditTransfer(transfers.find(t => t.id === mov.id)!)}><Edit3 className="w-4 h-4"/></Button>
                              <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" aria-label={`Excluir transferência de ${toCurrency(mov.amount)}`} onClick={() => onDeleteTransfer(mov.id)}><Trash2 className="w-4 h-4"/></Button>
                            </div>
                          ) : mov.originalTx ? (
                            <Button size="sm" variant="outline" onClick={() => onViewTransaction(mov.originalTx)}>Detalhes</Button>
                          ) : null}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            </CardContent></Card>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
          <Card>
              <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center !pb-2 gap-2">
                  <CardTitle>Tendência Financeira</CardTitle>
                  <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 p-0.5 rounded-md border bg-slate-100 dark:bg-slate-800">
                          <Button onClick={() => setTrendsChartType('bar')} variant={trendsChartType === 'bar' ? 'default' : 'ghost'} size="sm" className="h-7 px-2" aria-label="Ver gráfico de tendências em barras"><BarChart3 className="w-4 h-4"/></Button>
                          <Button onClick={() => setTrendsChartType('line')} variant={trendsChartType === 'line' ? 'default' : 'ghost'} size="sm" className="h-7 px-2" aria-label="Ver gráfico de tendências de linhas"><LineChartIcon className="w-4 h-4"/></Button>
                          <Button onClick={() => setTrendsChartType('area')} variant={trendsChartType === 'area' ? 'default' : 'ghost'} size="sm" className="h-7 px-2" aria-label="Ver gráfico de tendências de área"><AreaChartIcon className="w-4 h-4"/></Button>
                      </div>
                      <div className="text-sm flex items-center gap-2">
                          <Label htmlFor="trend-period" className="mb-0">Período</Label>
                          <select id="trend-period" value={trendChartPeriod} onChange={e => setTrendChartPeriod(parseInt(e.target.value))} className="p-1 rounded border dark:bg-slate-700 h-8 text-xs">
                              <option value={3}>3 meses</option>
                              <option value={6}>6 meses</option>
                              <option value={12}>12 meses</option>
                          </select>
                      </div>
                  </div>
              </CardHeader>
              <CardContent>
                  <ResponsiveContainer width="100%" height={260}>
                    {trendsChartType === 'bar' ? (
                      <BarChart data={trendData.monthlyData.map(d => ({ ...d, month: displayMonthYear(d.month) }))}>
                          <XAxis dataKey="month" stroke="currentColor" className="text-xs" /><YAxis stroke="currentColor" className="text-xs" tickFormatter={yAxisFormatter} /><Tooltip formatter={(v: number) => toCurrency(v)} /><Legend /><Bar dataKey="income" name="Receita" fill="#22c55e" radius={[4, 4, 0, 0]} /><Bar dataKey="expense" name="Despesa" fill="#ef4444" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    ) : trendsChartType === 'area' ? (
                      <AreaChart data={trendData.monthlyData.map(d => ({ ...d, month: displayMonthYear(d.month) }))}>
                          <XAxis dataKey="month" stroke="currentColor" className="text-xs" /><YAxis stroke="currentColor" className="text-xs" tickFormatter={yAxisFormatter} /><Tooltip formatter={(v: number) => toCurrency(v)} /><Legend />
                          <Area type="monotone" dataKey="income" name="Receita" stroke="#22c55e" fill="#22c55e" fillOpacity={0.3} />
                          <Area type="monotone" dataKey="expense" name="Despesa" stroke="#ef4444" fill="#ef4444" fillOpacity={0.3} />
                      </AreaChart>
                    ) : (
                      <LineChart data={trendData.monthlyData.map(d => ({ ...d, month: displayMonthYear(d.month) }))}>
                          <XAxis dataKey="month" stroke="currentColor" className="text-xs" /><YAxis stroke="currentColor" className="text-xs" tickFormatter={yAxisFormatter} /><Tooltip formatter={(v: number) => toCurrency(v)} /><Legend /><Line type="monotone" dataKey="income" name="Receita" stroke="#22c55e" strokeWidth={2} /><Line type="monotone" dataKey="expense" name="Despesa" stroke="#ef4444" strokeWidth={2} />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700 grid grid-cols-3 text-center">
                      <div><p className="text-sm text-slate-500">Receita Total</p><p className="font-semibold text-green-500">{toCurrency(trendData.totalIncome)}</p></div>
                      <div><p className="text-sm text-slate-500">Despesa Total</p><p className="font-semibold text-red-500">{toCurrency(trendData.totalExpense)}</p></div>
                      <div><p className="text-sm text-slate-500">Balanço</p><p className="font-semibold">{toCurrency(trendData.totalBalance)}</p></div>
                  </div>
              </CardContent>
          </Card>

          <Card>
              <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center !pb-2 gap-2">
                  <CardTitle>Projeção de Saldo</CardTitle>
                  <div className="flex items-center gap-4">
                      <div className="flex items-center gap-1 p-0.5 rounded-md border bg-slate-100 dark:bg-slate-800">
                          <Button onClick={() => setProjectionsChartType('area')} variant={projectionsChartType === 'area' ? 'default' : 'ghost'} size="sm" className="h-7 px-2" aria-label="Ver gráfico de projeção de área"><AreaChartIcon className="w-4 h-4"/></Button>
                          <Button onClick={() => setProjectionsChartType('line')} variant={projectionsChartType === 'line' ? 'default' : 'ghost'} size="sm" className="h-7 px-2" aria-label="Ver gráfico de projeção de linhas"><LineChartIcon className="w-4 h-4"/></Button>
                          <Button onClick={() => setProjectionsChartType('bar')} variant={projectionsChartType === 'bar' ? 'default' : 'ghost'} size="sm" className="h-7 px-2" aria-label="Ver gráfico de projeção de barras"><BarChart3 className="w-4 h-4"/></Button>
                      </div>
                      <div className="text-sm flex items-center gap-2">
                          <Label htmlFor="projection-period" className="mb-0">Período</Label>
                          <select id="projection-period" value={projectionChartPeriod} onChange={e => setProjectionChartPeriod(parseInt(e.target.value))} className="p-1 rounded border dark:bg-slate-700 h-8 text-xs">
                              <option value={3}>3 meses</option>
                              <option value={6}>6 meses</option>
                              <option value={12}>12 meses</option>
                          </select>
                      </div>
                  </div>
              </CardHeader>
              <CardContent>
                  <ResponsiveContainer width="100%" height={325}>
                    {projectionsChartType === 'area' ? (
                      <AreaChart data={projectionData} margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.2} />
                          <XAxis dataKey="month" stroke="currentColor" className="text-xs" />
                          <YAxis stroke="currentColor" className="text-xs" tickFormatter={yAxisFormatter} />
                          <Tooltip formatter={(v: number) => toCurrency(v)} />
                          <Area type="monotone" dataKey="Saldo Projetado" stroke="#8b5cf6" fill="#c4b5fd" fillOpacity={0.4} strokeWidth={2} dot={{ r: 4, fill: '#8b5cf6' }} activeDot={{ r: 6 }} />
                      </AreaChart>
                    ) : projectionsChartType === 'bar' ? (
                      <BarChart data={projectionData} margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.2} />
                          <XAxis dataKey="month" stroke="currentColor" className="text-xs" />
                          <YAxis stroke="currentColor" className="text-xs" tickFormatter={yAxisFormatter} />
                          <Tooltip formatter={(v: number) => toCurrency(v)} />
                          <Bar dataKey="Saldo Projetado" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    ) : (
                      <LineChart data={projectionData} margin={{ top: 5, right: 20, left: 5, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="currentColor" opacity={0.2} />
                          <XAxis dataKey="month" stroke="currentColor" className="text-xs" />
                          <YAxis stroke="currentColor" className="text-xs" tickFormatter={yAxisFormatter} />
                          <Tooltip formatter={(v: number) => toCurrency(v)} />
                          <Line type="monotone" dataKey="Saldo Projetado" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 4, fill: '#8b5cf6' }} activeDot={{ r: 6 }} />
                      </LineChart>
                    )}
                  </ResponsiveContainer>
              </CardContent>
          </Card>
      </div>

    </div>
  );
};

export default DashboardPage;