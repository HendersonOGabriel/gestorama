import React, { useMemo } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { ArrowUpCircle, ArrowDownCircle, Users, Target, Lock, FileText, User as UserIcon } from 'lucide-react';
import { Transaction, User, Goal, Category, Subscription } from '../types';
import { toCurrency, displayDate, cn } from '../utils/helpers';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import SummaryCard from '../components/shared/SummaryCard';
import { PIE_COLORS } from '../data/initialData';

interface FamilyDashboardPageProps {
  transactions: Transaction[];
  users: User[];
  goals: Goal[];
  categories: Category[];
  getCategoryName: (id: string | null) => string;
  subscription: Subscription;
  onGoToSubscription: () => void;
}

const UpgradeNotice: React.FC<{ onUpgrade: () => void }> = ({ onUpgrade }) => (
    <div className="flex flex-col items-center justify-center text-center p-8 rounded-lg bg-slate-100 dark:bg-slate-900 border-2 border-dashed h-[60vh]">
        <Lock className="w-16 h-16 text-indigo-400 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Exclusivo para o Plano Família</h2>
        <p className="text-slate-500 dark:text-slate-400 max-w-md mb-6">
            Este dashboard consolidado é uma das vantagens do nosso Plano Família. Faça o upgrade para visualizar as finanças de todos os membros, criar metas em conjunto e muito mais.
        </p>
        <Button onClick={onUpgrade} size="lg">Ver Planos</Button>
    </div>
);


const FamilyDashboardPage: React.FC<FamilyDashboardPageProps> = ({ transactions, users, goals, categories, getCategoryName, subscription, onGoToSubscription }) => {
    
    // Simulating family members for demonstration purposes
    const familyMembers = useMemo(() => [
        { id: 'user1', name: 'Você', avatar: users.find(u => u.id === 'user1')?.avatar || null },
        { id: 'user2', name: 'Cônjuge', avatar: null } 
    ], [users]);

    const familyData = useMemo(() => {
        let totalIncome = 0;
        let totalExpense = 0;
        const spendingByMember: { [key: string]: number } = {};
        const spendingByCategory: { [key: string]: number } = {};

        transactions.forEach(tx => {
            // FIX: Use nullish coalescing operator (??) to correctly handle paid amounts that are 0.
            const amount = tx.installmentsSchedule.filter(s => s.paid).reduce((sum, s) => sum + (s.paidAmount ?? s.amount), 0);
            
            if (tx.isIncome) {
                totalIncome += amount;
            } else {
                totalExpense += amount;
                if(tx.userId) {
                    spendingByMember[tx.userId] = (spendingByMember[tx.userId] || 0) + amount;
                }
                if (tx.categoryId) {
                    spendingByCategory[tx.categoryId] = (spendingByCategory[tx.categoryId] || 0) + amount;
                }
            }
        });
        
        return { totalIncome, totalExpense, spendingByMember, spendingByCategory };
    }, [transactions]);
    
    const memberChartData = useMemo(() => {
        return Object.entries(familyData.spendingByMember).map(([userId, value], index) => ({
            name: familyMembers.find(m => m.id === userId)?.name || `Membro ${index + 1}`,
            value,
            fill: PIE_COLORS[index % PIE_COLORS.length]
        }));
    }, [familyData.spendingByMember, familyMembers]);

    const categoryChartData = useMemo(() => {
       return Object.entries(familyData.spendingByCategory)
        .map(([catId, value]) => ({ name: getCategoryName(catId), value }))
        // FIX: Added fallbacks to 0 to ensure the values are always numbers, resolving the arithmetic operation error.
        .sort((a, b) => (Number(b.value) || 0) - (Number(a.value) || 0))
        .slice(0, 7); // Top 7 categories
    }, [familyData.spendingByCategory, getCategoryName]);

    const sharedGoals = useMemo(() => goals.filter(g => g.name.toLowerCase().includes('família')), [goals]);
    
    if (subscription.plan !== 'family') {
        return <UpgradeNotice onUpgrade={onGoToSubscription} />;
    }

    return (
        <div className="grid grid-cols-1 gap-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <SummaryCard title="Renda Familiar (Mês)" value={toCurrency(familyData.totalIncome)} icon={<ArrowUpCircle />} colorClass="text-green-500" />
                <SummaryCard title="Despesa Familiar (Mês)" value={toCurrency(familyData.totalExpense)} icon={<ArrowDownCircle />} colorClass="text-red-500" />
                <SummaryCard title="Balanço Familiar (Mês)" value={toCurrency(familyData.totalIncome - familyData.totalExpense)} icon={<Users />} colorClass="text-indigo-500" />
                <SummaryCard title="Metas em Comum" value={`${sharedGoals.length} Ativas`} icon={<Target />} colorClass="text-amber-500" />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                 <Card>
                    <CardHeader><CardTitle>Gastos por Membro</CardTitle></CardHeader>
                    <CardContent>
                        {memberChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie data={memberChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={110} label>
                                        {memberChartData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.fill} />)}
                                    </Pie>
                                    <Tooltip formatter={(v: number) => toCurrency(v)} />
                                    <Legend />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : <div className="h-[300px] flex items-center justify-center text-slate-500">Nenhum gasto registrado.</div>}
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader><CardTitle>Top Categorias da Família</CardTitle></CardHeader>
                    <CardContent>
                         {categoryChartData.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={categoryChartData} layout="vertical" margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                                    <XAxis type="number" hide />
                                    <YAxis type="category" dataKey="name" width={100} tickLine={false} axisLine={false} />
                                    <Tooltip formatter={(v: number) => toCurrency(v)} />
                                    <Bar dataKey="value" name="Valor" fill="#818cf8" radius={[0, 4, 4, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                         ) : <div className="h-[300px] flex items-center justify-center text-slate-500">Nenhum gasto por categoria.</div>}
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader><CardTitle>Metas da Família</CardTitle></CardHeader>
                <CardContent>
                     {sharedGoals.length === 0 ? (
                        <div className="text-center py-10 text-slate-500">Nenhuma meta familiar definida.</div>
                     ) : (
                        <div className="space-y-4">
                            {sharedGoals.map(goal => (
                                <div key={goal.id}>
                                    <div className="flex justify-between items-center mb-1">
                                        <span className="font-medium">{goal.name}</span>
                                        <span className="text-sm">{toCurrency(goal.currentAmount)} / {toCurrency(goal.targetAmount)}</span>
                                    </div>
                                    <div className="w-full bg-slate-200 rounded-full h-2.5 dark:bg-slate-700">
                                        <div className="bg-indigo-600 h-2.5 rounded-full" style={{width: `${Math.min(100, (goal.currentAmount / goal.targetAmount) * 100)}%`}}></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                     )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader><CardTitle>Atividade Recente da Família</CardTitle></CardHeader>
                <CardContent>
                    <div className="overflow-x-auto">
                        <table className="min-w-full text-sm">
                            <thead className="border-b"><tr>
                                <th className="p-2 text-left font-semibold">Membro</th>
                                <th className="p-2 text-left font-semibold">Descrição</th>
                                <th className="p-2 text-right font-semibold">Valor</th>
                                <th className="p-2 text-left font-semibold hidden md:table-cell">Data</th>
                            </tr></thead>
                            <tbody>
                                {transactions.slice(0, 5).map(tx => {
                                    const member = familyMembers.find(m => m.id === tx.userId);
                                    return (
                                        <tr key={tx.id} className="border-b dark:border-slate-800">
                                            <td className="p-2 flex items-center gap-2">
                                                 <span className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                                                    <UserIcon className="w-3 h-3 text-slate-500" />
                                                  </span>
                                                {member?.name || 'Não atribuído'}
                                            </td>
                                            <td className="p-2">{tx.desc}</td>
                                            <td className={cn("p-2 text-right font-medium", tx.isIncome ? 'text-green-500' : 'text-red-500')}>{toCurrency(tx.amount)}</td>
                                            <td className="p-2 hidden md:table-cell">{displayDate(tx.date)}</td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                         {transactions.length === 0 && <div className="text-center py-10 text-slate-500">Nenhuma transação registrada.</div>}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default FamilyDashboardPage;
