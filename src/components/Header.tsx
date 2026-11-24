import React, { useState } from 'react';
import { Plus, RotateCcw, TrendingUp, HelpCircle, User as UserIcon, RefreshCw, AlertCircle } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';

interface HeaderProps {
  onOpenNewTransaction: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenNewTransaction }) => {
  const { resetToSampleData, setIsOnboardingOpen, setActiveTab, isSyncing, networkError, retrySync } = useFinance();
  const { user, profile } = useAuth();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80">
      {/* Network error banner if synchronization failed */}
      {networkError && (
        <div className="bg-rose-500 text-white text-xs px-4 py-2 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <AlertCircle size={14} />
            <span>{networkError}</span>
          </div>
          <button
            onClick={retrySync}
            className="underline font-bold text-white hover:text-rose-100 flex items-center gap-1"
          >
            <RefreshCw size={12} className={isSyncing ? 'animate-spin' : ''} />
            <span>Tentar novamente</span>
          </button>
        </div>
      )}

      <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
        {/* Brand */}
        <button
          onClick={() => setActiveTab('inicio')}
          className="flex items-center gap-2.5 text-left focus:outline-none"
        >
          <div className="w-10 h-10 rounded-2xl bg-teal-600 flex items-center justify-center text-white shadow-sm shadow-teal-600/25">
            <TrendingUp size={22} className="stroke-[2.5]" />
          </div>
          <div>
            <h1 className="text-base font-extrabold text-slate-900 tracking-tight leading-none">
              Horizonte
            </h1>
            <span className="text-[11px] font-bold text-teal-700 tracking-wide uppercase">
              Finanças Futuras
            </span>
          </div>
        </button>

        {/* Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Sync indicator */}
          {isSyncing && (
            <div className="flex items-center gap-1 text-[11px] text-teal-700 bg-teal-50 px-2 py-1 rounded-lg">
              <RefreshCw size={11} className="animate-spin" />
              <span className="hidden sm:inline">Sincronizando...</span>
            </div>
          )}

          {/* Tour / Help Button */}
          <button
            onClick={() => setIsOnboardingOpen(true)}
            title="Como usar o app"
            className="min-h-[44px] min-w-[44px] p-2 text-slate-500 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-colors flex items-center justify-center gap-1 text-xs font-semibold"
            aria-label="Abrir guia do aplicativo"
          >
            <HelpCircle size={18} className="stroke-[2.2]" />
            <span className="hidden sm:inline">Ajuda</span>
          </button>

          {/* User Profile Avatar */}
          <button
            onClick={() => setActiveTab('perfil')}
            title="Meu Perfil"
            className="min-h-[44px] min-w-[44px] p-1.5 text-slate-600 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-colors flex items-center justify-center gap-1.5 text-xs font-semibold"
            aria-label="Ir para Perfil"
          >
            <div className="w-7 h-7 rounded-full bg-slate-100 border border-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs">
              {profile?.nome ? profile.nome.charAt(0).toUpperCase() : <UserIcon size={14} />}
            </div>
            <span className="hidden md:inline max-w-[100px] truncate">
              {profile?.nome?.split(' ')[0] || user?.email?.split('@')[0]}
            </span>
          </button>

          {/* Quick launch */}
          <button
            onClick={onOpenNewTransaction}
            className="min-h-[44px] flex items-center gap-1.5 px-3.5 py-2 bg-teal-600 hover:bg-teal-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm shadow-teal-600/20 transition-all active:scale-95"
          >
            <Plus size={18} className="stroke-[2.5]" />
            <span>Lançar</span>
          </button>
        </div>
      </div>
    </header>
  );
};
