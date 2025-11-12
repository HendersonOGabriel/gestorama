import React from 'react';
import { Button } from '../ui/Button';
import { Sun, Moon, Laptop } from 'lucide-react';

interface ThemeSwitcherProps {
  themePreference: 'light' | 'dark' | 'system';
  onSetThemePreference: (theme: 'light' | 'dark' | 'system') => void;
}

const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ themePreference, onSetThemePreference }) => {
  return (
    <div className="flex items-center gap-2">
      <Button
        variant={themePreference === 'light' ? 'default' : 'ghost'}
        size="icon"
        onClick={() => onSetThemePreference('light')}
        aria-label="Mudar para tema claro"
      >
        <Sun className="h-5 w-5" />
      </Button>
      <Button
        variant={themePreference === 'dark' ? 'default' : 'ghost'}
        size="icon"
        onClick={() => onSetThemePreference('dark')}
        aria-label="Mudar para tema escuro"
      >
        <Moon className="h-5 w-5" />
      </Button>
      <Button
        variant={themePreference === 'system' ? 'default' : 'ghost'}
        size="icon"
        onClick={() => onSetThemePreference('system')}
        aria-label="Usar tema do sistema"
      >
        <Laptop className="h-5 w-5" />
      </Button>
    </div>
  );
};

export default ThemeSwitcher;
