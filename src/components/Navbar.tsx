import React from 'react';
import { Home, ReceiptText, Sparkles, Target, User } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';

export const Navbar: React.FC = () => {
  const { activeTab, setActiveTab } = useFinance();

  const navItems = [
    { id: 'inicio' as const, label: 'Início', icon: Home },
    { id: 'lancamentos' as const, label: 'Lançamentos', icon: ReceiptText },
    { id: 'simulador' as const, label: 'Simulador', icon: Sparkles },
    { id: 'metas' as const, label: 'Metas', icon: Target },
    { id: 'perfil' as const, label: 'Perfil', icon: User },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-lg shadow-slate-900/5"
      aria-label="Navegação principal"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 items-center h-[68px] pb-safe">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              aria-label={`Aba ${item.label}`}
              className={`flex flex-col items-center justify-center h-full min-h-[48px] transition-all relative ${
                isActive
                  ? 'text-teal-700 font-bold'
                  : 'text-slate-400 hover:text-slate-700'
              }`}
            >
              {isActive && (
                <span className="absolute top-0 w-8 h-1 bg-teal-600 rounded-b-full transition-all" />
              )}
              <Icon
                size={22}
                className={`transition-transform duration-200 ${
                  isActive ? 'scale-110 stroke-[2.4]' : 'stroke-[1.8]'
                }`}
              />
              <span
                className={`text-[10px] sm:text-[11px] tracking-tight mt-1 leading-none ${
                  isActive ? 'font-bold' : 'font-medium'
                }`}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
