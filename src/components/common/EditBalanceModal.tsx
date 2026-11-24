import React, { useState } from 'react';
import { X, Check } from 'lucide-react';
import { formatBRL } from '../../utils/formatters';
import { parseBRL } from '../../utils/money';

interface EditBalanceModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentBalance: number;
  onSave: (newBalance: number) => void;
}

export const EditBalanceModal: React.FC<EditBalanceModalProps> = ({
  isOpen,
  onClose,
  currentBalance,
  onSave,
}) => {
  const [valStr, setValStr] = useState(currentBalance.toString());

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNum = parseBRL(valStr);
    onSave(cleanNum);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden">
        <div className="flex items-center justify-between px-6 pt-5 pb-3">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Atualizar Saldo Atual</h3>
            <p className="text-xs text-slate-500">Quanto você tem na conta hoje?</p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 pt-2 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Valor em conta (R$)
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                R$
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={valStr}
                onChange={(e) => setValStr(e.target.value)}
                placeholder="0,00"
                autoFocus
                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-800 tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/30 focus:border-teal-500 transition-all"
              />
            </div>
            <p className="mt-2 text-xs text-slate-500">
              Valor atual gravado: {formatBRL(currentBalance)}
            </p>
          </div>

          <div className="flex gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[48px] py-3 px-4 rounded-2xl text-xs sm:text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 min-h-[48px] py-3 px-4 rounded-2xl text-xs sm:text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <Check size={16} />
              Confirmar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
