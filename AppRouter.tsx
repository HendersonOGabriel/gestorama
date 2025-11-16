import React from 'react';
import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from './src/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import App from './App';
import { AuthPage } from './pages/AuthPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { UpdatePasswordPage } from './pages/UpdatePasswordPage';
import LandingPage from './pages/LandingPage';
import { ToastContainer, ToastProps } from './components/ui/Toast';

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
        {/* Landing page - accessible to everyone */}
        <Route
          path="/"
          element={
            session ? (
              <Navigate to="/app" replace />
            ) : (
              <LandingPageWrapper />
            )
          }
        />

        {/* Auth routes - accessible only when NOT logged in */}
        <Route
          path="/auth"
          element={
            session ? (
              <Navigate to="/app" replace />
            ) : (
              <AuthPageWrapper addToast={addToast} />
            )
          }
        />
        <Route
          path="/auth/reset-password"
          element={
            session ? (
              <Navigate to="/app" replace />
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
          path="/app/*"
          element={
            session ? (
              <App user={user!} session={session} />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
      </Routes>

      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </BrowserRouter>
  );
};

// Wrapper to use navigate inside LandingPage
const LandingPageWrapper = () => {
  const navigate = useNavigate();
  
  // Mark that user has visited landing page
  React.useEffect(() => {
    sessionStorage.setItem('hasVisitedLanding', 'true');
  }, []);
  
  return <LandingPage onEnter={() => navigate('/auth')} />;
};

// Wrapper for AuthPage that ensures user visited landing first
const AuthPageWrapper = ({ addToast }: { addToast: (message: string, type: 'success' | 'error' | 'info') => void }) => {
  const navigate = useNavigate();
  const hasVisitedLanding = sessionStorage.getItem('hasVisitedLanding');
  
  // If user hasn't visited landing page, redirect to it first
  if (!hasVisitedLanding) {
    return <Navigate to="/" replace />;
  }
  
  return <AuthPage addToast={addToast} />;
};
