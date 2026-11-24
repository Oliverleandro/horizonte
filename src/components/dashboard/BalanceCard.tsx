import React from 'react';
import { Pencil, ArrowUpRight, ArrowDownRight, ShieldCheck, AlertTriangle } from 'lucide-react';
import { formatBRL } from '../../utils/formatters';
import { useFinance } from '../../context/FinanceContext';
import { HelpTooltip } from '../common/HelpTooltip';

interface BalanceCardProps {
  onEditBalance: () => void;
}

export const BalanceCard: React.FC<BalanceCardProps> = ({ onEditBalance }) => {
  const { currentBalance, monthlyProjections, projectionMonths, criticalAlert } = useFinance();

  const finalProjection = monthlyProjections[monthlyProjections.length - 1];
  const finalBalance = finalProjection ? finalProjection.endingBalance : currentBalance;
  const isGrowing = finalBalance >= currentBalance;
  const diff = finalBalance - currentBalance;

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden">
      <div className="flex items-start justify-between relative z-10">
        <div>
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              Seu Saldo Hoje na Conta
            </span>
            <HelpTooltip
              title="Saldo Hoje"
              text="É o dinheiro que você tem disponível agora no banco. A partir dele, calculamos quanto vai sobrar no futuro."
            />
          </div>

          <div className="flex items-baseline gap-2">
            <span
              className={`text-3xl sm:text-4xl font-extrabold tracking-tight tabular-nums ${
                currentBalance < 0 ? 'text-rose-600' : 'text-slate-900'
              }`}
            >
              {formatBRL(currentBalance)}
            </span>
            <button
              onClick={onEditBalance}
              title="Ajustar saldo atual"
              className="min-h-[44px] min-w-[44px] -ml-1 text-slate-400 hover:text-teal-700 hover:bg-teal-50 rounded-xl transition-colors flex items-center justify-center"
              aria-label="Editar saldo atual"
            >
              <Pencil size={18} />
            </button>
          </div>
        </div>

        {/* Status indicator */}
        <div
          className={`px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 shrink-0 ${
            criticalAlert?.isNegative
              ? 'bg-rose-50 text-rose-700 border border-rose-200'
              : 'bg-teal-50 text-teal-800 border border-teal-200'
          }`}
        >
          {criticalAlert?.isNegative ? (
            <>
              <AlertTriangle size={14} className="text-rose-600" />
              <span>Atenção futura</span>
            </>
          ) : (
            <>
              <ShieldCheck size={14} className="text-teal-600" />
              <span>No azul</span>
            </>
          )}
        </div>
      </div>

      {/* Projection summary bar */}
      <div className="mt-5 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="flex items-center gap-1 mb-0.5">
            <span className="text-slate-400">Quanto vai sobrar em {projectionMonths}m</span>
            <HelpTooltip
              title="Quanto vai sobrar"
              text="O valor estimado na sua conta ao final do período, somando tudo que vai entrar e tirando tudo que vai sair."
            />
          </div>
          <span
            className={`font-extrabold tabular-nums text-sm sm:text-base ${
              finalBalance < 0 ? 'text-rose-600' : 'text-slate-900'
            }`}
          >
            {formatBRL(finalBalance)}
          </span>
        </div>

        <div>
          <span className="text-slate-400 block mb-0.5">Diferença no período</span>
          <div className="flex items-center gap-1 font-extrabold tabular-nums text-sm sm:text-base">
            {isGrowing ? (
              <span className="text-emerald-600 flex items-center">
                <ArrowUpRight size={16} />+{formatBRL(diff)}
              </span>
            ) : (
              <span className="text-rose-600 flex items-center">
                <ArrowDownRight size={16} />-{formatBRL(Math.abs(diff))}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
