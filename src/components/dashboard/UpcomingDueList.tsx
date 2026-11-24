import React from 'react';
import { Calendar, ArrowRight, ArrowDownLeft, ArrowUpRight, CalendarDays } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatBRL, getRelativeDaysLabel } from '../../utils/formatters';
import { HelpTooltip } from '../common/HelpTooltip';

export const UpcomingDueList: React.FC = () => {
  const { upcomingDues, setActiveTab } = useFinance();

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Próximos pagamentos e entradas
            </h3>
            <HelpTooltip
              title="Próximos Lançamentos"
              text="Mostra as 5 contas que você precisa pagar e o dinheiro que vai receber mais em breve."
            />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Organizado em ordem do que acontece primeiro
          </p>
        </div>

        <button
          onClick={() => setActiveTab('lancamentos')}
          className="min-h-[44px] px-3 py-1.5 text-xs font-bold text-teal-700 hover:text-teal-800 hover:bg-teal-50 rounded-xl flex items-center gap-1 transition-colors"
        >
          <span>Ver todos</span>
          <ArrowRight size={14} />
        </button>
      </div>

      {upcomingDues.length === 0 ? (
        <div className="py-8 text-center text-slate-400 text-xs flex flex-col items-center">
          <CalendarDays size={24} className="mb-2 text-slate-300" />
          <span>Nenhum pagamento ou entrada previsto para os próximos dias.</span>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {upcomingDues.map((item) => {
            const isIncome = item.type === 'income';
            const relativeText = getRelativeDaysLabel(item.date);
            const isUrgent =
              relativeText === 'Vence hoje' || relativeText === 'Vence amanhã';

            return (
              <div
                key={item.id}
                className="py-3.5 first:pt-1 last:pb-1 flex items-center justify-between gap-3 group hover:bg-slate-50/70 -mx-2 px-3 rounded-2xl transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div
                    className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 ${
                      isIncome
                        ? 'bg-emerald-50 text-emerald-600'
                        : 'bg-slate-100 text-slate-600'
                    }`}
                  >
                    {isIncome ? (
                      <ArrowUpRight size={18} className="stroke-[2.2]" />
                    ) : (
                      <ArrowDownLeft size={18} className="stroke-[2.2]" />
                    )}
                  </div>

                  <div className="min-w-0">
                    <p className="text-xs sm:text-sm font-bold text-slate-800 truncate">
                      {item.description}
                    </p>
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 mt-0.5">
                      <span className="flex items-center gap-1">
                        <Calendar size={11} />
                        {item.formattedDate}
                      </span>
                      <span>·</span>
                      <span
                        className={`font-semibold ${
                          isUrgent ? 'text-amber-600' : 'text-slate-500'
                        }`}
                      >
                        {relativeText}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <span
                    className={`text-xs sm:text-sm font-bold tabular-nums block ${
                      isIncome ? 'text-emerald-600' : 'text-slate-900'
                    }`}
                  >
                    {isIncome ? '+ ' : '- '}
                    {formatBRL(item.amount)}
                  </span>
                  <span className="text-[10px] text-slate-400 block mt-0.5">
                    {item.recurrence === 'monthly'
                      ? 'Todo mês'
                      : item.installmentInfo
                      ? `Parcela ${item.installmentInfo.current} de ${item.installmentInfo.total}`
                      : 'Só uma vez'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
