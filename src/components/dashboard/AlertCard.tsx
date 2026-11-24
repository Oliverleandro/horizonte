import React from 'react';
import { AlertOctagon, CheckCircle2, ChevronRight, Sparkles } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatBRL } from '../../utils/formatters';

interface AlertCardProps {
  onGoToSimulator: () => void;
}

export const AlertCard: React.FC<AlertCardProps> = ({ onGoToSimulator }) => {
  const { criticalAlert, lowestBalance, projectionMonths } = useFinance();

  if (criticalAlert && criticalAlert.isNegative && criticalAlert.formattedDate && criticalAlert.amount !== undefined) {
    return (
      <div className="bg-rose-50/90 border border-rose-200 rounded-3xl p-5 shadow-sm text-slate-800 transition-all">
        <div className="flex items-start gap-3.5">
          <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-rose-600/30">
            <AlertOctagon size={22} className="stroke-[2.2]" />
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold text-rose-800 uppercase tracking-wider">
                Alerta de Saldo Futuro
              </span>
              {criticalAlert.daysUntil !== undefined && (
                <span className="text-[11px] text-rose-700 bg-rose-100/70 px-2 py-0.5 rounded-full font-medium">
                  {criticalAlert.daysUntil === 0
                    ? 'Atinge hoje'
                    : criticalAlert.daysUntil === 1
                    ? 'Falta 1 dia'
                    : `Faltam ${criticalAlert.daysUntil} dias`}
                </span>
              )}
            </div>

            <p className="text-base font-bold text-rose-950 leading-snug">
              Em <span className="underline decoration-rose-400 underline-offset-2">{criticalAlert.formattedDate}</span> seu saldo pode ficar negativo ({formatBRL(criticalAlert.amount)}).
            </p>

            <p className="text-xs text-rose-800 mt-1.5 leading-relaxed">
              Com as contas programadas até lá, os gastos superam o dinheiro disponível. Que tal simular um ajuste de gastos ou adiar uma compra para evitar entrar no vermelho?
            </p>

            <div className="mt-3.5 pt-3 border-t border-rose-200/60 flex items-center justify-between">
              <button
                onClick={onGoToSimulator}
                className="text-xs font-bold text-rose-900 bg-white hover:bg-rose-100/60 border border-rose-300 px-3.5 py-1.5 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
              >
                <Sparkles size={14} className="text-rose-600" />
                <span>Simular como evitar no "E se?"</span>
                <ChevronRight size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Positive state: All clear!
  return (
    <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-3xl p-4 sm:p-5 shadow-xs">
      <div className="flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-2xl bg-teal-600 text-white flex items-center justify-center shrink-0 shadow-sm shadow-teal-600/20">
          <CheckCircle2 size={20} className="stroke-[2.2]" />
        </div>
        <div className="flex-1">
          <h4 className="text-sm font-bold text-teal-950">
            Tudo azul no seu Horizonte!
          </h4>
          <p className="text-xs text-teal-800 mt-0.5 leading-relaxed">
            Seu saldo projetado se mantém positivo pelos próximos {projectionMonths} meses. O menor valor previsto na sua conta será de{' '}
            <strong className="text-teal-950 font-bold tabular-nums">
              {formatBRL(lowestBalance.amount)}
            </strong>{' '}
            em {lowestBalance.month}.
          </p>
        </div>
      </div>
    </div>
  );
};
