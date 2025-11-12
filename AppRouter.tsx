import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { supabase } from '@/src/integrations/supabase/client';
import { Session, User } from '@supabase/supabase-js';
import App from '@/App';
import { AuthPage } from '@/pages/AuthPage';
import { ResetPasswordPage } from '@/pages/ResetPasswordPage';
import { UpdatePasswordPage } from '@/pages/UpdatePasswordPage';
import LandingPage from '@/pages/LandingPage';
import { ToastContainer, ToastProps } from '@/components/ui/Toast';
import { loadState, saveState } from './services/storageService';

export const AppRouter: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [toasts, setToasts] = useState<ToastProps[]>([]);
  const [themePreference, setThemePreference] = useState<'light' | 'dark' | 'system'>(() => {
    const stored = loadState();
    return stored.themePreference || 'system';
  });

  useEffect(() => {
    const applyTheme = (theme: 'light' | 'dark') => {
        if (theme === 'dark') {
            document.documentElement.classList.add('dark');
        } else {
            document.documentElement.classList.remove('dark');
        }
    };

    if (themePreference === 'system') {
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        applyTheme(mediaQuery.matches ? 'dark' : 'light');

        const handler = (e: MediaQueryListEvent) => applyTheme(e.matches ? 'dark' : 'light');
        mediaQuery.addEventListener('change', handler);
        return () => mediaQuery.removeEventListener('change', handler);
    } else {
        applyTheme(themePreference);
    }
  }, [themePreference]);

  const handleSetThemePreference = (theme: 'light' | 'dark' | 'system') => {
    setThemePreference(theme);
    saveState({ themePreference: theme });
  };

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
        {/* Landing page - accessible to everyone */}
        <Route
          path="/"
          element={
            session ? (
              <Navigate to="/app" replace />
            ) : (
              <RootWrapper
                themePreference={themePreference}
                setThemePreference={handleSetThemePreference}
              />
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
              <AuthPage
                addToast={addToast}
                themePreference={themePreference}
                onSetThemePreference={handleSetThemePreference}
              />
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
              <App
                user={user!}
                session={session}
                themePreference={themePreference}
                setThemePreference={handleSetThemePreference}
              />
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

// Wrapper for the root route
const RootWrapper = ({
  themePreference,
  setThemePreference,
}: {
  themePreference: 'light' | 'dark' | 'system';
  setThemePreference: (theme: 'light' | 'dark' | 'system') => void;
}) => {
  const navigate = useNavigate();
  const hasVisitedLanding = localStorage.getItem('hasVisitedLanding');

  React.useEffect(() => {
    if (!hasVisitedLanding) {
      // Mark that user has now visited the landing page
      localStorage.setItem('hasVisitedLanding', 'true');
    }
  }, [hasVisitedLanding]);

  if (hasVisitedLanding) {
    return <Navigate to="/auth" replace />;
  }
  
  return (
    <LandingPage
      onEnter={() => navigate('/auth')}
      themePreference={themePreference}
      onSetThemePreference={setThemePreference}
    />
  );
};

