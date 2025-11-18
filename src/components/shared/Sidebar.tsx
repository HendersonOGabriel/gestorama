import React from 'react';
import { Wallet, PiggyBank, CreditCard, Tag, LayoutDashboard, Target, ChevronLeft, ChevronRight, User, Calendar, Star, FileText, Shield, Mail, Info, HelpCircle, X, BarChart3, Users as UsersIcon } from 'lucide-react';
import { cn } from '../../utils/helpers';
import { Button } from '../ui/Button';
import { Subscription } from '../../types';

interface SidebarProps {
  currentPage: string;
  setCurrentPage: (page: string) => void;
  onOpenAccounts: () => void;
  onOpenCards: () => void;
  onOpenCategories: () => void;
  isMinimized: boolean;
  setIsMinimized: (minimized: boolean) => void;
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;
  onGoToLanding: () => void;
  subscription: Subscription;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, onOpenAccounts, onOpenCards, onOpenCategories, isMinimized, setIsMinimized, isMobileMenuOpen, setIsMobileMenuOpen, onGoToLanding, subscription }) => {
  
  const handleNavigation = (page: string) => {
    setCurrentPage(page);
    setIsMobileMenuOpen(false);
  };
  const handleAction = (action: () => void) => {
    action();
    setIsMobileMenuOpen(false);
  }
    const navItemClasses = (page: string) =>
    cn(
      "flex w-full items-center gap-3 rounded-lg px-3 py-2 transition-all hover:bg-slate-100 dark:hover:bg-slate-800",
      currentPage === page ? "bg-slate-100 dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 font-semibold" : "text-slate-600 dark:text-slate-300",
      isMinimized && "justify-center"
    );

  const labelClasses = cn("transition-opacity duration-200", isMinimized ? "opacity-0 absolute -right-20" : "opacity-100");
  const logoClasses = cn("transition-opacity duration-200", isMinimized ? "opacity-0 w-0" : "opacity-100 w-auto");

  return (
    <>
      {/* Overlay for mobile */}
      <div className={cn("fixed inset-0 bg-black/60 z-30 md:hidden", isMobileMenuOpen ? "block" : "hidden")} onClick={() => setIsMobileMenuOpen(false)}></div>

      <aside id="sidebar" className={cn(
        "fixed inset-y-0 left-0 z-40 flex flex-col border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-4 transition-transform duration-300 ease-in-out md:translate-x-0", 
        isMinimized ? "md:w-20" : "md:w-64",
        isMobileMenuOpen ? "translate-x-0 w-64" : "-translate-x-full"
      )}>
        <button
        onClick={() => setIsMinimized(!isMinimized)}
        className="absolute -right-3 top-9 z-20 h-6 w-6 rounded-full bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 hidden md:flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-label={isMinimized ? "Expandir menu" : "Minimizar menu"}
        aria-expanded={!isMinimized}
      >
        {isMinimized ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>

      <div className="flex items-center justify-between mb-6">
        <button onClick={onGoToLanding} className={cn("flex items-center gap-3 text-left", isMinimized ? "md:justify-center" : "")} aria-label="Ir para a página inicial">
          <img src="/icons/logo-32x32.png" alt="Gestorama Logo" className="w-8 h-8 flex-shrink-0" />
          <h1 className={cn("text-xl font-semibold", logoClasses)}>Gestorama</h1>
        </button>
        <Button variant="ghost" size="icon" className="md:hidden -mr-2" onClick={() => setIsMobileMenuOpen(false)} aria-label="Fechar menu"><X className="w-5 h-5"/></Button>
      </div>
      <nav className="flex-1 space-y-2 overflow-y-auto">
        <button onClick={() => handleNavigation('dashboard')} className={navItemClasses('dashboard')}><LayoutDashboard className="h-5 w-5 flex-shrink-0" /><span className={labelClasses}>Visão Geral</span></button>
        {subscription.plan === 'family' && (
          <button onClick={() => handleNavigation('familyDashboard')} className={navItemClasses('familyDashboard')}><UsersIcon className="h-5 w-5 flex-shrink-0" /><span className={labelClasses}>Dashboard Familiar</span></button>
        )}
        <button onClick={() => handleNavigation('reports')} className={navItemClasses('reports')}><BarChart3 className="h-5 w-5 flex-shrink-0" /><span className={labelClasses}>Relatórios</span></button>
        <button data-tour-id="sidebar-planning" onClick={() => handleNavigation('planning')} className={navItemClasses('planning')}><Target className="h-5 w-5 flex-shrink-0" /><span className={labelClasses}>Planejamento</span></button>
        <button onClick={() => handleNavigation('calendar')} className={navItemClasses('calendar')}><Calendar className="h-5 w-5 flex-shrink-0" /><span className={labelClasses}>Calendário</span></button>
        <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
          {!isMinimized && <h3 className={cn("text-xs font-semibold text-slate-400 uppercase mb-2", logoClasses)}>Geral</h3>}
          <button onClick={() => handleNavigation('profile')} className={navItemClasses('profile')}><User className="h-5 w-5 flex-shrink-0" /><span className={labelClasses}>Perfil</span></button>
          <button onClick={() => handleNavigation('subscription')} className={navItemClasses('subscription')}><Star className="h-5 w-5 flex-shrink-0" /><span className={labelClasses}>Assinatura</span></button>
        </div>
        <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
          {!isMinimized && <h3 className={cn("text-xs font-semibold text-slate-400 uppercase mb-2", logoClasses)}>Configurações</h3>}
          <button onClick={() => handleAction(onOpenAccounts)} className={navItemClasses('accounts')}><PiggyBank className="h-5 w-5 flex-shrink-0" /><span className={labelClasses}>Contas</span></button>
          <button onClick={() => handleAction(onOpenCards)} className={navItemClasses('cards')}><CreditCard className="h-5 w-5 flex-shrink-0" /><span className={labelClasses}>Cartões</span></button>
          <button onClick={() => handleAction(onOpenCategories)} className={navItemClasses('categories')}><Tag className="h-5 w-5 flex-shrink-0" /><span className={labelClasses}>Categorias</span></button>
        </div>
        <div className="pt-4 mt-4 border-t border-slate-200 dark:border-slate-700">
         {!isMinimized && <h3 className={cn("text-xs font-semibold text-slate-400 uppercase mb-2", logoClasses)}>Institucional</h3>}
         <button onClick={() => handleNavigation('about')} className={navItemClasses('about')}><Info className="h-5 w-5 flex-shrink-0" /><span className={labelClasses}>Sobre</span></button>
         <button onClick={() => handleNavigation('faq')} className={navItemClasses('faq')}><HelpCircle className="h-5 w-5 flex-shrink-0" /><span className={labelClasses}>FAQ</span></button>
         <button onClick={() => handleNavigation('contact')} className={navItemClasses('contact')}><Mail className="h-5 w-5 flex-shrink-0" /><span className={labelClasses}>Contato</span></button>
         <button onClick={() => handleNavigation('terms')} className={navItemClasses('terms')}><FileText className="h-5 w-5 flex-shrink-0" /><span className={labelClasses}>Termos de Uso</span></button>
         <button onClick={() => handleNavigation('privacy')} className={navItemClasses('privacy')}><Shield className="h-5 w-5 flex-shrink-0" /><span className={labelClasses}>Privacidade</span></button>
       </div>
      </nav>
    </aside> 
    </>
  );
};

export default Sidebar;