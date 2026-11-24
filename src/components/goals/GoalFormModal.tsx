import React, { useState, useEffect } from 'react';
import { X, Check, Target } from 'lucide-react';
import { Goal } from '../../types/finance';
import { formatBRL } from '../../utils/formatters';
import { parseBRL, subtractMoney, divideMoney } from '../../utils/money';

interface GoalFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (goalData: Omit<Goal, 'id' | 'createdAt'>, editId?: string) => void;
  editingGoal?: Goal | null;
}

export const GoalFormModal: React.FC<GoalFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingGoal,
}) => {
  const [title, setTitle] = useState('');
  const [targetAmountStr, setTargetAmountStr] = useState('');
  const [currentAmountStr, setCurrentAmountStr] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [category, setCategory] = useState('Reserva');

  useEffect(() => {
    if (editingGoal) {
      setTitle(editingGoal.title);
      setTargetAmountStr(editingGoal.targetAmount.toString());
      setCurrentAmountStr(editingGoal.currentAmount.toString());
      setTargetDate(editingGoal.targetDate);
      setCategory(editingGoal.category || 'Reserva');
    } else {
      setTitle('');
      setTargetAmountStr('');
      setCurrentAmountStr('0');
      // Default to 6 months from now
      const d = new Date();
      d.setMonth(d.getMonth() + 6);
      setTargetDate(d.toISOString().slice(0, 10));
      setCategory('Reserva');
    }
  }, [editingGoal, isOpen]);

  if (!isOpen) return null;

  const targetAmount = parseBRL(targetAmountStr);
  const currentAmount = parseBRL(currentAmountStr);

  // Calculate months remaining
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const targetDateObj = new Date(targetDate);
  const monthsDiff = Math.max(
    1,
    (targetDateObj.getFullYear() - today.getFullYear()) * 12 +
      (targetDateObj.getMonth() - today.getMonth())
  );
  const remaining = Math.max(0, subtractMoney(targetAmount, currentAmount));
  const monthlySavingsNeeded = divideMoney(remaining, monthsDiff);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || targetAmount <= 0) return;

    onSave(
      {
        title: title.trim(),
        targetAmount,
        currentAmount,
        targetDate,
        category,
      },
      editingGoal ? editingGoal.id : undefined
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between z-10">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {editingGoal ? 'Editar Meta' : 'Criar Nova Meta'}
            </h3>
            <p className="text-xs text-slate-500">
              Defina um objetivo financeiro e veja quanto guardar por mês
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Nome da Meta
            </label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Reserva de Emergência, Carro Novo, Casamento..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-teal-500 transition-all"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Valor Alvo (R$)
              </label>
              <input
                type="text"
                inputMode="decimal"
                required
                value={targetAmountStr}
                onChange={(e) => setTargetAmountStr(e.target.value)}
                placeholder="Ex: 5000,00"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 tabular-nums focus:bg-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Já guardado (R$)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={currentAmountStr}
                onChange={(e) => setCurrentAmountStr(e.target.value)}
                placeholder="0,00"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-800 tabular-nums focus:bg-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Prazo / Data Alvo
              </label>
              <input
                type="date"
                required
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Tipo da Meta
              </label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
              >
                <option value="Reserva">Reserva & Segurança</option>
                <option value="Viagem">Viagem & Lazer</option>
                <option value="Bens">Compra de Bem / Veículo</option>
                <option value="Educação">Educação / Curso</option>
                <option value="Outro">Outro Sonho</option>
              </select>
            </div>
          </div>

          {/* Quick calculation preview */}
          {targetAmount > 0 && (
            <div className="p-3.5 bg-teal-50/80 border border-teal-100 rounded-2xl text-xs text-teal-950 flex items-start gap-2.5">
              <Target size={18} className="text-teal-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">
                  Guardar {formatBRL(monthlySavingsNeeded)} por mês
                </span>
                <span className="text-teal-800 mt-0.5 block">
                  Durante {monthsDiff} meses para atingir {formatBRL(targetAmount)}.
                </span>
              </div>
            </div>
          )}

          <div className="flex gap-2 pt-3">
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
              <span>{editingGoal ? 'Salvar' : 'Criar Meta'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
