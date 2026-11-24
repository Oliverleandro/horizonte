import React, { useState } from 'react';
import {
  Sparkles,
  ArrowRight,
  TrendingUp,
  Target,
  CheckCircle2,
  X,
  Wallet,
  Home,
  ShoppingCart,
  Lightbulb,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { WizardSetupData } from '../../types/finance';
import { formatBRL } from '../../utils/formatters';
import { parseBRL } from '../../utils/money';

export const OnboardingModal: React.FC = () => {
  const {
    isOnboardingOpen,
    setIsOnboardingOpen,
    completeOnboarding,
    setupFromWizard,
    resetToSampleData,
  } = useFinance();

  const [mode, setMode] = useState<'intro' | 'wizard'>('intro');
  const [slide, setSlide] = useState(0);

  // Wizard answers
  const [balanceStr, setBalanceStr] = useState('1800');
  const [salaryStr, setSalaryStr] = useState('4200');
  const [salaryDay, setSalaryDay] = useState(5);

  const [bill1Desc, setBill1Desc] = useState('Aluguel / Condomínio');
  const [bill1Amount, setBill1Amount] = useState('1400');
  const [bill1Day, setBill1Day] = useState(10);

  const [bill2Desc, setBill2Desc] = useState('Supermercado');
  const [bill2Amount, setBill2Amount] = useState('1100');
  const [bill2Day, setBill2Day] = useState(8);

  const [bill3Desc, setBill3Desc] = useState('Luz e Internet');
  const [bill3Amount, setBill3Amount] = useState('280');
  const [bill3Day, setBill3Day] = useState(20);

  if (!isOnboardingOpen) return null;

  const slides = [
    {
      icon: TrendingUp,
      title: 'Veja o futuro do seu dinheiro',
      description:
        'A maioria dos apps só olha para o passado. O Horizonte projeta seu saldo dos próximos meses para você saber com antecedência se vai sobrar ou faltar.',
      color: 'bg-teal-50 text-teal-700',
    },
    {
      icon: Sparkles,
      title: 'Simule antes de passar o cartão',
      description:
        'Quer comprar um celular em 10x ou fazer uma viagem? No simulador "E se?" você vê na hora o impacto no seu saldo antes de assumir a dívida.',
      color: 'bg-indigo-50 text-indigo-700',
    },
    {
      icon: Target,
      title: 'Conquiste seus sonhos sem aperto',
      description:
        'Crie metas financeiras e descubra exatamente quanto guardar todo mês, com checagem automática se cabe na sua folga mensal.',
      color: 'bg-emerald-50 text-emerald-700',
    },
  ];

  const handleFinishWizard = (e: React.FormEvent) => {
    e.preventDefault();
    const data: WizardSetupData = {
      currentBalance: parseBRL(balanceStr),
      salary: parseBRL(salaryStr),
      salaryDay: salaryDay || 5,
      bills: [
        {
          description: bill1Desc,
          amount: parseBRL(bill1Amount),
          category: 'Moradia',
          dayOfMonth: bill1Day || 10,
        },
        {
          description: bill2Desc,
          amount: parseBRL(bill2Amount),
          category: 'Alimentação',
          dayOfMonth: bill2Day || 8,
        },
        {
          description: bill3Desc,
          amount: parseBRL(bill3Amount),
          category: 'Contas e Serviços',
          dayOfMonth: bill3Day || 20,
        },
      ],
    };

    setupFromWizard(data);
  };

  const handleUseSample = () => {
    resetToSampleData();
    completeOnboarding();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-in fade-in duration-200">
      <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 max-h-[92vh] flex flex-col overflow-hidden">
        {/* Top Header */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-600 flex items-center justify-center text-white font-bold text-xs">
              H
            </div>
            <span className="font-bold text-slate-900 text-sm">
              {mode === 'intro' ? 'Bem-vindo ao Horizonte' : 'Assistente de Início'}
            </span>
          </div>

          <button
            onClick={() => setIsOnboardingOpen(false)}
            className="min-h-[44px] min-w-[44px] -mr-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
            aria-label="Pular apresentação"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {mode === 'intro' ? (
            <div className="space-y-6 text-center">
              {/* Slide Icon */}
              <div className="flex justify-center">
                {(() => {
                  const CurrentIcon = slides[slide].icon;
                  return (
                    <div
                      className={`w-20 h-20 rounded-3xl ${slides[slide].color} flex items-center justify-center shadow-inner`}
                    >
                      <CurrentIcon size={40} className="stroke-[2]" />
                    </div>
                  );
                })()}
              </div>

              <div>
                <h3 className="text-xl font-bold text-slate-900 tracking-tight">
                  {slides[slide].title}
                </h3>
                <p className="text-sm text-slate-500 mt-2 max-w-sm mx-auto leading-relaxed">
                  {slides[slide].description}
                </p>
              </div>

              {/* Dots */}
              <div className="flex items-center justify-center gap-2 pt-2">
                {slides.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlide(i)}
                    className={`h-2 rounded-full transition-all ${
                      slide === i ? 'w-8 bg-teal-600' : 'w-2 bg-slate-200'
                    }`}
                    aria-label={`Ir para passo ${i + 1}`}
                  />
                ))}
              </div>

              {/* Slide Navigation Buttons */}
              <div className="space-y-2.5 pt-4">
                {slide < slides.length - 1 ? (
                  <button
                    onClick={() => setSlide(slide + 1)}
                    className="w-full min-h-[48px] py-3.5 px-6 rounded-2xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <span>Próximo</span>
                    <ArrowRight size={16} />
                  </button>
                ) : (
                  <button
                    onClick={() => setMode('wizard')}
                    className="w-full min-h-[48px] py-3.5 px-6 rounded-2xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                  >
                    <Sparkles size={16} />
                    <span>Configurar Minhas Finanças (2 min)</span>
                  </button>
                )}

                {import.meta.env.DEV && (
                  <button
                    onClick={handleUseSample}
                    className="w-full min-h-[44px] py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors"
                  >
                    Modo de Testes: Usar dados de exemplo pré-carregados
                  </button>
                )}
              </div>
            </div>
          ) : (
            /* WIZARD FORM */
            <form onSubmit={handleFinishWizard} className="space-y-5">
              <div>
                <h3 className="text-base font-bold text-slate-900">
                  Vamos montar sua primeira projeção!
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Responda 3 perguntas simples para ver seu saldo dos próximos meses:
                </p>
              </div>

              {/* Question 1: Saldo Hoje */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <Wallet size={16} className="text-teal-600" />
                  <span>1. Quanto você tem na conta bancária hoje?</span>
                </div>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">
                    R$
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    required
                    value={balanceStr}
                    onChange={(e) => setBalanceStr(e.target.value)}
                    placeholder="1800,00"
                    className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-base font-bold text-slate-900 tabular-nums focus:outline-none focus:border-teal-500"
                  />
                </div>
              </div>

              {/* Question 2: Salário & Dia */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <TrendingUp size={16} className="text-emerald-600" />
                  <span>2. Quanto você ganha por mês e que dia cai?</span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                      R$
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      required
                      value={salaryStr}
                      onChange={(e) => setSalaryStr(e.target.value)}
                      placeholder="4200,00"
                      className="w-full pl-9 pr-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-900 tabular-nums focus:outline-none focus:border-teal-500"
                    />
                  </div>
                  <div>
                    <select
                      value={salaryDay}
                      onChange={(e) => setSalaryDay(Number(e.target.value))}
                      className="w-full px-3 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
                    >
                      {[1, 5, 10, 15, 20, 25, 30].map((d) => (
                        <option key={d} value={d}>
                          Cai no dia {d}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Question 3: 3 Contas Fixas */}
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-700">
                  <CheckCircle2 size={16} className="text-rose-600" />
                  <span>3. Três contas principais que você paga todo mês:</span>
                </div>

                {/* Bill 1 */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
                    <Home size={15} />
                  </div>
                  <input
                    type="text"
                    value={bill1Desc}
                    onChange={(e) => setBill1Desc(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    placeholder="Aluguel / Casa"
                  />
                  <div className="w-28 relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                      R$
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={bill1Amount}
                      onChange={(e) => setBill1Amount(e.target.value)}
                      placeholder="1400"
                      className="w-full pl-7 pr-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 tabular-nums"
                    />
                  </div>
                </div>

                {/* Bill 2 */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-orange-50 text-orange-700 flex items-center justify-center shrink-0">
                    <ShoppingCart size={15} />
                  </div>
                  <input
                    type="text"
                    value={bill2Desc}
                    onChange={(e) => setBill2Desc(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    placeholder="Supermercado"
                  />
                  <div className="w-28 relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                      R$
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={bill2Amount}
                      onChange={(e) => setBill2Amount(e.target.value)}
                      placeholder="1100"
                      className="w-full pl-7 pr-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 tabular-nums"
                    />
                  </div>
                </div>

                {/* Bill 3 */}
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-yellow-50 text-yellow-700 flex items-center justify-center shrink-0">
                    <Lightbulb size={15} />
                  </div>
                  <input
                    type="text"
                    value={bill3Desc}
                    onChange={(e) => setBill3Desc(e.target.value)}
                    className="flex-1 px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                    placeholder="Luz / Internet"
                  />
                  <div className="w-28 relative">
                    <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[11px] font-bold text-slate-400">
                      R$
                    </span>
                    <input
                      type="text"
                      inputMode="decimal"
                      value={bill3Amount}
                      onChange={(e) => setBill3Amount(e.target.value)}
                      placeholder="280"
                      className="w-full pl-7 pr-2 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-800 tabular-nums"
                    />
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 space-y-2">
                <button
                  type="submit"
                  className="w-full min-h-[48px] py-3.5 px-6 rounded-2xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
                >
                  <Sparkles size={16} />
                  <span>Gerar Minha Projeção Futura!</span>
                </button>

                <button
                  type="button"
                  onClick={() => setMode('intro')}
                  className="w-full min-h-[44px] py-2 text-xs font-semibold text-slate-500 hover:text-slate-700"
                >
                  Voltar para a apresentação
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
