import React, { useState, useEffect, useRef } from 'react';
import { User } from '../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Label } from '../ui/Label';
import { User as UserIcon, Upload } from 'lucide-react';

interface ProfileEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User;
  onUpdateUser: (user: User) => void;
  addToast: (message: string, type?: 'error' | 'success') => void;
  isLoading: boolean;
}

const ProfileEditModal: React.FC<ProfileEditModalProps> = ({ isOpen, onClose, user, onUpdateUser, addToast, isLoading }) => {
  const [name, setName] = useState(user.name);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(user.avatar);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setName(user.name);
      setAvatarPreview(user.avatar);
    }
  }, [isOpen, user]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // 1MB size limit
    if (file.size > 1024 * 1024) {
      addToast('A imagem é muito grande. O limite é de 1MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setAvatarPreview(reader.result as string);
    };
    reader.onerror = () => {
      addToast('Não foi possível ler a imagem.', 'error');
    };
    reader.readAsDataURL(file);
  };
  
  const handleSave = async () => {
    const updatedUser: User = {
      ...user,
      name: name.trim() || 'Usuário',
      avatar: avatarPreview,
    };
    await onUpdateUser(updatedUser);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader><DialogTitle>Editar Perfil</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="flex flex-col items-center gap-4">
            {avatarPreview ? (
              <img src={avatarPreview} alt="Avatar Preview" className="w-24 h-24 rounded-full object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center">
                <UserIcon className="w-12 h-12 text-slate-500" />
              </div>
            )}
            <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
              <Upload className="w-4 h-4 mr-2"/>
              Alterar Foto
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              accept="image/png, image/jpeg"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          <div>
            <Label htmlFor="profile-name">Nome</Label>
            <Input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="mt-1"
            />
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <Button variant="ghost" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleSave} loading={isLoading}>Salvar Alterações</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ProfileEditModal;