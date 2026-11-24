import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
  CartesianGrid,
} from 'recharts';
import { useFinance } from '../../context/FinanceContext';
import { formatBRL, formatShortBRL } from '../../utils/formatters';
import { HelpTooltip } from '../common/HelpTooltip';

interface TooltipPayloadItem {
  value: number;
  dataKey: string;
  payload: {
    monthLabel: string;
    endingBalance: number;
    totalIncome: number;
    totalExpense: number;
    lowestProjectedBalance: number;
    hasNegativeBalance: boolean;
  };
}

const CustomTooltip = ({
  active,
  payload,
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    const isNeg = data.endingBalance < 0;

    return (
      <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-800 text-xs min-w-[200px] animate-in fade-in duration-150">
        <p className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 mb-2 flex items-center justify-between">
          <span>{data.monthLabel}</span>
          {isNeg && (
            <span className="text-[10px] bg-rose-500/20 text-rose-300 px-2 py-0.5 rounded-full font-bold">
              Faltará dinheiro
            </span>
          )}
        </p>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Quanto vai sobrar:</span>
            <span
              className={`font-bold tabular-nums text-sm ${
                isNeg ? 'text-rose-400' : 'text-teal-300'
              }`}
            >
              {formatBRL(data.endingBalance)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Entrou no mês:</span>
            <span className="text-emerald-400 font-semibold tabular-nums">
              +{formatBRL(data.totalIncome)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-slate-400">Saiu no mês:</span>
            <span className="text-rose-300 font-semibold tabular-nums">
              -{formatBRL(data.totalExpense)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const ProjectionChart: React.FC = () => {
  const { monthlyProjections, projectionMonths, setProjectionMonths } = useFinance();

  const chartData = monthlyProjections.map((p) => ({
    monthLabel: p.monthLabel,
    shortLabel: p.shortLabel,
    endingBalance: p.endingBalance,
    totalIncome: p.totalIncome,
    totalExpense: p.totalExpense,
    lowestProjectedBalance: p.lowestProjectedBalance,
    hasNegativeBalance: p.hasNegativeBalance,
  }));

  const hasNegativeValues = chartData.some((d) => d.endingBalance < 0);

  return (
    <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
      {/* Header with Month switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-bold text-slate-900 tracking-tight">
              Quanto vai sobrar nos próximos meses
            </h3>
            <HelpTooltip
              title="Gráfico do Horizonte"
              text="Mostra o dinheiro previsto na sua conta no final de cada mês. Se a linha cair para baixo de zero, significa que vai faltar dinheiro."
            />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Acompanhe a linha do seu dinheiro para não ser pego de surpresa
          </p>
        </div>

        {/* 3 / 6 / 12 Months segmented control */}
        <div className="flex items-center bg-slate-100 p-1 rounded-2xl self-start sm:self-auto">
          {([3, 6, 12] as const).map((m) => (
            <button
              key={m}
              onClick={() => setProjectionMonths(m)}
              className={`min-h-[40px] px-3.5 py-1.5 text-xs font-bold rounded-xl transition-all ${
                projectionMonths === m
                  ? 'bg-white text-teal-800 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              {m} meses
            </button>
          ))}
        </div>
      </div>

      {/* Chart Canvas */}
      <div className="w-full h-64 sm:h-72 -ml-2 sm:ml-0">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData} margin={{ top: 12, right: 12, left: -10, bottom: 0 }}>
            <defs>
              <linearGradient id="balanceGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#0d9488" stopOpacity={0.25} />
                <stop offset="95%" stopColor="#0d9488" stopOpacity={0.0} />
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />

            <XAxis
              dataKey="shortLabel"
              tickLine={false}
              axisLine={{ stroke: '#e2e8f0' }}
              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
              dy={6}
            />

            <YAxis
              tickLine={false}
              axisLine={false}
              tickFormatter={(val) => formatShortBRL(val)}
              tick={{ fill: '#94a3b8', fontSize: 10 }}
              width={60}
            />

            <Tooltip content={<CustomTooltip />} />

            {hasNegativeValues && (
              <ReferenceLine
                y={0}
                stroke="#e11d48"
                strokeDasharray="4 4"
                label={{
                  value: 'R$ 0 (Limite)',
                  fill: '#e11d48',
                  fontSize: 10,
                  position: 'insideBottomRight',
                }}
              />
            )}

            <Area
              type="monotone"
              dataKey="endingBalance"
              stroke="#0f766e"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#balanceGradient)"
              isAnimationActive={true}
              animationDuration={600}
              activeDot={{ r: 6, fill: '#0f766e', stroke: '#ffffff', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Legend & instructions */}
      <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-teal-600 inline-block" />
          <span>Linha verde: quanto vai sobrar no fim do mês</span>
        </div>
        <span className="hidden sm:inline">Toque em qualquer mês para ver detalhes</span>
      </div>
    </div>
  );
};
