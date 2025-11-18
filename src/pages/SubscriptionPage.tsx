import React, { useState, useMemo } from 'react';
import { User, Users, Home, CheckCircle, Plus, Minus } from 'lucide-react';
import { Card, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { cn } from '../utils/helpers';
import { SubscriptionPlan, Subscription } from '../types';
import { PricingCarousel } from '../components/pricing/PricingCarousel';

interface SubscriptionPageProps {
  addToast: (message: string, type?: 'error' | 'success') => void;
  onUpgradePlan: (plan: SubscriptionPlan, memberSlots: number) => void;
  isLoading: boolean;
  currentSubscription: Subscription;
}

const SubscriptionPage: React.FC<SubscriptionPageProps> = ({ addToast, onUpgradePlan, isLoading, currentSubscription }) => {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [familyMembers, setFamilyMembers] = useState(2); 

  const plans = useMemo(() => {
    const isAnnual = billingCycle === 'annual';
    
    const basePrices = {
        premium: { monthly: 7.90, annual: 5.90 },
        family: { monthly: 14.90, annual: 11.90 },
        familyPerMember: { monthly: 6.90, annual: 5.90 },
    };

    const premiumPrice = isAnnual ? basePrices.premium.annual : basePrices.premium.monthly;
    const familyBasePrice = isAnnual ? basePrices.family.annual : basePrices.family.monthly;
    const familyPerMemberPrice = isAnnual ? basePrices.familyPerMember.annual : basePrices.familyPerMember.monthly;

    const familyTotalPrice = familyBasePrice + (Math.max(0, familyMembers - 2) * familyPerMemberPrice);
    const familyOriginalPrice = basePrices.family.monthly + (Math.max(0, familyMembers - 2) * basePrices.familyPerMember.monthly);

    return [
      {
        name: 'Grátis',
        planType: 'free' as SubscriptionPlan,
        slots: 1,
        icon: <User className="w-8 h-8 text-indigo-500" />,
        price: 0,
        originalPrice: 0,
        description: 'Ideal para dar os primeiros passos no controle financeiro.',
        features: [
          '2 Contas Bancárias', 
          '2 Cartões de Crédito', 
          'Lançamentos Manuais Ilimitados', 
          '3 Orçamentos e 3 Metas',
          '5 interações com a IA Yara/mês'
        ],
        annualBillingText: '',
        recommended: false,
      },
      {
        name: 'Premium',
        planType: 'premium' as SubscriptionPlan,
        slots: 1,
        icon: <Users className="w-8 h-8 text-indigo-500" />,
        price: premiumPrice,
        originalPrice: basePrices.premium.monthly,
        description: 'O poder da IA para um controle financeiro completo e sem esforço.',
        features: ['Tudo do Grátis, e mais:', 'Acesso total e ilimitado à IA Yara', 'Contas e Cartões ilimitados', 'Orçamentos e Metas ilimitados'],
        annualBillingText: `R$ ${(basePrices.premium.annual * 12).toFixed(2).replace('.', ',')} / ano`,
        recommended: true,
      },
      {
        name: 'Família',
        planType: 'family' as SubscriptionPlan,
        slots: familyMembers,
        icon: <Home className="w-8 h-8 text-indigo-500" />,
        price: familyTotalPrice,
        originalPrice: familyOriginalPrice,
        description: 'A solução completa para toda a família planejar em conjunto.',
        features: ['Tudo do Premium, e mais:', `${familyMembers} contas de usuário`, 'Dashboard compartilhado', 'Relatórios consolidados'],
        annualBillingText: `A partir de R$ ${(basePrices.family.annual * 12).toFixed(2).replace('.', ',')} / ano`,
        recommended: false,
      },
    ];
  }, [billingCycle, familyMembers]);
  
  const handleFamilyMembersChange = (amount: number) => {
    setFamilyMembers(prev => {
      const newCount = prev + amount;
      if (newCount >= 2 && newCount <= 10) {
        return newCount;
      }
      return prev;
    });
  };

  return (
    <div className="grid grid-cols-1 gap-8">
      <div className="text-center">
        <h2 className="text-3xl font-bold">Escolha o Plano Ideal para Você</h2>
        <p className="text-slate-500 dark:text-slate-400 mt-2">Transforme suas finanças hoje. Cancele quando quiser.</p>
      </div>
      
      <div className="flex flex-wrap justify-center items-center gap-4">
        <span className={cn("font-medium", billingCycle === 'monthly' ? 'text-primary' : 'text-slate-500')}>Mensal</span>
        <label className="relative inline-flex items-center cursor-pointer">
          <input type="checkbox" checked={billingCycle === 'annual'} onChange={() => setBillingCycle(p => p === 'monthly' ? 'annual' : 'monthly')} className="sr-only peer" aria-label="Alternar entre planos mensais e anuais" />
          <div className="w-14 h-7 bg-slate-200 peer-focus:outline-none rounded-full peer dark:bg-slate-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all dark:border-slate-600 peer-checked:bg-primary"></div>
        </label>
        <span className={cn("font-medium transition-colors", billingCycle === 'annual' ? 'text-primary' : 'text-slate-500')}>
          Anual
          {billingCycle === 'annual' && (
            <span className="ml-2 text-xs whitespace-nowrap bg-emerald-100 text-emerald-800 font-bold px-2 py-1 rounded-full dark:bg-emerald-900/50 dark:text-emerald-300 animate-fade-in">
              Economize 25%
            </span>
          )}
        </span>
      </div>

      {/* Desktop Grid */}
      <div className="hidden lg:grid grid-cols-3 gap-6 items-stretch">
        {plans.map((plan) => {
          const isCurrentPlan = currentSubscription.plan === plan.planType;
          return (
            <Card key={plan.name} className={cn("flex flex-col h-full", plan.recommended && !isCurrentPlan && "border-2 border-primary relative", isCurrentPlan && "border-2 border-green-500 bg-slate-50 dark:bg-slate-800/50 relative")}>
              {plan.recommended && !isCurrentPlan && <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full z-10">RECOMENDADO</div>}
              {isCurrentPlan && <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10">SEU PLANO ATUAL</div>}
              <CardContent className={cn("p-8 flex-grow flex flex-col", (plan.recommended || isCurrentPlan) && "pt-12")}>
                <div className="flex-grow">
                  <div className="flex justify-center mb-4">{plan.icon}</div>
                  <h3 className="text-xl font-bold text-center">{plan.name}</h3>
                  <p className="text-sm text-slate-500 dark:text-slate-400 text-center my-4 min-h-[40px]">{plan.description}</p>
                  
                  <div className="text-center my-8 flex flex-col justify-center items-center min-h-[100px]">
                      <div>
                          <span className="text-4xl font-extrabold">{plan.price > 0 ? `R$ ${plan.price.toFixed(2).replace('.', ',')}` : 'Grátis'}</span>
                          {plan.price > 0 && <span className="text-slate-500">/mês</span>}
                          {billingCycle === 'annual' && plan.originalPrice > plan.price && (
                              <s className="text-2xl text-slate-500 dark:text-slate-400 ml-2">
                                  R$ {plan.originalPrice.toFixed(2).replace('.', ',')}
                              </s>
                          )}
                      </div>
                      {billingCycle === 'annual' && plan.annualBillingText && (
                          <p className="text-xs text-slate-400 mt-1">{plan.annualBillingText}</p>
                      )}
                  </div>
                  
                  {plan.name === 'Família' && (
                    <div className="my-8 text-center">
                        <p className="font-semibold mb-2">Número de Contas: {familyMembers}</p>
                        <div className="flex items-center justify-center gap-2">
                          <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => handleFamilyMembersChange(-1)} disabled={familyMembers <= 2}>
                              <Minus className="w-4 h-4" />
                          </Button>
                          <span className="text-lg font-bold w-10 text-center">{familyMembers}</span>
                          <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => handleFamilyMembersChange(1)} disabled={familyMembers >= 10}>
                              <Plus className="w-4 h-4" />
                          </Button>
                        </div>
                    </div>
                  )}

                  <ul className="space-y-4 text-sm mt-8 text-left">
                    {plan.features.map(feature => {
                      const isHeader = feature.endsWith(':');
                      return (
                        <li key={feature} className={cn("flex items-start gap-3", isHeader && "font-semibold text-slate-600 dark:text-slate-300 -mb-2")}>
                          {!isHeader && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />}
                          <span className={cn("flex-1", isHeader && "ml-8")}>{feature}</span>
                        </li>
                      )
                    })}
                  </ul>
                </div>
                <Button 
                  className="w-full mt-auto"
                  variant={isCurrentPlan ? 'default' : (plan.recommended ? 'default' : 'outline')}
                  onClick={() => onUpgradePlan(plan.planType, plan.slots)}
                  loading={isLoading}
                  disabled={isCurrentPlan}
                >
                  {isCurrentPlan ? 'Plano Atual' : 'Assinar Plano'}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Mobile Carousel */}
      <div className="lg:hidden">
        <PricingCarousel initialSlide={1}>
          {plans.map((plan) => {
            const isCurrentPlan = currentSubscription.plan === plan.planType;
            return (
              <Card key={plan.name} className={cn("flex flex-col h-full", plan.recommended && !isCurrentPlan && "border-2 border-primary relative", isCurrentPlan && "border-2 border-green-500 bg-slate-50 dark:bg-slate-800/50 relative")}>
                {plan.recommended && !isCurrentPlan && <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-full z-10">RECOMENDADO</div>}
                {isCurrentPlan && <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10">SEU PLANO ATUAL</div>}
                <CardContent className={cn("p-8 flex-grow flex flex-col", (plan.recommended || isCurrentPlan) && "pt-12")}>
                  <div className="flex-grow">
                    <div className="flex justify-center mb-4">{plan.icon}</div>
                    <h3 className="text-xl font-bold text-center">{plan.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 text-center my-4 min-h-[40px]">{plan.description}</p>

                    <div className="text-center my-8 flex flex-col justify-center items-center min-h-[100px]">
                        <div>
                            <span className="text-4xl font-extrabold">{plan.price > 0 ? `R$ ${plan.price.toFixed(2).replace('.', ',')}` : 'Grátis'}</span>
                            {plan.price > 0 && <span className="text-slate-500">/mês</span>}
                            {billingCycle === 'annual' && plan.originalPrice > plan.price && (
                                <s className="text-2xl text-slate-500 dark:text-slate-400 ml-2">
                                    R$ {plan.originalPrice.toFixed(2).replace('.', ',')}
                                </s>
                            )}
                        </div>
                        {billingCycle === 'annual' && plan.annualBillingText && (
                            <p className="text-xs text-slate-400 mt-1">{plan.annualBillingText}</p>
                        )}
                    </div>

                    {plan.name === 'Família' && (
                      <div className="my-8 text-center">
                          <p className="font-semibold mb-2">Número de Contas: {familyMembers}</p>
                          <div className="flex items-center justify-center gap-2">
                            <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => handleFamilyMembersChange(-1)} disabled={familyMembers <= 2}>
                                <Minus className="w-4 h-4" />
                            </Button>
                            <span className="text-lg font-bold w-10 text-center">{familyMembers}</span>
                            <Button size="icon" variant="outline" className="h-8 w-8 rounded-full" onClick={() => handleFamilyMembersChange(1)} disabled={familyMembers >= 10}>
                                <Plus className="w-4 h-4" />
                            </Button>
                          </div>
                      </div>
                    )}

                    <ul className="space-y-4 text-sm mt-8 text-left">
                      {plan.features.map(feature => {
                        const isHeader = feature.endsWith(':');
                        return (
                          <li key={feature} className={cn("flex items-start gap-3", isHeader && "font-semibold text-slate-600 dark:text-slate-300 -mb-2")}>
                            {!isHeader && <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />}
                            <span className={cn("flex-1", isHeader && "ml-8")}>{feature}</span>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                  <Button
                    className="w-full mt-auto"
                    variant={isCurrentPlan ? 'default' : (plan.recommended ? 'default' : 'outline')}
                    onClick={() => onUpgradePlan(plan.planType, plan.slots)}
                    loading={isLoading}
                    disabled={isCurrentPlan}
                  >
                    {isCurrentPlan ? 'Plano Atual' : 'Assinar Plano'}
                  </Button>
                </CardContent>
              </Card>
            )
          })}
        </PricingCarousel>
      </div>
    </div>
  );
};

export default SubscriptionPage;