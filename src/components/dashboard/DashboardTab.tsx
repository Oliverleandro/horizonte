import React from 'react';
import { TopStatusBanner } from './TopStatusBanner';
import { BalanceCard } from './BalanceCard';
import { AlertCard } from './AlertCard';
import { ProjectionChart } from './ProjectionChart';
import { UpcomingDueList } from './UpcomingDueList';
import { useFinance } from '../../context/FinanceContext';
import { formatBRL } from '../../utils/formatters';
import { PiggyBank, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { HelpTooltip } from '../common/HelpTooltip';

interface DashboardTabProps {
  onEditBalance: () => void;
  onOpenNewTransaction: () => void;
}

export const DashboardTab: React.FC<DashboardTabProps> = ({
  onEditBalance,
  onOpenNewTransaction: _onOpenNewTransaction,
}) => {
  const { monthlyProjections, setActiveTab, projectionMonths, criticalAlert } = useFinance();

  // Summary figures across current projection horizon
  const totalIncomes = monthlyProjections.reduce((acc, curr) => acc + curr.totalIncome, 0);
  const totalExpenses = monthlyProjections.reduce((acc, curr) => acc + curr.totalExpense, 0);
  const averageMonthlySurplus = (totalIncomes - totalExpenses) / (monthlyProjections.length || 1);

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-150">
      {/* 1. Resumo em uma frase no topo (Verde, Amarelo ou Vermelho) */}
      <TopStatusBanner onGoToSimulator={() => setActiveTab('simulador')} />

      {/* 2. Saldo atual editável */}
      <BalanceCard onEditBalance={onEditBalance} />

      {/* 3. Alerta de saldo negativo se houver */}
      {criticalAlert?.isNegative && (
        <AlertCard onGoToSimulator={() => setActiveTab('simulador')} />
      )}

      {/* 4. Gráfico: Quanto vai sobrar nos próximos meses */}
      <ProjectionChart />

      {/* Quick macro cards com linguagem simples */}
      <div className="grid grid-cols-3 gap-2.5">
        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Vai entrar
            </span>
            <HelpTooltip text="Total de dinheiro que você vai receber ao longo dos próximos meses." />
          </div>
          <span className="text-xs sm:text-sm font-extrabold text-emerald-600 tabular-nums flex items-center gap-0.5 mt-1">
            <ArrowUpRight size={14} className="stroke-[2.5]" />
            {formatBRL(totalIncomes)}
          </span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Vai sair
            </span>
            <HelpTooltip text="Total de contas e compras que você terá que pagar no período." />
          </div>
          <span className="text-xs sm:text-sm font-extrabold text-slate-700 tabular-nums flex items-center gap-0.5 mt-1">
            <ArrowDownRight size={14} className="stroke-[2.5]" />
            {formatBRL(totalExpenses)}
          </span>
        </div>

        <div className="bg-white p-3 rounded-2xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Sobra média
            </span>
            <HelpTooltip text="A folga média de dinheiro que sobra no seu bolso a cada mês." />
          </div>
          <span
            className={`text-xs sm:text-sm font-extrabold tabular-nums flex items-center gap-0.5 mt-1 ${
              averageMonthlySurplus >= 0 ? 'text-teal-700' : 'text-rose-600'
            }`}
          >
            <PiggyBank size={14} className="stroke-[2.5]" />
            {formatBRL(averageMonthlySurplus)}
          </span>
        </div>
      </div>

      {/* 5. Próximos pagamentos e entradas */}
      <UpcomingDueList />
    </div>
  );
};
