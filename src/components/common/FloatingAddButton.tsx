import React from 'react';
import { Plus } from 'lucide-react';

interface FloatingAddButtonProps {
  onClick: () => void;
}

export const FloatingAddButton: React.FC<FloatingAddButtonProps> = ({ onClick }) => {
  return (
    <aside aria-label="Ações rápidas">
      <button
        onClick={onClick}
        aria-label="Adicionar novo lançamento"
        className="fixed bottom-20 right-4 sm:right-8 z-40 w-14 h-14 min-w-[56px] min-h-[56px] rounded-full bg-teal-600 hover:bg-teal-500 text-white shadow-xl shadow-teal-700/30 flex items-center justify-center transition-all duration-200 active:scale-95 hover:scale-105 focus:outline-none focus:ring-4 focus:ring-teal-500/30 group"
      >
        <Plus size={28} className="stroke-[2.5] transition-transform group-hover:rotate-90 duration-300" />
        <span className="sr-only">Adicionar lançamento</span>
      </button>
    </aside>
  );
};
