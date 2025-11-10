
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useSupabase } from './hooks/useSupabase';
import App from './App';
import { AuthPage } from './pages/AuthPage';
import { ToastContainer, ToastProps } from './components/ui/Toast';

const AppRouter: React.FC = () => {
  const { session, loading } = useSupabase();
  const [toasts, setToasts] = React.useState<ToastProps[]>([]);

  const addToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    setToasts(prev => [...prev, { id, message, type }]);
  };

  const removeToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  };

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
        <Route
          path="/auth"
          element={
            session ? (
              <Navigate to="/" replace />
            ) : (
              <AuthPage onAuthSuccess={() => window.location.href = '/'} />
            )
          }
        />
        <Route
          path="/*"
          element={
            session ? (
              <App />
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

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <AppRouter />
  </React.StrictMode>
);
