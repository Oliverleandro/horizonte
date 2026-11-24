import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  Sparkles,
  ShoppingBag,
  PiggyBank,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  PlusCircle,
  RotateCcw,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { SimulationConfig } from '../../types/finance';
import { calculateSimulation } from '../../utils/projections';
import { formatBRL, formatShortBRL } from '../../utils/formatters';
import { parseBRL, divideMoney } from '../../utils/money';
import { HelpTooltip } from '../common/HelpTooltip';

interface SimulationTooltipProps {
  active?: boolean;
  payload?: Array<{
    name: string;
    value: number;
    color: string;
  }>;
  label?: string;
}

const SimulationTooltip: React.FC<SimulationTooltipProps> = ({
  active,
  payload,
  label,
}) => {
  if (active && payload && payload.length) {
    const original = payload.find((p) => p.name === 'Saldo Atual');
    const simulated = payload.find((p) => p.name === 'Com a Simulação');

    const diff =
      original && simulated ? simulated.value - original.value : 0;

    return (
      <div className="bg-slate-900 text-white p-3.5 rounded-2xl shadow-xl border border-slate-800 text-xs min-w-[210px] animate-in fade-in duration-150">
        <p className="font-bold text-slate-200 border-b border-slate-800 pb-1.5 mb-2">
          {label}
        </p>
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <span className="text-teal-400 font-medium">Saldo Atual:</span>
            <span className="font-bold tabular-nums">
              {formatBRL(original ? original.value : 0)}
            </span>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-indigo-300 font-medium">Com a Simulação:</span>
            <span
              className={`font-bold tabular-nums ${
                simulated && simulated.value < 0
                  ? 'text-rose-400'
                  : 'text-indigo-200'
              }`}
            >
              {formatBRL(simulated ? simulated.value : 0)}
            </span>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-slate-800 text-[11px]">
            <span className="text-slate-400">Diferença no mês:</span>
            <span
              className={`font-bold tabular-nums ${
                diff >= 0 ? 'text-emerald-400' : 'text-rose-300'
              }`}
            >
              {diff >= 0 ? `+${formatBRL(diff)}` : formatBRL(diff)}
            </span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const SimulatorTab: React.FC = () => {
  const { currentBalance, transactions, addTransaction, projectionMonths, setActiveTab } =
    useFinance();

  // Simulation state
  const [simType, setSimType] = useState<'purchase' | 'saving' | 'extra_income'>(
    'purchase'
  );
  const [simName, setSimName] = useState('Novo Smartphone');
  const [amountStr, setAmountStr] = useState('2500');
  const [installments, setInstallments] = useState(10);
  const [startMonthOffset, setStartMonthOffset] = useState(0);

  const [savedSuccess, setSavedSuccess] = useState(false);

  const amount = parseBRL(amountStr);

  const simConfig: SimulationConfig = useMemo(() => {
    return {
      type: simType,
      name: simName.trim() || 'Simulação',
      amount,
      installments: simType === 'purchase' ? installments : 1,
      isMonthly: simType === 'saving' || simType === 'extra_income',
      startMonthOffset,
    };
  }, [simType, simName, amount, installments, startMonthOffset]);

  const simulationResult = useMemo(() => {
    return calculateSimulation(
      currentBalance,
      transactions,
      simConfig,
      projectionMonths
    );
  }, [currentBalance, transactions, simConfig, projectionMonths]);

  const applyPreset = (
    type: 'purchase' | 'saving' | 'extra_income',
    name: string,
    val: number,
    inst: number = 1
  ) => {
    setSimType(type);
    setSimName(name);
    setAmountStr(val.toString());
    setInstallments(inst);
    setSavedSuccess(false);
  };

  const handleSaveToReal = () => {
    if (amount <= 0) return;

    if (simType === 'purchase') {
      const today = new Date();
      const targetMonth = today.getMonth() + startMonthOffset;
      const targetYear = today.getFullYear();
      const startDate = new Date(targetYear, targetMonth, 15)
        .toISOString()
        .slice(0, 10);

      if (installments > 1) {
        addTransaction({
          description: simName.trim() || 'Compra Parcelada',
          amount,
          type: 'expense',
          category: 'Cartão e Parcelas',
          recurrence: 'installment',
          startDate,
          dayOfMonth: 15,
          totalInstallments: installments,
          installmentAmount: divideMoney(amount, installments),
          currentInstallment: 1,
        });
      } else {
        addTransaction({
          description: simName.trim() || 'Compra à Vista',
          amount,
          type: 'expense',
          category: 'Outros Gastos',
          recurrence: 'once',
          startDate,
          dayOfMonth: 15,
        });
      }
    } else if (simType === 'saving') {
      const today = new Date();
      const startDate = new Date(today.getFullYear(), today.getMonth() + startMonthOffset, 1)
        .toISOString()
        .slice(0, 10);

      addTransaction({
        description: `Economia: ${simName.trim() || 'Reserva'}`,
        amount,
        type: 'income',
        category: 'Investimentos',
        recurrence: 'monthly',
        startDate,
        dayOfMonth: 1,
      });
    }

    setSavedSuccess(true);
    setTimeout(() => {
      setActiveTab('lancamentos');
    }, 1200);
  };

  const origLowest = simulationResult.baseline.lowestBalance.amount;
  const simLowest = simulationResult.simulated.lowestBalance.amount;
  const willGoNegative = simLowest < 0;
  const wasAlreadyNegative = origLowest < 0;

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-150">
      {/* Title */}
      <div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
            <Sparkles size={18} />
          </div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Simulador "E se?"
            </h2>
            <HelpTooltip
              title="Simulador E se?"
              text="Aqui você testa qualquer compra ou economia sem salvar de verdade. É perfeito para saber se uma compra parcelada cabe no seu bolso!"
            />
          </div>
        </div>
        <p className="text-xs text-slate-500 mt-0.5">
          Veja o impacto de uma nova compra ou economia antes de gastar de verdade
        </p>
      </div>

      {/* Quick Presets with min height 44px */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => applyPreset('purchase', 'Troca de Celular', 2400, 10)}
          className="min-h-[44px] px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-bold text-slate-700 whitespace-nowrap flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
        >
          <ShoppingBag size={14} className="text-indigo-600" />
          <span>Celular (10x R$ 240)</span>
        </button>

        <button
          onClick={() => applyPreset('purchase', 'Notebook Novo', 3600, 12)}
          className="min-h-[44px] px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-bold text-slate-700 whitespace-nowrap flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
        >
          <ShoppingBag size={14} className="text-indigo-600" />
          <span>Notebook (12x R$ 300)</span>
        </button>

        <button
          onClick={() => applyPreset('saving', 'Corte de Delivery & Assinaturas', 300, 1)}
          className="min-h-[44px] px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-bold text-slate-700 whitespace-nowrap flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
        >
          <PiggyBank size={14} className="text-emerald-600" />
          <span>Economizar R$ 300/mês</span>
        </button>

        <button
          onClick={() => applyPreset('purchase', 'Viagem de Férias', 3000, 6)}
          className="min-h-[44px] px-3.5 py-2 bg-white border border-slate-200 hover:border-slate-300 rounded-2xl text-xs font-bold text-slate-700 whitespace-nowrap flex items-center gap-1.5 shadow-2xs transition-colors shrink-0"
        >
          <TrendingUp size={14} className="text-amber-600" />
          <span>Viagem (6x R$ 500)</span>
        </button>
      </div>

      {/* Simulator Controls Card */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm space-y-4">
        {/* Mode Tabs */}
        <div>
          <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
            O que você quer simular?
          </label>
          <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
            <button
              onClick={() => {
                setSimType('purchase');
                if (simName === 'Economia Mensal') setSimName('Nova Compra');
              }}
              className={`min-h-[48px] py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                simType === 'purchase'
                  ? 'bg-white text-indigo-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Comprar Parcelado ou à Vista
            </button>
            <button
              onClick={() => {
                setSimType('saving');
                if (simName === 'Novo Smartphone' || simName === 'Nova Compra')
                  setSimName('Economia Mensal');
              }}
              className={`min-h-[48px] py-2.5 text-xs sm:text-sm font-bold rounded-xl transition-all ${
                simType === 'saving'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-800'
              }`}
            >
              Economizar Todo Mês
            </button>
          </div>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="sm:col-span-1">
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Nome da Simulação
            </label>
            <input
              type="text"
              value={simName}
              onChange={(e) => setSimName(e.target.value)}
              placeholder="Ex: Celular, Curso, TV..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              {simType === 'purchase' ? 'Valor Total da Compra (R$)' : 'Economia Todo Mês (R$)'}
            </label>
            <div className="relative">
              <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                R$
              </span>
              <input
                type="text"
                inputMode="decimal"
                value={amountStr}
                onChange={(e) => setAmountStr(e.target.value)}
                placeholder="0,00"
                className="w-full pl-9 pr-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-extrabold text-slate-900 tabular-nums focus:bg-white focus:outline-none focus:border-indigo-500"
              />
            </div>
          </div>

          {simType === 'purchase' && (
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Número de Parcelas
              </label>
              <select
                value={installments}
                onChange={(e) => setInstallments(Number(e.target.value))}
                className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-bold text-slate-800 focus:bg-white focus:outline-none focus:border-indigo-500"
              >
                <option value={1}>1x à vista ({formatBRL(amount)})</option>
                {[2, 3, 4, 5, 6, 8, 10, 12, 18, 24].map((n) => (
                  <option key={n} value={n}>
                    {n}x de {formatBRL(amount / n)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Start Month */}
        <div className="flex items-center gap-4 text-xs text-slate-600 pt-1">
          <span className="font-bold">Começa em:</span>
          <label className="inline-flex items-center gap-2 cursor-pointer font-medium">
            <input
              type="radio"
              name="startOffset"
              checked={startMonthOffset === 0}
              onChange={() => setStartMonthOffset(0)}
              className="text-indigo-600 focus:ring-indigo-500"
            />
            <span>Neste mês</span>
          </label>
          <label className="inline-flex items-center gap-2 cursor-pointer font-medium">
            <input
              type="radio"
              name="startOffset"
              checked={startMonthOffset === 1}
              onChange={() => setStartMonthOffset(1)}
              className="text-indigo-600 focus:ring-indigo-500"
            />
            <span>No mês que vem</span>
          </label>
        </div>
      </div>

      {/* Real-time Diagnosis Alert Card */}
      {amount > 0 && (
        <div
          className={`p-5 rounded-3xl border transition-all ${
            willGoNegative && !wasAlreadyNegative
              ? 'bg-rose-50 border-rose-300 text-rose-950'
              : simType === 'saving'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-indigo-50/90 border-indigo-300 text-indigo-950'
          }`}
        >
          <div className="flex items-start gap-3.5">
            <div
              className={`w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 text-white shadow-xs ${
                willGoNegative && !wasAlreadyNegative
                  ? 'bg-rose-600'
                  : simType === 'saving'
                  ? 'bg-emerald-600'
                  : 'bg-indigo-600'
              }`}
            >
              {willGoNegative && !wasAlreadyNegative ? (
                <AlertTriangle size={22} className="stroke-[2.2]" />
              ) : (
                <CheckCircle size={22} className="stroke-[2.2]" />
              )}
            </div>

            <div className="flex-1">
              <h4 className="text-sm sm:text-base font-extrabold leading-snug">
                {willGoNegative && !wasAlreadyNegative
                  ? 'Atenção: Essa compra fará sua conta ficar no vermelho!'
                  : simType === 'saving'
                  ? 'Excelente impacto! Sua sobra vai aumentar todo mês.'
                  : 'Pode comprar tranquilo! Você continuará no azul.'}
              </h4>

              <p className="text-xs mt-1.5 leading-relaxed opacity-90">
                {willGoNegative && !wasAlreadyNegative ? (
                  <>
                    Com essa despesa de{' '}
                    <strong>
                      {installments > 1
                        ? `${installments}x de ${formatBRL(amount / installments)}`
                        : formatBRL(amount)}
                    </strong>
                    , o saldo previsto cairá para{' '}
                    <strong className="text-rose-700 underline font-bold">
                      {formatBRL(simLowest)}
                    </strong>
                    . Considere parcelar em mais vezes ou juntar o dinheiro antes.
                  </>
                ) : simType === 'saving' ? (
                  <>
                    Guardando{' '}
                    <strong>{formatBRL(amount)} todo mês</strong>, em{' '}
                    {projectionMonths} meses você terá acumulado{' '}
                    <strong className="font-extrabold tabular-nums">
                      {formatBRL(amount * projectionMonths)}
                    </strong>{' '}
                    a mais!
                  </>
                ) : (
                  <>
                    Mesmo pagando{' '}
                    <strong>{formatBRL(amount / installments)} por mês</strong>, o
                    seu menor saldo no período ainda será de{' '}
                    <strong className="font-extrabold tabular-nums">
                      {formatBRL(simLowest)}
                    </strong>
                    .
                  </>
                )}
              </p>

              {/* Action Buttons with min height 48px */}
              <div className="mt-4 pt-3 border-t border-black/10 flex flex-wrap items-center gap-2">
                <button
                  onClick={handleSaveToReal}
                  disabled={savedSuccess}
                  className="min-h-[48px] px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl text-xs sm:text-sm font-bold inline-flex items-center gap-2 shadow-sm transition-all active:scale-95"
                >
                  <PlusCircle size={17} />
                  <span>
                    {savedSuccess
                      ? 'Lançamento salvo com sucesso!'
                      : 'Gostei! Salvar nos meus lançamentos'}
                  </span>
                </button>

                <button
                  onClick={() => {
                    setAmountStr('0');
                    setSimName('');
                  }}
                  className="min-h-[48px] px-4 py-2.5 text-slate-500 hover:text-slate-800 rounded-2xl text-xs font-semibold transition-colors flex items-center gap-1.5"
                >
                  <RotateCcw size={15} />
                  <span>Limpar simulação</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comparison Chart */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-sm">
        <div className="mb-4">
          <div className="flex items-center gap-1.5">
            <h3 className="text-base font-bold text-slate-900">
              Comparação no Gráfico: Antes vs. Depois
            </h3>
            <HelpTooltip
              title="Comparação Visual"
              text="A linha verde mostra seu saldo atual. A linha roxa mostra como o saldo vai ficar caso você faça essa compra ou economia."
            />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Linha verde = sem a compra · Linha roxa = com a simulação
          </p>
        </div>

        <div className="w-full h-64 sm:h-72 -ml-2 sm:ml-0">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={simulationResult.chartData}
              margin={{ top: 10, right: 10, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
              <XAxis
                dataKey="shortLabel"
                tickLine={false}
                axisLine={{ stroke: '#e2e8f0' }}
                tick={{ fill: '#64748b', fontSize: 11, fontWeight: 600 }}
              />
              <YAxis
                tickLine={false}
                axisLine={false}
                tickFormatter={(val) => formatShortBRL(val)}
                tick={{ fill: '#94a3b8', fontSize: 10 }}
                width={60}
              />
              <Tooltip content={<SimulationTooltip />} />
              <Legend
                wrapperStyle={{ fontSize: '11px', paddingTop: '10px', fontWeight: 600 }}
                iconType="circle"
              />

              <ReferenceLine
                y={0}
                stroke="#f43f5e"
                strokeDasharray="3 3"
                label={{
                  value: 'R$ 0',
                  fill: '#f43f5e',
                  fontSize: 10,
                  position: 'insideBottomRight',
                }}
              />

              <Line
                type="monotone"
                dataKey="saldoAtual"
                name="Saldo Atual"
                stroke="#0f766e"
                strokeWidth={2.5}
                isAnimationActive={true}
                animationDuration={500}
                dot={{ r: 4, fill: '#0f766e' }}
                activeDot={{ r: 6 }}
              />

              <Line
                type="monotone"
                dataKey="saldoSimulado"
                name="Com a Simulação"
                stroke="#6366f1"
                strokeWidth={3}
                strokeDasharray={amount > 0 ? undefined : '4 4'}
                isAnimationActive={true}
                animationDuration={500}
                dot={{ r: 4, fill: '#6366f1' }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <span className="font-medium">
            Simulação 100% segura — nada é salvo sem você confirmar
          </span>
        </div>
      </div>
    </div>
  );
};
