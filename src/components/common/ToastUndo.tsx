import React from 'react';
import { Undo2, X, CheckCircle2 } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

export const ToastUndo: React.FC = () => {
  const { toast, dismissToast, undoLastDelete } = useFinance();

  if (!toast) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-6 sm:w-96 z-50 animate-in slide-in-from-bottom-4 duration-200">
      <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-2xl border border-slate-800 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <CheckCircle2 size={18} className="text-teal-400 shrink-0" />
          <p className="text-xs sm:text-sm font-medium text-slate-100 truncate">
            {toast.message}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {toast.canUndo && (
            <button
              onClick={() => {
                undoLastDelete();
                dismissToast();
              }}
              className="px-3 py-1.5 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1 shadow-sm transition-colors active:scale-95"
            >
              <Undo2 size={13} className="stroke-[2.5]" />
              <span>Desfazer</span>
            </button>
          )}

          <button
            onClick={dismissToast}
            className="w-7 h-7 rounded-lg text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            aria-label="Fechar aviso"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};
