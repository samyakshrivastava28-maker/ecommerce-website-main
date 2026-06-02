import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

export const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading, isAdmin } = useAuthStore();
  const location = useLocation();

  // 10: Show premium loader state while auth listener resolves
  if (loading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center">
        <div className="w-10 h-10 border-2 border-gold-500 border-t-transparent rounded-full animate-spin transition-colors mb-4"></div>
        <div className="text-xs uppercase tracking-widest text-gold-500 font-mono animate-pulse">
          Validating Credentials...
        </div>
      </div>
    );
  }

  // Redirect to signup if not authenticated
  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
