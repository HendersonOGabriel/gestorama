
import React, { useState } from 'react';
import { User, Subscription, AppState, GamificationState } from '../types';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import ProfileEditModal from '../components/profile/ProfileEditModal';
import PlanManagementCard from '../components/profile/PlanManagementCard';
import YaraWhatsAppCard from '../components/profile/YaraWhatsAppCard';
import ImportDataCard from '../components/profile/ImportDataCard';
import { Edit3, LogOut, Trash2, Moon, Sun, User as UserIcon, Monitor, Upload, Download, Star } from 'lucide-react';

interface ProfilePageProps {
  ownerProfile: User;
  users: User[];
  subscription: Subscription;
  onUpdateUser: (user: User) => void;
  onAddUser: (name: string, email: string) => void;
  onRemoveUser: (userId: string) => void;
  addToast: (message: string, type?: 'error' | 'success') => void;
  onGoToSubscription: () => void;
  themePreference: 'light' | 'dark' | 'system';
  onSetThemePreference: (theme: 'light' | 'dark' | 'system') => void;
  isLoading: boolean;
  onOpenImport: () => void;
  onImportComplete: () => void;
  appState: Partial<AppState>;
  gamification: GamificationState;
  onLogout: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({
  ownerProfile,
  users,
  subscription,
  onUpdateUser,
  onAddUser,
  onRemoveUser,
  addToast,
  onGoToSubscription,
  themePreference,
  onSetThemePreference,
  isLoading,
  onOpenImport,
  onImportComplete,
  appState,
  gamification,
  onLogout
}) => {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const progress = (gamification.xp / gamification.xpToNextLevel) * 100;

  const handleExportData = () => {
    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
      JSON.stringify(appState, null, 2)
    )}`;
    const link = document.createElement("a");
    link.href = jsonString;
    link.download = `gestorama_backup_${new Date().toISOString().slice(0,10)}.json`;
    link.click();
    addToast('Dados exportados com sucesso!', 'success');
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      <div className="lg:col-span-1 space-y-6">
        <Card>
          <CardHeader className="items-center text-center">
            {ownerProfile.avatar ? (
              <img src={ownerProfile.avatar} alt={ownerProfile.name} className="w-24 h-24 rounded-full object-cover mb-2" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center mb-2">
                <UserIcon className="w-12 h-12 text-slate-500" />
              </div>
            )}
            <CardTitle>{ownerProfile.name}</CardTitle>
            <p className="text-sm text-slate-500 dark:text-slate-400">{ownerProfile.email}</p>
          </CardHeader>
          <CardContent>
            <Button onClick={() => setIsEditModalOpen(true)} className="w-full">
              <Edit3 className="w-4 h-4 mr-2" />
              Editar Perfil
            </Button>
          </CardContent>
        </Card>

        <YaraWhatsAppCard addToast={(msg) => addToast(msg, 'success')} />

        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                <Star className="w-5 h-5 text-amber-400" />
                Nível e Progresso
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-center gap-6">
                    <div className="flex flex-col items-center">
                        <span className="text-xs text-slate-500 dark:text-slate-400">Nível</span>
                        <span className="text-5xl font-bold text-indigo-500 dark:text-indigo-400">{gamification.level}</span>
                    </div>
                    <div className="flex-1">
                        <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2.5">
                        <div
                            className="bg-amber-400 h-2.5 rounded-full transition-all duration-500"
                            style={{ width: `${progress}%` }}
                        ></div>
                        </div>
                        <p className="text-sm text-center mt-2 text-slate-500 dark:text-slate-400">
                        {gamification.xp} / {gamification.xpToNextLevel} XP
                        </p>
                    </div>
                </div>
                 <p className="text-xs text-center text-slate-500">
                    Continue usando o app para ganhar XP e subir de nível!
                </p>
            </CardContent>
        </Card>

        <Card>
            <CardHeader><CardTitle>Preferências</CardTitle></CardHeader>
            <CardContent>
                <div className="flex justify-between items-center">
                    <span className="font-medium">Tema</span>
                    <div className="flex items-center gap-1 p-1 rounded-md border bg-slate-100 dark:bg-slate-800">
                        <Button
                            variant={themePreference === 'light' ? 'default' : 'ghost'}
                            size="icon" className="h-7 w-7"
                            onClick={() => onSetThemePreference('light')}
                            title="Tema Claro"
                        ><Sun className="w-4 h-4"/></Button>
                        <Button
                            variant={themePreference === 'dark' ? 'default' : 'ghost'}
                            size="icon" className="h-7 w-7"
                            onClick={() => onSetThemePreference('dark')}
                             title="Tema Escuro"
                        ><Moon className="w-4 h-4"/></Button>
                        <Button
                            variant={themePreference === 'system' ? 'default' : 'ghost'}
                            size="icon" className="h-7 w-7"
                            onClick={() => onSetThemePreference('system')}
                            title="Usar tema do sistema"
                        ><Monitor className="w-4 h-4"/></Button>
                    </div>
                </div>
            </CardContent>
        </Card>

      </div>
      <div className="lg:col-span-2 space-y-6">
        <PlanManagementCard
          subscription={subscription}
          users={users}
          onAddUser={onAddUser}
          onRemoveUser={onRemoveUser}
          isLoading={isLoading}
        />
        <ImportDataCard addToast={addToast} onImportComplete={onImportComplete} />
        <Card>
            <CardHeader><CardTitle>Gerenciamento de Dados</CardTitle></CardHeader>
            <CardContent className="flex flex-col sm:flex-row flex-wrap gap-3">
                <Button variant="outline" className="w-full" onClick={handleExportData}>
                    <Download className="w-4 h-4 mr-2" />
                    Exportar Dados (JSON)
                </Button>
            </CardContent>
        </Card>
        <Card>
            <CardHeader><CardTitle>Ações da Conta</CardTitle></CardHeader>
            <CardContent className="flex flex-col sm:flex-row flex-wrap gap-3">
                 <Button variant="outline" className="w-full" onClick={onGoToSubscription}>
                    Ver Planos e Assinatura
                 </Button>
                <Button variant="outline" className="w-full" onClick={onLogout}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sair (Logout)
                </Button>
                 <Button variant="destructive" className="w-full">
                    <Trash2 className="w-4 h-4 mr-2" />
                    Excluir Conta Permanentemente
                </Button>
            </CardContent>
        </Card>
      </div>

      <ProfileEditModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        user={ownerProfile}
        onUpdateUser={onUpdateUser}
        addToast={addToast}
        isLoading={isLoading}
      />
    </div>
  );
};

export default ProfilePage;
