import React, { useState } from 'react';
import { Subscription, User } from '../../types';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Plus, Trash2, User as UserIcon } from 'lucide-react';

interface PlanManagementCardProps {
  subscription: Subscription;
  users: User[];
  onAddUser: (name: string, email: string) => void;
  onRemoveUser: (userId: string) => void;
  isLoading: boolean;
}

const PlanManagementCard: React.FC<PlanManagementCardProps> = ({ subscription, users, onAddUser, onRemoveUser, isLoading }) => {
  const [showInviteForm, setShowInviteForm] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');

  const canInvite = users.length < subscription.memberSlots;
  const planName = {
    'free': 'Plano Grátis',
    'premium': 'Plano Premium',
    'family': 'Plano Família',
  }[subscription.plan];

  const handleInviteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inviteName && inviteEmail) {
      onAddUser(inviteName, inviteEmail);
      setInviteName('');
      setInviteEmail('');
      setShowInviteForm(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento do Plano</CardTitle>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Você está no <strong>{planName}</strong>. Membros: {users.length} de {subscription.memberSlots}.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Membros da Conta</h4>
          <div className="space-y-2">
            {users.map(user => (
              <div key={user.id} className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800/50 rounded-lg">
                <div className="flex items-center gap-3">
                  {user.avatar ? (
                    <img src={user.avatar} alt={user.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <span className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                      <UserIcon className="w-4 h-4 text-slate-500" />
                    </span>
                  )}
                  <div>
                    <p className="font-medium text-sm">{user.name} {user.role === 'owner' && '(Você)'}</p>
                    <p className="text-xs text-slate-500">{user.email}</p>
                  </div>
                </div>
                {user.role !== 'owner' && (
                  <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500" onClick={() => onRemoveUser(user.id)} loading={isLoading}>
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>

        {showInviteForm ? (
          <form onSubmit={handleInviteSubmit} className="p-4 border-t border-slate-200 dark:border-slate-700 space-y-3">
            <h4 className="font-semibold">Convidar Novo Membro</h4>
            <Input 
              placeholder="Nome do membro" 
              value={inviteName} 
              onChange={e => setInviteName(e.target.value)} 
              required
            />
            <Input 
              type="email" 
              placeholder="E-mail do membro" 
              value={inviteEmail} 
              onChange={e => setInviteEmail(e.target.value)} 
              required
            />
            <div className="flex justify-end gap-2">
              <Button type="button" variant="ghost" onClick={() => setShowInviteForm(false)}>Cancelar</Button>
              <Button type="submit" loading={isLoading}>Enviar Convite</Button>
            </div>
          </form>
        ) : (
          canInvite && (
            <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
              <Button variant="outline" onClick={() => setShowInviteForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Convidar Membro
              </Button>
            </div>
          )
        )}
      </CardContent>
    </Card>
  );
};

export default PlanManagementCard;