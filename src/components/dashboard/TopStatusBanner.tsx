import React from 'react';
import { CheckCircle2, AlertTriangle, AlertOctagon, ArrowRight } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatBRL } from '../../utils/formatters';

interface TopStatusBannerProps {
  onGoToSimulator: () => void;
}

export const TopStatusBanner: React.FC<TopStatusBannerProps> = ({ onGoToSimulator }) => {
  const { monthlyProjections, criticalAlert } = useFinance();

  const currentMonth = monthlyProjections[0];
  const endingBalance = currentMonth ? currentMonth.endingBalance : 0;
  const isNegativeAnywhere = criticalAlert && criticalAlert.isNegative;

  // Evaluation: Red, Yellow or Green
  let status: 'red' | 'yellow' | 'green' = 'green';
  let message = '';
  let submessage = '';

  if (isNegativeAnywhere || endingBalance < 0) {
    status = 'red';
    message = criticalAlert?.formattedDate
      ? `Atenção: seu dinheiro pode faltar em ${criticalAlert.formattedDate} (${formatBRL(criticalAlert.amount || 0)}).`
      : `Atenção: você pode terminar o mês no vermelho com ${formatBRL(endingBalance)}.`;
    submessage = 'Simule adiar um gasto ou cortar despesas para manter as contas no azul.';
  } else if (endingBalance < 350) {
    status = 'yellow';
    message = `Cuidado com imprevistos: você termina o mês com apenas ${formatBRL(endingBalance)} de sobra.`;
    submessage = 'Sua folga financeira está apertada. Evite novas parcelas neste momento.';
  } else {
    status = 'green';
    message = `Tudo sob controle! Você termina o mês com ${formatBRL(endingBalance)} de sobra.`;
    submessage = 'Seu dinheiro está planejado e seu saldo se mantém seguro nos próximos meses.';
  }

  return (
    <div
      className={`p-4 sm:p-5 rounded-3xl border transition-all shadow-xs ${
        status === 'red'
          ? 'bg-rose-50 border-rose-300 text-rose-950'
          : status === 'yellow'
          ? 'bg-amber-50 border-amber-300 text-amber-950'
          : 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
      }`}
    >
      <div className="flex items-start gap-3">
        <div
          className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-xs ${
            status === 'red'
              ? 'bg-rose-600 shadow-rose-600/30'
              : status === 'yellow'
              ? 'bg-amber-600 shadow-amber-600/30'
              : 'bg-emerald-600 shadow-emerald-600/30'
          }`}
        >
          {status === 'red' ? (
            <AlertOctagon size={22} className="stroke-[2.2]" />
          ) : status === 'yellow' ? (
            <AlertTriangle size={22} className="stroke-[2.2]" />
          ) : (
            <CheckCircle2 size={22} className="stroke-[2.2]" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-[10px] font-bold uppercase tracking-wider block opacity-75 mb-0.5">
            Diagnóstico do Mês
          </span>
          <p className="text-sm sm:text-base font-extrabold leading-snug">
            {message}
          </p>
          <p className="text-xs mt-1 opacity-90 leading-relaxed">
            {submessage}
          </p>

          {status === 'red' && (
            <div className="mt-3 pt-2.5 border-t border-rose-200">
              <button
                onClick={onGoToSimulator}
                className="min-h-[44px] px-3.5 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold inline-flex items-center gap-1.5 transition-colors shadow-xs active:scale-95"
              >
                <span>Simular como evitar o vermelho</span>
                <ArrowRight size={14} />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
