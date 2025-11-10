import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/src/integrations/supabase/client';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';

interface ResetPasswordPageProps {
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export const ResetPasswordPage: React.FC<ResetPasswordPageProps> = ({ addToast }) => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/update-password`,
      });

      if (error) throw error;

      setSent(true);
      addToast('Email de recuperação enviado! Verifique sua caixa de entrada.', 'success');
    } catch (error: any) {
      addToast(error.message || 'Erro ao enviar email de recuperação', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/10 via-background to-secondary/10 p-4">
      <div className="w-full max-w-md">
        <div className="bg-card rounded-2xl shadow-xl p-8 border border-border">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-foreground mb-2">
              Recuperar senha
            </h1>
            <p className="text-muted-foreground">
              Digite seu email para receber um link de recuperação
            </p>
          </div>

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="seu@email.com"
                  required
                  disabled={loading}
                />
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                {loading ? 'Enviando...' : 'Enviar link de recuperação'}
              </Button>
            </form>
          ) : (
            <div className="text-center">
              <div className="mb-4 p-4 bg-primary/10 rounded-lg">
                <p className="text-foreground">
                  ✓ Email enviado com sucesso!
                </p>
                <p className="text-sm text-muted-foreground mt-2">
                  Verifique sua caixa de entrada e clique no link para redefinir sua senha.
                </p>
              </div>
            </div>
          )}

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => navigate('/auth')}
              className="text-primary hover:underline text-sm"
              disabled={loading}
            >
              ← Voltar para login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
