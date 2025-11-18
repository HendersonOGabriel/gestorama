import React, { useState, useEffect, useLayoutEffect, useCallback, useRef } from 'react';
import { Button } from '../ui/Button';
import { cn } from '../../utils/helpers';
import { X, ArrowLeft, ArrowRight } from 'lucide-react';

interface TourStep {
  selector?: string;
  title: string;
  content: string;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
}

const steps: TourStep[] = [
  {
    position: 'center',
    title: 'Bem-vindo ao Gestorama!',
    content: 'Vamos fazer um tour rápido para você conhecer as principais funcionalidades. Você pode pular a qualquer momento.',
  },
  {
    selector: '[data-tour-id="summary-cards"]',
    title: 'Sua Visão Geral Financeira',
    content: 'Aqui você tem um resumo rápido de suas receitas, despesas, saldo total e contas a pagar. Tudo para uma visão instantânea da sua saúde financeira.',
    position: 'bottom',
  },
  {
    selector: '[data-tour-id="add-transaction-button"]',
    title: 'Adicione sua Primeira Transação',
    content: 'Clique aqui para registrar manualmente suas receitas e despesas. É rápido e fácil manter tudo em dia.',
    position: 'bottom',
  },
  {
    selector: '[data-tour-id="transactions-list"]',
    title: 'Acompanhe suas Movimentações',
    content: 'Todas as suas transações, faturas e recorrências aparecerão aqui. Você pode filtrar e visualizar os detalhes de cada uma.',
    position: 'top',
  },
  {
    selector: '[data-tour-id="sidebar-planning"]',
    title: 'Planeje seu Futuro',
    content: 'Nesta seção você pode criar orçamentos por categoria e definir metas de poupança para alcançar seus objetivos.',
    position: 'right',
  },
  {
    selector: '[data-tour-id="yara-chat-button"]',
    title: 'Converse com a Yara',
    content: 'Use nossa assistente com IA para registrar gastos e tirar dúvidas de forma rápida, diretamente pelo chat.',
    position: 'top',
  },
  {
    position: 'center',
    title: 'Você está pronto!',
    content: 'Agora você conhece o básico. Explore o app e comece a tomar o controle da sua vida financeira. Se tiver dúvidas, chame a Yara!',
  }
];

interface OnboardingTourProps {
  onComplete: () => void;
}

const OnboardingTour: React.FC<OnboardingTourProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const highlightedElementRef = useRef<Element | null>(null);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({ opacity: 0 });
  const tooltipRef = useRef<HTMLDivElement>(null);

  const stepData = steps[currentStep];

  const cleanupHighlight = useCallback(() => {
    if (highlightedElementRef.current) {
      highlightedElementRef.current.classList.remove('tour-highlight');
      highlightedElementRef.current = null;
    }
  }, []);

  useLayoutEffect(() => {
    cleanupHighlight();
    const tooltipElement = tooltipRef.current;
    if (!tooltipElement) return;

    const calculatePosition = (targetRect: DOMRect | null) => {
        const { width: tooltipWidth, height: tooltipHeight } = tooltipElement.getBoundingClientRect();
        const spacing = 16;

        if (!targetRect || stepData.position === 'center') {
            setTooltipStyle({
                opacity: 1,
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
            });
            return;
        }

        let idealTop = 0;
        let idealLeft = 0;
        const position = stepData.position || 'bottom';

        switch (position) {
            case 'top':
                idealTop = targetRect.top - tooltipHeight - spacing;
                idealLeft = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
                break;
            case 'bottom':
                idealTop = targetRect.bottom + spacing;
                idealLeft = targetRect.left + (targetRect.width / 2) - (tooltipWidth / 2);
                break;
            case 'left':
                idealTop = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
                idealLeft = targetRect.left - tooltipWidth - spacing;
                break;
            case 'right':
                idealTop = targetRect.top + (targetRect.height / 2) - (tooltipHeight / 2);
                idealLeft = targetRect.right + spacing;
                break;
        }

        const { innerWidth: vpWidth, innerHeight: vpHeight } = window;

        if (idealLeft < spacing) idealLeft = spacing;
        if (idealLeft + tooltipWidth > vpWidth - spacing) idealLeft = vpWidth - tooltipWidth - spacing;
        if (idealTop < spacing) idealTop = spacing;
        if (idealTop + tooltipHeight > vpHeight - spacing) idealTop = vpHeight - tooltipHeight - spacing;
        
        setTooltipStyle({
            opacity: 1,
            top: `${idealTop}px`,
            left: `${idealLeft}px`,
            transform: 'none',
        });
    };
    
    setTooltipStyle({ opacity: 0 });

    if (stepData.selector) {
      const element = document.querySelector(stepData.selector);
      if (element) {
        element.scrollIntoView({ block: 'center', inline: 'center' });
        
        const rect = element.getBoundingClientRect();
        calculatePosition(rect);
        element.classList.add('tour-highlight');
        highlightedElementRef.current = element;
      } else {
        console.warn(`Tour element not found for selector: "${stepData.selector}". Centering tooltip.`);
        calculatePosition(null);
      }
    } else {
      calculatePosition(null);
    }
  }, [currentStep, stepData, cleanupHighlight]);

  useEffect(() => {
    return () => {
      cleanupHighlight();
    };
  }, [cleanupHighlight]);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };
  
  const handleComplete = () => {
    cleanupHighlight();
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[10001]" aria-live="polite">
      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className="fixed w-80 bg-slate-800 text-white rounded-lg shadow-2xl p-4 border border-slate-600 transition-opacity duration-300"
        style={tooltipStyle}
        role="dialog"
        aria-labelledby="tour-title"
      >
        <h3 id="tour-title" className="font-bold text-lg mb-2">{stepData.title}</h3>
        <p className="text-sm text-slate-300">{stepData.content}</p>
        
        <div className="mt-4 flex justify-between items-center">
          <div>
            <Button size="sm" variant="ghost" className="text-slate-300 hover:text-white" onClick={handleComplete}>
              Pular Tour
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400">{currentStep + 1} / {steps.length}</span>
            {currentStep > 0 && (
              <Button size="sm" variant="outline" onClick={handlePrev}><ArrowLeft className="w-4 h-4 mr-1"/> Voltar</Button>
            )}
            <Button size="sm" onClick={handleNext}>
              {currentStep === steps.length - 1 ? 'Concluir' : 'Próximo'}
              {currentStep < steps.length - 1 && <ArrowRight className="w-4 h-4 ml-1"/>}
            </Button>
          </div>
        </div>
        <Button size="icon" variant="ghost" className="absolute top-2 right-2 h-8 w-8 text-slate-300 hover:text-white" onClick={handleComplete} aria-label="Fechar tour">
          <X className="w-4 h-4"/>
        </Button>
      </div>
    </div>
  );
};

export default OnboardingTour;
