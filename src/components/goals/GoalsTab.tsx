import React, { useState } from 'react';
import {
  Plus,
  Target,
  Pencil,
  Trash2,
  Calendar,
  Sparkles,
  AlertCircle,
  PlusCircle,
  CheckCircle2,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Goal } from '../../types/finance';
import { GoalFormModal } from './GoalFormModal';
import { EmptyState } from '../common/EmptyState';
import { HelpTooltip } from '../common/HelpTooltip';
import { formatBRL, formatDateBR } from '../../utils/formatters';
import { parseBRL } from '../../utils/money';

export const GoalsTab: React.FC = () => {
  const {
    goals,
    addGoal,
    updateGoal,
    deleteGoalWithUndo,
    contributeToGoal,
    monthlyProjections,
  } = useFinance();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [contributeGoalId, setContributeGoalId] = useState<string | null>(null);
  const [contributeType, setContributeType] = useState<'deposito' | 'resgate'>('deposito');
  const [contributeAmount, setContributeAmount] = useState<string>('100');
  const [contributeError, setContributeError] = useState<string | null>(null);

  const totalIncomes = monthlyProjections.reduce((a, b) => a + b.totalIncome, 0);
  const totalExpenses = monthlyProjections.reduce((a, b) => a + b.totalExpense, 0);
  const averageMonthlySurplus =
    (totalIncomes - totalExpenses) / (monthlyProjections.length || 1);

  const handleSaveGoal = (
    goalData: Omit<Goal, 'id' | 'createdAt'>,
    editId?: string
  ) => {
    if (editId) {
      updateGoal(editId, goalData);
    } else {
      addGoal(goalData);
    }
  };

  const selectedGoalForContribute = goals.find((g) => g.id === contributeGoalId);

  const handleContributeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setContributeError(null);
    if (!contributeGoalId || !selectedGoalForContribute) return;

    const num = parseBRL(contributeAmount);
    if (num <= 0) {
      setContributeError('Digite um valor maior que zero.');
      return;
    }

    if (contributeType === 'resgate' && num > selectedGoalForContribute.currentAmount) {
      setContributeError(`O valor máximo para resgate é ${formatBRL(selectedGoalForContribute.currentAmount)}.`);
      return;
    }

    contributeToGoal(contributeGoalId, num, contributeType);
    setContributeGoalId(null);
    setContributeAmount('100');
    setContributeType('deposito');
    setContributeError(null);
  };

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-150">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Metas & Sonhos
            </h2>
            <HelpTooltip
              title="Metas no Horizonte"
              text="Defina quanto quer juntar e a data limite. O Horizonte calcula quanto guardar por mês e avisa se cabe na sua sobra mensal."
            />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Descubra quanto poupar por mês sem comprometer suas contas essenciais
          </p>
        </div>

        <button
          onClick={() => {
            setEditingGoal(null);
            setIsModalOpen(true);
          }}
          className="min-h-[48px] px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <Plus size={18} className="stroke-[2.5]" />
          <span>Nova Meta</span>
        </button>
      </div>

      {/* Financial Capacity Banner */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between text-xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-teal-50 text-teal-700 flex items-center justify-center shrink-0">
            <Sparkles size={20} />
          </div>
          <div>
            <div className="flex items-center gap-1 mb-0.5">
              <span className="text-slate-400 text-[11px] font-semibold">
                Sua Folga Média por Mês
              </span>
              <HelpTooltip text="É o que sobra em média após pagar todas as suas contas fixas e parcelas." />
            </div>
            <span
              className={`font-extrabold tabular-nums text-sm sm:text-base ${
                averageMonthlySurplus >= 0 ? 'text-teal-800' : 'text-rose-600'
              }`}
            >
              {formatBRL(averageMonthlySurplus)} / mês
            </span>
          </div>
        </div>

        <span className="text-[11px] text-slate-500 max-w-[170px] text-right font-medium">
          Usamos este valor para checar se suas metas cabem no bolso
        </span>
      </div>

      {/* Goals List or Empty State */}
      {goals.length === 0 ? (
        <EmptyState
          icon={Target}
          title="Nenhuma meta cadastrada ainda"
          description="Crie objetivos como reserva de emergência, troca de celular ou viagem para ver quanto guardar todo mês."
          actionLabel="Criar Minha Primeira Meta"
          onAction={() => {
            setEditingGoal(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="space-y-3">
          {goals.map((goal) => {
            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const targetDateObj = new Date(goal.targetDate);
            const monthsLeft = Math.max(
              1,
              (targetDateObj.getFullYear() - today.getFullYear()) * 12 +
                (targetDateObj.getMonth() - today.getMonth())
            );
            const neededTotal = Math.max(0, goal.targetAmount - goal.currentAmount);
            const monthlySaving = neededTotal / monthsLeft;
            const progress = Math.min(
              100,
              Math.round((goal.currentAmount / goal.targetAmount) * 100)
            );
            const isCompleted = goal.currentAmount >= goal.targetAmount;
            const isFeasible = averageMonthlySurplus >= monthlySaving;

            return (
              <div
                key={goal.id}
                className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all space-y-4"
              >
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider block mb-0.5">
                      {goal.category || 'Objetivo'}
                    </span>
                    <h3 className="text-base font-bold text-slate-900">
                      {goal.title}
                    </h3>
                    <div className="flex items-center gap-1.5 text-xs text-slate-400 mt-0.5">
                      <Calendar size={12} />
                      <span>Prazo: {formatDateBR(goal.targetDate)}</span>
                      <span>·</span>
                      <span className="font-medium text-slate-600">
                        {monthsLeft} {monthsLeft === 1 ? 'mês restante' : 'meses restantes'}
                      </span>
                    </div>
                  </div>

                  {/* Actions with min 40px hitboxes */}
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => {
                        setEditingGoal(goal);
                        setIsModalOpen(true);
                      }}
                      className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors"
                      title="Editar meta"
                      aria-label={`Editar meta ${goal.title}`}
                    >
                      <Pencil size={16} />
                    </button>
                    <button
                      onClick={() => deleteGoalWithUndo(goal.id)}
                      className="min-h-[40px] min-w-[40px] rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      title="Excluir meta (com opção de desfazer)"
                      aria-label={`Excluir meta ${goal.title}`}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex items-baseline justify-between text-xs mb-1.5">
                    <span className="font-extrabold text-slate-800 tabular-nums">
                      {formatBRL(goal.currentAmount)}{' '}
                      <span className="font-normal text-slate-400">
                        de {formatBRL(goal.targetAmount)}
                      </span>
                    </span>
                    <span className="font-extrabold text-teal-700 tabular-nums">
                      {progress}%
                    </span>
                  </div>
                  <div className="w-full h-3 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        isCompleted ? 'bg-emerald-500' : 'bg-teal-600'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Plan: Monthly saving & Feasibility */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-2 border-t border-slate-100 text-xs">
                  <div className="bg-slate-50 p-3 rounded-2xl">
                    <span className="text-[11px] text-slate-500 block mb-0.5">
                      Guardar todo mês:
                    </span>
                    <span className="text-sm font-extrabold text-slate-900 tabular-nums">
                      {isCompleted ? 'Meta atingida!' : `${formatBRL(monthlySaving)} / mês`}
                    </span>
                  </div>

                  <div
                    className={`p-3 rounded-2xl flex items-center gap-2.5 ${
                      isCompleted
                        ? 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                        : isFeasible
                        ? 'bg-teal-50 text-teal-900 border border-teal-200'
                        : 'bg-amber-50 text-amber-900 border border-amber-200'
                    }`}
                  >
                    {isCompleted ? (
                      <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
                    ) : isFeasible ? (
                      <CheckCircle2 size={18} className="text-teal-600 shrink-0" />
                    ) : (
                      <AlertCircle size={18} className="text-amber-600 shrink-0" />
                    )}
                    <span className="text-[11px] leading-tight font-semibold">
                      {isCompleted
                        ? 'Parabéns, você conquistou este objetivo!'
                        : isFeasible
                        ? `Super viável! Cabe na sua folga mensal de ${formatBRL(averageMonthlySurplus)}`
                        : `Atenção: sua sobra (${formatBRL(averageMonthlySurplus)}/mês) é menor que esta meta`}
                    </span>
                  </div>
                </div>

                {/* Quick Add Contribution button with min height 44px */}
                <div className="flex items-center justify-between pt-1">
                  <button
                    onClick={() => setContributeGoalId(goal.id)}
                    className="min-h-[44px] px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors"
                  >
                    <PlusCircle size={16} />
                    <span>Guardar dinheiro nesta meta</span>
                  </button>

                  <span className="text-[11px] text-slate-400 font-medium">
                    Faltam {formatBRL(neededTotal)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Contribute Mini Modal (Depósito ou Resgate) */}
      {contributeGoalId && selectedGoalForContribute && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 space-y-4">
            <div>
              <h4 className="text-base font-bold text-slate-900">
                {selectedGoalForContribute.title}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">
                Saldo atual nesta meta: <strong className="text-slate-800 font-bold">{formatBRL(selectedGoalForContribute.currentAmount)}</strong>
              </p>
            </div>

            {/* Type Switcher: Depósito vs Resgate */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setContributeType('deposito');
                  setContributeError(null);
                }}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  contributeType === 'deposito'
                    ? 'bg-white text-teal-800 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                + Guardar (Depósito)
              </button>
              <button
                type="button"
                onClick={() => {
                  setContributeType('resgate');
                  setContributeError(null);
                }}
                className={`py-2 text-xs font-bold rounded-xl transition-all ${
                  contributeType === 'resgate'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                - Resgatar (Retirar)
              </button>
            </div>

            {contributeError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-900 font-medium">
                {contributeError}
              </div>
            )}

            <form onSubmit={handleContributeSubmit} className="space-y-4">
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  autoFocus
                  value={contributeAmount}
                  onChange={(e) => setContributeAmount(e.target.value)}
                  placeholder="100,00"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-base font-extrabold text-slate-800 tabular-nums focus:bg-white focus:outline-none focus:border-teal-500"
                />
              </div>

              {/* Quick suggestion buttons */}
              <div className="flex gap-2">
                {[50, 100, 200, 500].map((v) => (
                  <button
                    key={v}
                    type="button"
                    onClick={() => setContributeAmount(v.toString())}
                    className="flex-1 min-h-[40px] py-1.5 text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors"
                  >
                    R${v}
                  </button>
                ))}
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setContributeGoalId(null);
                    setContributeError(null);
                  }}
                  className="flex-1 min-h-[48px] py-2.5 rounded-2xl text-xs sm:text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className={`flex-1 min-h-[48px] py-2.5 rounded-2xl text-xs sm:text-sm font-bold text-white transition-colors shadow-sm ${
                    contributeType === 'resgate'
                      ? 'bg-rose-600 hover:bg-rose-700'
                      : 'bg-teal-600 hover:bg-teal-700'
                  }`}
                >
                  {contributeType === 'resgate' ? 'Confirmar Resgate' : 'Confirmar Aporte'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Goal Form Modal */}
      <GoalFormModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingGoal(null);
        }}
        onSave={handleSaveGoal}
        editingGoal={editingGoal}
      />
    </div>
  );
};
