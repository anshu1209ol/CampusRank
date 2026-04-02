import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/src/contexts/AuthContext';

export default function AuthGuard({ children, allowedRoles }: { children: React.ReactNode, allowedRoles?: string[] }) {
  const { user, profile, loading, isAuthReady } = useAuth();
  const location = useLocation();

  if (loading || !isAuthReady) {
    return (
      <div className="min-h-screen bg-[#050505] flex flex-col items-center justify-center gap-8">
        <div className="relative">
          <div className="w-24 h-24 border-2 border-white/5 rounded-[32px] animate-[spin_3s_linear_infinite]" />
          <div className="absolute inset-0 w-24 h-24 border-t-2 border-indigo-500 rounded-[32px] animate-[spin_1.5s_ease-in-out_infinite]" />
          <div className="absolute inset-4 w-16 h-16 border-b-2 border-emerald-500 rounded-[24px] animate-[spin_2s_linear_infinite_reverse]" />
        </div>
        <div className="flex flex-col items-center gap-2">
          <span className="text-[10px] font-mono font-bold text-white/20 uppercase tracking-[0.5em] animate-pulse">Authenticating Protocol</span>
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="w-1 h-1 bg-indigo-500 rounded-full animate-bounce" style={{ animationDelay: `${i * 0.1}s` }} />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && profile && !allowedRoles.includes(profile.role)) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}
