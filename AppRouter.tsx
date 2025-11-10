import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Session, User } from '@supabase/supabase-js';
import App from '@/App';
import { AuthPage } from '@/pages/AuthPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { UpdatePasswordPage } from '@/pages/UpdatePasswordPage';
import { ToastContainer, ToastProps } from '@/components/ui/Toast';

export const AppRouter: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastProps[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        if (event === 'SIGNED_IN') {
          console.log('User signed in:', session?.user?.email);
        } else if (event === 'SIGNED_OUT') {
          console.log('User signed out');
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Auth routes - accessible only when NOT logged in */}
        <Route
          path="/auth"
          element={
            session ? (
              <Navigate to="/" replace />
            ) : (
              <AuthPage addToast={addToast} />
            )
          }
        />
        <Route
          path="/auth/reset-password"
          element={
            session ? (
              <Navigate to="/" replace />
            ) : (
              <ResetPasswordPage addToast={addToast} />
            )
          }
        />
        <Route
          path="/auth/update-password"
          element={<UpdatePasswordPage addToast={addToast} />}
        />

        {/* Protected routes - require authentication */}
        <Route
          path="/*"
          element={
            session ? (
              <App user={user!} session={session} />
            ) : (
              <Navigate to="/auth" replace />
            )
          }
        />
      </Routes>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </BrowserRouter>
  );
};
