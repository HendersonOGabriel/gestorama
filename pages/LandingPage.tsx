import React, { useState, useMemo } from 'react';
import { Button } from "../components/ui/Button";
import { Card, CardContent } from "../components/ui/Card";
import { CheckCircle, Smartphone, Wallet, TrendingUp, LogIn, Quote, MessageCircle, Sliders, Shield, Mail, User, Users, Home, Plus, Minus, Menu, X, BarChart3, Target, BrainCircuit } from "lucide-react";
import { cn } from '../utils/helpers';
import { PricingCarousel } from '../components/pricing/PricingCarousel';

interface LandingPageProps {
  onEnter: (page?: string) => void;
}

export default function LandingPage({ onEnter }: LandingPageProps) {
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');
  const [familyMembers, setFamilyMembers] = useState(2);
  const [highlightedSection, setHighlightedSection] = useState<string | null>(null);

  const features = [
    { icon: <BarChart3 className="h-10 w-10 text-indigo-400" />, title: "Dashboard Intuitivo", desc: "Acompanhe contas, cartões, orçamentos e metas em um só lugar com gráficos claros e fáceis de entender." },
    { icon: <BrainCircuit className="h-10 w-10 text-indigo-400" />, title: "Sua Assistente Pessoal, Yara", desc: "Registre despesas e receitas conversando com nossa IA pelo WhatsApp. Simples, rápido e inteligente." },
    { icon: <Target className="h-10 w-10 text-indigo-400" />, title: "Planejamento e Metas", desc: "Crie orçamentos mensais por categoria e defina metas de poupança para alcançar seus sonhos." },
  ];

  const benefits = [
    { icon: <TrendingUp className="h-10 w-10 text-indigo-400" />, title: "Visualize seu Futuro", desc: "Com projeções baseadas em suas recorrências e contas a pagar, tome decisões mais informadas." },
    { icon: <Smartphone className="h-10 w-10 text-indigo-400" />, title: "Simplicidade em Primeiro Lugar", desc: "Sem apps complicados. Gerencie tudo pelo navegador e registre gastos de onde estiver com o WhatsApp." },
    { icon: <Shield className="h-10 w-10 text-indigo-400" />, title: "Segurança em Nível Bancário", desc: "Seus dados são criptografados e protegidos com as melhores práticas de segurança do mercado." },
  ];

  const testimonials = [
    { name: "Mariana Santos", role: "Estudante", text: "O Gestorama me ajudou a finalmente entender para onde meu dinheiro estava indo. É como ter uma amiga inteligente que entende de finanças!", img: "https://placehold.co/100x100/e2e8f0/334155/png?text=User" },
    { name: "Lucas Almeida", role: "Designer", text: "A Yara é sensacional! As sugestões dela me ajudaram a economizar quase 20% do meu salário em dois meses.", img: "https://placehold.co/100x100/e2e8f0/334155/png?text=User" },
    { name: "Beatriz Costa", role: "Autônoma", text: "Simples, bonita e útil. Não consigo mais viver sem o Gestorama no meu dia a dia.", img: "https://placehold.co/100x100/e2e8f0/334155/png?text=User" }
  ];
  
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.querySelector(targetId);
    if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
        setHighlightedSection(targetId.substring(1)); // Use ID without '#'
        const timer = setTimeout(() => {
          setHighlightedSection(null);
        }, 1500); // Animation duration
        return () => clearTimeout(timer);
    }
    if (isMobileNavOpen) {
      setIsMobileNavOpen(false);
    }
  };


  const handleFamilyMembersChange = (amount: number) => {
    setFamilyMembers(prev => {
      const newCount = prev + amount;
      if (newCount >= 2 && newCount <= 10) {
        return newCount;
      }
      return prev;
    });
  };

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
        price: 0,
        originalPrice: 0,
        features: [
          '2 Contas Bancárias e 2 Cartões', 
          'Lançamentos Manuais Ilimitados', 
          '3 Orçamentos e 3 Metas', 
          '5 interações/mês com a IA Yara'
        ],
        annualBillingText: `Para sempre grátis`,
        recommended: false,
      },
      {
        name: 'Premium',
        price: premiumPrice,
        originalPrice: basePrices.premium.monthly,
        features: ['Tudo do Grátis, e mais:', 'Acesso total e ilimitado à IA Yara', 'Contas e Cartões ilimitados', 'Orçamentos e Metas ilimitados'],
        annualBillingText: `R$ ${(basePrices.premium.annual * 12).toFixed(2).replace('.', ',')} / ano`,
        recommended: true,
      },
      {
        name: 'Família',
        price: familyTotalPrice,
        originalPrice: familyOriginalPrice,
        features: ['Tudo do Premium, e mais:', `${familyMembers} contas de usuário`, 'Dashboard compartilhado', 'Relatórios consolidados'],
        annualBillingText: `A partir de R$ ${(basePrices.family.annual * 12).toFixed(2).replace('.', ',')} / ano`,
        recommended: false,
      },
    ];
  }, [billingCycle, familyMembers]);


  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 to-slate-900 text-slate-200 dark">
      {/* Navbar */}
      <header className="relative bg-slate-900/50 backdrop-blur-lg sticky top-0 z-50 border-b border-slate-700/40">
        <div className="flex justify-between items-center px-4 sm:px-8 py-4">
          <h1 className="text-2xl font-bold text-indigo-300">Gestorama</h1>
          <nav className="hidden md:flex gap-6 items-center text-slate-100">
            <a href="#features" onClick={(e) => handleNavClick(e, '#features')} className="hover:text-white transition">Funcionalidades</a>
            <a href="#how-it-works" onClick={(e) => handleNavClick(e, '#how-it-works')} className="hover:text-white transition">Como Funciona</a>
            <a href="#benefits" onClick={(e) => handleNavClick(e, '#benefits')} className="hover:text-white transition">Vantagens</a>
            <a href="#pricing" onClick={(e) => handleNavClick(e, '#pricing')} className="hover:text-white transition">Planos</a>
            <a href="#testimonials" onClick={(e) => handleNavClick(e, '#testimonials')} className="hover:text-white transition">Depoimentos</a>
            <a href="#faq" onClick={(e) => handleNavClick(e, '#faq')} className="hover:text-white transition">FAQ</a>
            <a href="#security" onClick={(e) => handleNavClick(e, '#security')} className="hover:text-white transition">Segurança</a>
            <Button onClick={() => onEnter()} variant="outline" className="flex items-center gap-2 border-indigo-400 text-indigo-200 hover:bg-slate-800">
              <LogIn className="h-4 w-4" /> Acessar App
            </Button>
          </nav>
          <div className="md:hidden">
            <Button variant="ghost" size="icon" onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}>
              {isMobileNavOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </Button>
          </div>
        </div>
        {isMobileNavOpen && (
        <nav className="md:hidden flex flex-col items-center gap-4 py-6 bg-slate-900/95">
          <a href="#features" onClick={(e) => handleNavClick(e, '#features')} className="hover:text-white transition">Funcionalidades</a>
          <a href="#how-it-works" onClick={(e) => handleNavClick(e, '#how-it-works')} className="hover:text-white transition">Como Funciona</a>
          <a href="#benefits" onClick={(e) => handleNavClick(e, '#benefits')} className="hover:text-white transition">Vantagens</a>
          <a href="#pricing" onClick={(e) => handleNavClick(e, '#pricing')} className="hover:text-white transition">Planos</a>
          <a href="#testimonials" onClick={(e) => handleNavClick(e, '#testimonials')} className="hover:text-white transition">Depoimentos</a>
          <a href="#faq" onClick={(e) => handleNavClick(e, '#faq')} className="hover:text-white transition">FAQ</a>
          <a href="#security" onClick={(e) => handleNavClick(e, '#security')} className="hover:text-white transition">Segurança</a>
           <Button onClick={() => onEnter()} variant="outline" className="flex items-center gap-2 border-indigo-400 text-indigo-200 hover:bg-slate-800 mt-4">
              <LogIn className="h-4 w-4" /> Acessar App
            </Button>
        </nav>
        )}
      </header>

      {/* Hero Section */}
      <section className="text-center py-24 px-4 max-w-5xl mx-auto">
        <h1 className="text-5xl font-bold mb-6 text-indigo-300">
          O controle financeiro que conversa com você.
        </h1>
        <p className="text-xl text-slate-100 mb-10">
          Simplifique suas finanças com o Gestorama. Registre gastos pelo WhatsApp com a ajuda da Yara, nossa IA, e visualize tudo em um dashboard completo.
        </p>

        <div className="flex justify-center mb-10">
          <img src="https://placehold.co/450x280/1e293b/4f46e5/png?text=Gestorama+App" alt="Preview do app Gestorama" width="450" height="280" className="rounded-3xl shadow-2xl w-full max-w-md border border-slate-700/40" />
        </div>

        <div>
          <Button size="lg" onClick={() => onEnter()} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full px-10 py-6 text-lg">Comece Grátis Agora</Button>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className={cn("py-20 px-6 bg-slate-900/40 rounded-lg", highlightedSection === 'features' && 'animate-flash-bg')}>
        <h2 className="text-3xl font-bold text-center mb-12 text-indigo-200">Uma plataforma, múltiplos benefícios</h2>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {features.map((f, i) => (
            <Card key={i} className="bg-slate-800/50 border-slate-700 rounded-2xl hover:scale-[1.02] transition-transform">
              <CardContent className="p-8 text-center">
                <div className="mb-4 flex justify-center">{f.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-slate-100">{f.title}</h3>
                <p className="text-slate-300">{f.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
      
      {/* How it Works Section */}
      <section id="how-it-works" className={cn("py-20 px-6 text-center rounded-lg", highlightedSection === 'how-it-works' && 'animate-flash-bg')}>
        <h2 className="text-3xl font-bold mb-12 text-indigo-300">Como funciona? É simples!</h2>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-indigo-500 text-white flex items-center justify-center text-2xl font-bold mb-4">1</div>
                <h3 className="text-xl font-semibold mb-2">Cadastre-se</h3>
                <p className="text-slate-300">Crie sua conta em segundos e configure suas contas e cartões no dashboard web.</p>
            </div>
             <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-indigo-500 text-white flex items-center justify-center text-2xl font-bold mb-4">2</div>
                <h3 className="text-xl font-semibold mb-2">Converse com a Yara</h3>
                <p className="text-slate-300">Adicione nosso número no WhatsApp e envie seus gastos por texto ou áudio. Ex: "Paguei R$50 no iFood".</p>
            </div>
             <div className="flex flex-col items-center">
                <div className="w-16 h-16 rounded-full bg-indigo-500 text-white flex items-center justify-center text-2xl font-bold mb-4">3</div>
                <h3 className="text-xl font-semibold mb-2">Acompanhe e Conquiste</h3>
                <p className="text-slate-300">Veja tudo organizado no dashboard, analise relatórios e atinja suas metas financeiras.</p>
            </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section id="benefits" className={cn("py-20 px-6 bg-slate-900/40 text-center rounded-lg", highlightedSection === 'benefits' && 'animate-flash-bg')}>
        <h2 className="text-3xl font-bold mb-12 text-indigo-200">Vantagens que fazem a diferença</h2>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {benefits.map((b, i) => (
            <Card key={i} className="bg-slate-800/50 border border-slate-700 rounded-2xl hover:scale-[1.02] transition-transform">
              <CardContent className="p-8 text-center">
                <div className="mb-4 flex justify-center">{b.icon}</div>
                <h3 className="text-xl font-semibold mb-2 text-slate-100">{b.title}</h3>
                <p className="text-slate-300">{b.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className={cn("py-20 px-6 text-center rounded-lg", highlightedSection === 'pricing' && 'animate-flash-bg')}>
        <h2 className="text-3xl font-bold mb-4 text-indigo-300">Planos flexíveis para cada necessidade</h2>
        <p className="text-slate-400 mb-10">Cancele quando quiser. Sem taxas escondidas.</p>
        
        <div className="flex justify-center items-center gap-4 mb-10">
          <span className={cn("font-medium", billingCycle === 'monthly' ? 'text-indigo-400' : 'text-slate-400')}>Mensal</span>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" checked={billingCycle === 'annual'} onChange={() => setBillingCycle(p => p === 'monthly' ? 'annual' : 'monthly')} className="sr-only peer" />
            <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:border-slate-600 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-indigo-600"></div>
          </label>
          <span className={cn("font-medium", billingCycle === 'annual' ? 'text-indigo-400' : 'text-slate-400')}>
            Anual
            {billingCycle === 'annual' && (
              <span className="ml-2 text-xs bg-emerald-900/50 text-emerald-300 font-bold px-2 py-1 rounded-full">
                Economize 25%
              </span>
            )}
          </span>
        </div>

        <div className="max-w-5xl mx-auto">
            {/* Desktop Grid */}
            <div className="hidden md:grid grid-cols-3 gap-8 items-stretch">
              {plans.map((plan, i) => (
                <Card key={i} className={cn("bg-slate-800/50 border rounded-2xl hover:scale-[1.02] transition-transform flex flex-col", plan.recommended ? "border-2 border-indigo-500 relative" : "border-slate-700")}>
                  {plan.recommended && <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10">RECOMENDADO</div>}
                  <CardContent className={cn("p-8 text-center flex flex-col flex-grow", plan.recommended && "pt-12")}>
                    <div className="flex-grow">
                      <h3 className="text-xl font-bold text-slate-100 mb-4">{plan.name}</h3>
                      
                      <div className="my-8 flex flex-col justify-center items-center min-h-[100px]">
                        <div>
                            <span className="text-4xl font-extrabold text-indigo-200">{plan.price > 0 ? `R$ ${plan.price.toFixed(2).replace('.', ',')}`: 'Grátis'}</span>
                            {plan.price > 0 && <span className="text-slate-400">/mês</span>}
                            {billingCycle === 'annual' && plan.originalPrice > plan.price && (
                                <s className="text-2xl text-slate-500 ml-2">
                                    R$ {plan.originalPrice.toFixed(2).replace('.', ',')}
                                </s>
                            )}
                        </div>
                        {billingCycle === 'annual' && plan.price > 0 && <p className="text-xs text-slate-400 mt-1">{plan.annualBillingText}</p>}
                      </div>

                      {plan.name === 'Família' && (
                        <div className="my-8 text-center">
                            <p className="font-semibold mb-2 text-slate-200">Número de Contas</p>
                            <div className="flex items-center justify-center gap-2">
                              <Button size="icon" variant="outline" className="h-8 w-8 rounded-full border-slate-600" onClick={() => handleFamilyMembersChange(-1)} disabled={familyMembers <= 2}>
                                  <Minus className="w-4 h-4" />
                              </Button>
                              <span className="text-lg font-bold w-10 text-center text-slate-100">{familyMembers}</span>
                              <Button size="icon" variant="outline" className="h-8 w-8 rounded-full border-slate-600" onClick={() => handleFamilyMembersChange(1)} disabled={familyMembers >= 10}>
                                  <Plus className="w-4 h-4" />
                              </Button>
                            </div>
                        </div>
                      )}
                      
                      <ul className="text-slate-300 mb-6 space-y-4">
                        {plan.features.map((feat, idx) => (
                          <li key={idx} className="flex items-start gap-3 text-left">
                            <CheckCircle className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-1" />
                            <span>{feat}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <Button 
                        className={cn(
                            "w-full mt-auto rounded-full px-6 py-3",
                            plan.recommended ? "bg-indigo-600 hover:bg-indigo-700" : "bg-slate-700 hover:bg-slate-600"
                        )}
                        onClick={() => onEnter(plan.price > 0 ? 'subscription' : undefined)}
                    >
                        {plan.price > 0 ? 'Escolher plano' : 'Começar Agora'}
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Mobile Carousel */}
            <div className="md:hidden">
                <PricingCarousel initialSlide={1}>
                  {plans.map((plan, i) => (
                    <Card key={i} className={cn("bg-slate-800/50 border rounded-2xl flex flex-col h-full", plan.recommended ? "border-2 border-indigo-500 relative" : "border-slate-700")}>
                      {plan.recommended && <div className="absolute top-0 -translate-y-1/2 left-1/2 -translate-x-1/2 bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full z-10">RECOMENDADO</div>}
                      <CardContent className={cn("p-8 text-center flex flex-col flex-grow", plan.recommended && "pt-12")}>
                        <div className="flex-grow">
                          <h3 className="text-xl font-bold text-slate-100 mb-4">{plan.name}</h3>

                          <div className="my-8 flex flex-col justify-center items-center min-h-[100px]">
                            <div>
                                <span className="text-4xl font-extrabold text-indigo-200">{plan.price > 0 ? `R$ ${plan.price.toFixed(2).replace('.', ',')}`: 'Grátis'}</span>
                                {plan.price > 0 && <span className="text-slate-400">/mês</span>}
                                {billingCycle === 'annual' && plan.originalPrice > plan.price && (
                                    <s className="text-2xl text-slate-500 ml-2">
                                        R$ {plan.originalPrice.toFixed(2).replace('.', ',')}
                                    </s>
                                )}
                            </div>
                            {billingCycle === 'annual' && plan.price > 0 && <p className="text-xs text-slate-400 mt-1">{plan.annualBillingText}</p>}
                          </div>

                          {plan.name === 'Família' && (
                            <div className="my-8 text-center">
                                <p className="font-semibold mb-2 text-slate-200">Número de Contas</p>
                                <div className="flex items-center justify-center gap-2">
                                  <Button size="icon" variant="outline" className="h-8 w-8 rounded-full border-slate-600" onClick={() => handleFamilyMembersChange(-1)} disabled={familyMembers <= 2}>
                                      <Minus className="w-4 h-4" />
                                  </Button>
                                  <span className="text-lg font-bold w-10 text-center text-slate-100">{familyMembers}</span>
                                  <Button size="icon" variant="outline" className="h-8 w-8 rounded-full border-slate-600" onClick={() => handleFamilyMembersChange(1)} disabled={familyMembers >= 10}>
                                      <Plus className="w-4 h-4" />
                                  </Button>
                                </div>
                            </div>
                          )}

                          <ul className="text-slate-300 mb-6 space-y-4">
                            {plan.features.map((feat, idx) => (
                              <li key={idx} className="flex items-start gap-3 text-left">
                                <CheckCircle className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-1" />
                                <span>{feat}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                        <Button
                            className={cn(
                                "w-full mt-auto rounded-full px-6 py-3",
                                plan.recommended ? "bg-indigo-600 hover:bg-indigo-700" : "bg-slate-700 hover:bg-slate-600"
                            )}
                            onClick={() => onEnter(plan.price > 0 ? 'subscription' : undefined)}
                        >
                            {plan.price > 0 ? 'Escolher plano' : 'Começar Agora'}
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </PricingCarousel>
            </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className={cn("py-24 px-6 bg-slate-900/40 text-center rounded-lg", highlightedSection === 'testimonials' && 'animate-flash-bg')}>
        <h2 className="text-3xl font-bold mb-12 text-indigo-200">O que nossos usuários dizem</h2>
        <div className="max-w-5xl mx-auto grid md:grid-cols-3 gap-8">
          {testimonials.map((t, i) => (
            <Card key={i} className="bg-slate-800/50 border border-slate-700 rounded-2xl hover:scale-[1.02] transition-transform">
              <CardContent className="p-8 text-center">
                <Quote className="h-6 w-6 text-indigo-400 mb-4 mx-auto" />
                <p className="text-slate-200 italic mb-6">“{t.text}”</p>
                <div className="flex flex-col items-center">
                  <img src={t.img} alt={t.name} className="h-16 w-16 rounded-full object-cover mb-3 border border-slate-600" />
                  <p className="font-semibold text-slate-100">{t.name}</p>
                  <p className="text-indigo-400 text-sm">{t.role}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className={cn("py-20 px-6 rounded-lg", highlightedSection === 'faq' && 'animate-flash-bg')}>
        <h2 className="text-3xl font-bold text-center mb-12 text-indigo-300">Perguntas Frequentes</h2>
        <div className="max-w-3xl mx-auto space-y-4 text-slate-300">
          <details className="bg-slate-800/50 p-4 rounded-lg cursor-pointer"><summary className="font-semibold">O Gestorama possui integração com meu banco?</summary><p className="mt-2 text-slate-400">Atualmente, não temos integração bancária automática. Porém, você pode importar extratos em formato CSV para adicionar transações em lote de forma rápida e fácil.</p></details>
          <details className="bg-slate-800/50 p-4 rounded-lg cursor-pointer"><summary className="font-semibold">Posso usar o app offline?</summary><p className="mt-2 text-slate-400">O dashboard web pode ser acessado offline para visualizar dados já carregados. No entanto, para registrar novas transações com a Yara e sincronizar informações, é necessária uma conexão com a internet.</p></details>
          <details className="bg-slate-800/50 p-4 rounded-lg cursor-pointer"><summary className="font-semibold">Como posso cancelar minha assinatura?</summary><p className="mt-2 text-slate-400">Você pode cancelar sua assinatura a qualquer momento, sem burocracia, diretamente na página 'Assinatura' dentro do seu perfil no app.</p></details>
          <details className="bg-slate-800/50 p-4 rounded-lg cursor-pointer"><summary className="font-semibold">O que exatamente a IA Yara faz?</summary><p className="mt-2 text-slate-400">A Yara interpreta suas mensagens de texto ou voz, identifica o valor, a descrição e a possível categoria do gasto, e o registra no sistema para você. Ela também pode responder a perguntas sobre suas finanças e funcionalidades do app.</p></details>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className={cn("py-20 px-6 bg-slate-900/40 text-center rounded-lg", highlightedSection === 'security' && 'animate-flash-bg')}>
        <h2 className="text-3xl font-bold mb-6 text-indigo-200">Sua segurança é nossa prioridade</h2>
        <div className="max-w-3xl mx-auto text-slate-300 flex flex-col items-center">
          <Shield className="w-16 h-16 text-indigo-400 mb-6" />
          <p className="mb-4">No Gestorama, levamos a segurança dos seus dados muito a sério. Utilizamos criptografia de ponta para proteger suas informações em trânsito e em repouso. Nossa infraestrutura é robusta e segue as melhores práticas do setor para garantir que seus dados financeiros permaneçam confidenciais e seguros.</p>
          <p>Você tem controle total sobre seus dados e pode solicitar a exclusão de sua conta e de todas as informações a qualquer momento.</p>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="py-12 px-6 bg-slate-950 border-t border-slate-700/40">
        <div className="max-w-5xl mx-auto text-center text-slate-400">
            <h3 className="text-xl font-bold text-indigo-300 mb-4">Gestorama</h3>
            <div className="flex justify-center gap-6 mb-6">
                <a href="#" onClick={() => onEnter('terms')} className="hover:text-white transition">Termos de Uso</a>
                <a href="#" onClick={() => onEnter('privacy')} className="hover:text-white transition">Política de Privacidade</a>
                <a href="#" onClick={() => onEnter('contact')} className="hover:text-white transition">Contato</a>
            </div>
            <p className="text-sm">&copy; {new Date().getFullYear()} Gestorama. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}