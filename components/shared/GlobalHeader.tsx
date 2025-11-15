
import React from 'react';
import NotificationBell from './NotificationBell';
import { Menu, Star } from 'lucide-react';
import { Button } from '../ui/Button';
import { GamificationState } from '../../types';
import { cn } from '../../utils/helpers';

interface GlobalHeaderProps {
  currentPage: string;
  notifications: { id: string; type: string; message: string }[];
  onClearNotifications: () => void;
  onToggleMobileMenu: () => void;
  isMobileMenuOpen: boolean;
  gamification: GamificationState;
}

const GamificationWidget: React.FC<{ gamification: GamificationState }> = ({ gamification }) => {
  const progress = (gamification.xp / gamification.xpToNextLevel) * 100;

  return (
    <div className="hidden sm:flex items-center gap-2 text-sm" title={`Nível ${gamification.level} - ${gamification.xp} / ${gamification.xpToNextLevel} XP`}>
      <Star className="w-5 h-5 text-amber-400 flex-shrink-0" />
      <div className="font-semibold text-indigo-400">{gamification.level}</div>
      <div className="w-12 sm:w-20 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
        <div 
          className="h-full bg-amber-400 transition-all duration-500"
          style={{ width: `${progress}%` }}
        ></div>
      </div>
      <div className="hidden sm:block text-xs text-slate-400">{gamification.xp}/{gamification.xpToNextLevel}</div>
    </div>
  );
};

const GlobalHeader: React.FC<GlobalHeaderProps> = ({ currentPage, notifications, onClearNotifications, onToggleMobileMenu, isMobileMenuOpen, gamification }) => {
  const getTitle = () => {
    switch(currentPage) {
      case 'dashboard': return 'Visão Geral';
      case 'reports': return 'Relatórios';
      case 'planning': return 'Planejamento';
      case 'calendar': return 'Calendário';
      case 'profile': return 'Perfil';
      case 'subscription': return 'Assinatura';
      case 'about': return 'Sobre';
      case 'faq': return 'FAQ';
      case 'contact': return 'Contato';
      case 'terms': return 'Termos de Uso';
      case 'privacy': return 'Privacidade';
      default: return 'Gestorama';
    }
  };

  return (
    <>
      <header className="sticky top-0 z-20 bg-slate-100 dark:bg-slate-950 px-4 sm:px-6 py-4 sm:py-6 flex items-center justify-between gap-4">
        <div className="flex items-center gap-2 flex-shrink min-w-0">
          <Button
            variant="ghost"
            size="icon" 
            className="md:hidden -ml-2" 
            onClick={onToggleMobileMenu}
            aria-label="Abrir menu"
            aria-controls="sidebar"
            aria-expanded={isMobileMenuOpen}
          >
            <Menu className="w-6 h-6" />
          </Button>
          <h1 className="flex-shrink min-w-0 truncate text-xl font-semibold sm:text-2xl">{getTitle()}</h1>
        </div>
        <div className="flex flex-shrink items-center gap-2 sm:gap-4">
            <GamificationWidget gamification={gamification} />
            <div className="relative z-50">
               <NotificationBell notifications={notifications} onClear={onClearNotifications} />
            </div>
        </div>
      </header>
    </>
  );
};

export default GlobalHeader;
