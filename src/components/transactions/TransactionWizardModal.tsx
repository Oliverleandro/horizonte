import React, { useState, useEffect } from 'react';
import {
  X,
  ArrowLeft,
  ArrowRight,
  Check,
  Home,
  ShoppingCart,
  Car,
  Lightbulb,
  CreditCard,
  Film,
  HeartPulse,
  GraduationCap,
  Briefcase,
  Layers,
  Repeat,
  Calendar as CalendarIcon,
  Sparkles,
} from 'lucide-react';
import {
  Transaction,
  TransactionType,
  RecurrenceType,
  Category,
} from '../../types/finance';
import { formatBRL } from '../../utils/formatters';
import { parseBRL, divideMoney } from '../../utils/money';

interface TransactionWizardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (txData: Omit<Transaction, 'id'>, editId?: string) => void;
  editingTransaction?: Transaction | null;
}

const CATEGORY_ITEMS: Array<{
  category: Category;
  label: string;
  icon: React.ElementType;
  types: ('income' | 'expense')[];
  color: string;
}> = [
  { category: 'Salário', label: 'Salário', icon: Briefcase, types: ['income'], color: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { category: 'Freelance', label: 'Bico / Freela', icon: Sparkles, types: ['income'], color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { category: 'Investimentos', label: 'Rendimentos', icon: Layers, types: ['income'], color: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  { category: 'Outras Receitas', label: 'Outra Entrada', icon: Briefcase, types: ['income'], color: 'bg-slate-100 text-slate-700 border-slate-200' },

  { category: 'Moradia', label: 'Casa & Aluguel', icon: Home, types: ['expense'], color: 'bg-amber-50 text-amber-700 border-amber-200' },
  { category: 'Alimentação', label: 'Comida & Mercado', icon: ShoppingCart, types: ['expense'], color: 'bg-orange-50 text-orange-700 border-orange-200' },
  { category: 'Transporte', label: 'Transporte & Carro', icon: Car, types: ['expense'], color: 'bg-blue-50 text-blue-700 border-blue-200' },
  { category: 'Contas e Serviços', label: 'Luz, Água & Net', icon: Lightbulb, types: ['expense'], color: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
  { category: 'Cartão e Parcelas', label: 'Cartão & Parcelas', icon: CreditCard, types: ['expense'], color: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  { category: 'Lazer e Assinaturas', label: 'Lazer & Streaming', icon: Film, types: ['expense'], color: 'bg-purple-50 text-purple-700 border-purple-200' },
  { category: 'Saúde', label: 'Saúde & Farmácia', icon: HeartPulse, types: ['expense'], color: 'bg-rose-50 text-rose-700 border-rose-200' },
  { category: 'Educação', label: 'Educação & Cursos', icon: GraduationCap, types: ['expense'], color: 'bg-teal-50 text-teal-700 border-teal-200' },
  { category: 'Outros Gastos', label: 'Outros Gastos', icon: Layers, types: ['expense'], color: 'bg-slate-100 text-slate-700 border-slate-200' },
];

export const TransactionWizardModal: React.FC<TransactionWizardModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTransaction,
}) => {
  const [step, setStep] = useState<number>(1);
  const totalSteps = 5;

  // Form states
  const [type, setType] = useState<TransactionType>('expense');
  const [amountStr, setAmountStr] = useState<string>('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('Alimentação');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('monthly');
  const [installments, setInstallments] = useState<number>(3);
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [dayOfMonth, setDayOfMonth] = useState<number>(new Date().getDate());

  // Reset or fill on open
  useEffect(() => {
    if (editingTransaction) {
      setType(editingTransaction.type);
      setAmountStr(
        editingTransaction.amount.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        })
      );
      setDescription(editingTransaction.description);
      setCategory(editingTransaction.category);
      setRecurrence(editingTransaction.recurrence);
      setStartDate(editingTransaction.startDate);
      setDayOfMonth(editingTransaction.dayOfMonth || 5);
      if (editingTransaction.totalInstallments) {
        setInstallments(editingTransaction.totalInstallments);
      }
      setStep(1);
    } else if (isOpen) {
      setType('expense');
      setAmountStr('');
      setDescription('');
      setCategory('Alimentação');
      setRecurrence('monthly');
      setInstallments(3);
      const today = new Date();
      setStartDate(today.toISOString().slice(0, 10));
      setDayOfMonth(today.getDate());
      setStep(1);
    }
  }, [editingTransaction, isOpen]);

  if (!isOpen) return null;

  const currentAmount = parseBRL(amountStr);

  const addQuickValue = (addVal: number) => {
    const nextVal = (currentAmount || 0) + addVal;
    setAmountStr(
      nextVal.toLocaleString('pt-BR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      })
    );
  };

  const handleClear = () => {
    setAmountStr('');
  };

  // Step advancement validation
  const canGoNext = () => {
    if (step === 1) return currentAmount > 0;
    if (step === 2) return description.trim().length > 0;
    if (step === 3) return true;
    if (step === 4) return true;
    if (step === 5) return true;
    return false;
  };

  const handleNext = () => {
    if (step < totalSteps) {
      setStep(step + 1);
    } else {
      handleFinalSubmit();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      onClose();
    }
  };

  const handleFinalSubmit = () => {
    if (currentAmount <= 0 || !description.trim()) return;

    let installmentAmount: number | undefined;
    if (recurrence === 'installment') {
      installmentAmount = divideMoney(currentAmount, installments);
    }

    const txData: Omit<Transaction, 'id'> = {
      description: description.trim(),
      amount: currentAmount,
      type,
      category,
      recurrence,
      startDate,
      dayOfMonth: recurrence === 'monthly' ? dayOfMonth : undefined,
      totalInstallments: recurrence === 'installment' ? installments : undefined,
      installmentAmount,
      currentInstallment: 1,
    };

    onSave(txData, editingTransaction ? editingTransaction.id : undefined);
    onClose();
  };

  // Suggestions for Step 2
  const suggestions =
    type === 'income'
      ? ['Salário', 'Freelance / Bico', 'Venda', 'Pix recebido', 'Aluguel recebido']
      : ['Supermercado', 'Aluguel', 'Conta de Luz', 'Internet', 'Combustível', 'Farmácia', 'Netflix', 'Celular novo'];

  // Categories filtered for current type
  const availableCategories = CATEGORY_ITEMS.filter((item) =>
    item.types.includes(type)
  );

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-lg bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 max-h-[95vh] flex flex-col overflow-hidden">
        {/* Top Header with Progress Bar */}
        <div className="px-6 pt-5 pb-3 border-b border-slate-100 bg-white shrink-0">
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={handleBack}
              className="min-h-[44px] min-w-[44px] -ml-2 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-slate-100 flex items-center justify-center transition-colors"
              aria-label="Voltar"
            >
              <ArrowLeft size={20} />
            </button>

            <div className="text-center">
              <span className="text-[11px] font-bold text-teal-700 uppercase tracking-wider block">
                Passo {step} de {totalSteps}
              </span>
              <h2 className="text-sm font-bold text-slate-900">
                {step === 1 && 'Qual o valor?'}
                {step === 2 && 'O que é isso?'}
                {step === 3 && 'Escolha a categoria'}
                {step === 4 && 'Com que frequência?'}
                {step === 5 && 'Qual o dia?'}
              </h2>
            </div>

            <button
              onClick={onClose}
              className="min-h-[44px] min-w-[44px] -mr-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-100 flex items-center justify-center transition-colors"
              aria-label="Fechar"
            >
              <X size={20} />
            </button>
          </div>

          {/* Progress bar line */}
          <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-teal-600 transition-all duration-300 rounded-full"
              style={{ width: `${(step / totalSteps) * 100}%` }}
            />
          </div>
        </div>

        {/* Step Content Body */}
        <div className="p-5 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* STEP 1: Type & Value (Direct Keyboard Input - Computer & Mobile) */}
          {step === 1 && (
            <div className="space-y-5 animate-in fade-in duration-200">
              {/* Type Switcher: "Entrou" vs "Saiu" */}
              <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setType('expense');
                    if (category === 'Salário' || category === 'Freelance') {
                      setCategory('Alimentação');
                    }
                  }}
                  className={`min-h-[48px] py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    type === 'expense'
                      ? 'bg-white text-rose-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
                  <span>Saiu (Gasto)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setType('income');
                    setCategory('Salário');
                  }}
                  className={`min-h-[48px] py-2.5 rounded-xl text-xs sm:text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                    type === 'income'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                  <span>Entrou (Ganho)</span>
                </button>
              </div>

              {/* Direct Keyboard Input Card */}
              <div className="bg-slate-50 border border-slate-200/90 rounded-3xl p-6 sm:p-8 text-center focus-within:border-teal-500 focus-within:bg-teal-50/15 focus-within:ring-2 focus-within:ring-teal-500/10 transition-all">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-wider block mb-4">
                  Digite quanto {type === 'income' ? 'entrou (ganho)' : 'saiu (gasto)'}:
                </label>

                <div className="flex items-center justify-center gap-2 max-w-sm mx-auto">
                  <span
                    className={`text-2xl sm:text-4xl font-extrabold select-none transition-colors ${
                      currentAmount > 0
                        ? type === 'income'
                          ? 'text-emerald-600'
                          : 'text-slate-900'
                        : 'text-slate-400'
                    }`}
                  >
                    R$
                  </span>
                  <input
                    type="text"
                    inputMode="decimal"
                    autoFocus
                    value={amountStr}
                    onChange={(e) => setAmountStr(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && currentAmount > 0) {
                        e.preventDefault();
                        handleNext();
                      }
                    }}
                    placeholder="0,00"
                    className={`w-full max-w-[220px] sm:max-w-[280px] text-left text-3xl sm:text-5xl font-extrabold bg-transparent outline-none tabular-nums tracking-tight transition-colors placeholder:text-slate-300 ${
                      currentAmount > 0
                        ? type === 'income'
                          ? 'text-emerald-600'
                          : 'text-slate-900'
                        : 'text-slate-400'
                    }`}
                  />
                </div>

                {/* Subtitle / feedback */}
                <p className="text-xs text-slate-400 mt-3.5">
                  {currentAmount > 0 ? (
                    <span className="text-teal-700 font-semibold">
                      Valor formatado: {formatBRL(currentAmount)}
                    </span>
                  ) : (
                    'Digite diretamente pelo teclado físico ou pelo teclado do seu celular'
                  )}
                </p>

                {/* Quick Add Suggestions */}
                <div className="flex items-center justify-center gap-2 mt-5 flex-wrap">
                  {[20, 50, 100, 500, 1000].map((v) => (
                    <button
                      key={v}
                      type="button"
                      onClick={() => addQuickValue(v)}
                      className="min-h-[40px] px-3.5 py-1.5 bg-white border border-slate-200 hover:border-teal-400 hover:bg-teal-50 text-slate-700 font-bold rounded-xl text-xs transition-colors shadow-2xs active:scale-95"
                    >
                      +R${v}
                    </button>
                  ))}
                  {currentAmount > 0 && (
                    <button
                      type="button"
                      onClick={handleClear}
                      className="min-h-[40px] px-3.5 py-1.5 text-rose-600 hover:bg-rose-50 font-bold rounded-xl text-xs transition-colors active:scale-95"
                    >
                      Limpar
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* STEP 2: Description */}
          {step === 2 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
                  Dê um nome fácil de lembrar:
                </label>
                <input
                  type="text"
                  autoFocus
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && description.trim().length > 0) {
                      e.preventDefault();
                      handleNext();
                    }
                  }}
                  placeholder="Ex: Supermercado, Aluguel, Celular novo..."
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-base font-semibold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>

              {/* Suggestions */}
              <div>
                <span className="text-xs text-slate-400 block mb-2">
                  Sugestões rápidas (toque para escolher):
                </span>
                <div className="flex flex-wrap gap-2">
                  {suggestions.map((sug) => (
                    <button
                      key={sug}
                      type="button"
                      onClick={() => setDescription(sug)}
                      className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-medium border transition-all ${
                        description === sug
                          ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      {sug}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: Category with Big Cards */}
          {step === 3 && (
            <div className="space-y-3 animate-in fade-in duration-200">
              <span className="text-xs text-slate-500 block">
                Selecione o tipo do gasto ou ganho:
              </span>

              <div className="grid grid-cols-2 gap-2.5 max-h-[360px] overflow-y-auto pr-1">
                {availableCategories.map((item) => {
                  const Icon = item.icon;
                  const isSelected = category === item.category;

                  return (
                    <button
                      key={item.category}
                      type="button"
                      onClick={() => setCategory(item.category)}
                      className={`min-h-[58px] p-3 rounded-2xl border text-left transition-all flex items-center gap-3 ${
                        isSelected
                          ? 'border-teal-600 bg-teal-50/80 shadow-xs ring-2 ring-teal-600/20'
                          : 'border-slate-200 hover:border-slate-300 bg-white'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${item.color}`}
                      >
                        <Icon size={20} />
                      </div>
                      <div className="min-w-0">
                        <span className="text-xs font-bold text-slate-800 block truncate">
                          {item.label}
                        </span>
                        <span className="text-[10px] text-slate-400 block">
                          {item.category}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* STEP 4: Frequency (Todo mês, Parcelado, Só uma vez) */}
          {step === 4 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <span className="text-xs text-slate-500 block">
                Escolha como isso acontece no tempo:
              </span>

              <div className="space-y-2.5">
                {/* 1. Todo mês */}
                <button
                  type="button"
                  onClick={() => setRecurrence('monthly')}
                  className={`w-full min-h-[64px] p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 ${
                    recurrence === 'monthly'
                      ? 'border-teal-600 bg-teal-50/80 shadow-xs ring-2 ring-teal-600/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-11 h-11 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shrink-0">
                    <Repeat size={22} />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-bold text-slate-900 block">
                      Todo mês (Fixo)
                    </span>
                    <span className="text-xs text-slate-500">
                      Repete todo mês, como aluguel, conta de luz ou salário.
                    </span>
                  </div>
                </button>

                {/* 2. Parcelado */}
                {type === 'expense' && (
                  <button
                    type="button"
                    onClick={() => setRecurrence('installment')}
                    className={`w-full min-h-[64px] p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 ${
                      recurrence === 'installment'
                        ? 'border-indigo-600 bg-indigo-50/80 shadow-xs ring-2 ring-indigo-600/20'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="w-11 h-11 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
                      <Layers size={22} />
                    </div>
                    <div className="flex-1">
                      <span className="text-sm font-bold text-slate-900 block">
                        Parcelado no cartão
                      </span>
                      <span className="text-xs text-slate-500">
                        Uma compra dividida em várias parcelas que você paga mês a mês.
                      </span>
                    </div>
                  </button>
                )}

                {/* Installment Selector if active */}
                {recurrence === 'installment' && (
                  <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3">
                    <span className="text-xs font-semibold text-indigo-900 block">
                      Em quantas vezes você dividiu?
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {[2, 3, 4, 5, 6, 8, 10, 12, 18, 24].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setInstallments(n)}
                          className={`min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                            installments === n
                              ? 'bg-indigo-600 text-white shadow-xs'
                              : 'bg-white text-indigo-800 border border-indigo-200 hover:border-indigo-300'
                          }`}
                        >
                          {n}x
                        </button>
                      ))}
                    </div>

                    <div className="p-3 bg-white rounded-xl border border-indigo-100 text-xs text-indigo-950 flex items-center justify-between">
                      <span>Cálculo automático:</span>
                      <span className="font-bold tabular-nums">
                        {installments}x de {formatBRL(currentAmount / installments)}
                      </span>
                    </div>
                  </div>
                )}

                {/* 3. Só uma vez */}
                <button
                  type="button"
                  onClick={() => setRecurrence('once')}
                  className={`w-full min-h-[64px] p-4 rounded-2xl border text-left transition-all flex items-center gap-3.5 ${
                    recurrence === 'once'
                      ? 'border-teal-600 bg-teal-50/80 shadow-xs ring-2 ring-teal-600/20'
                      : 'border-slate-200 hover:border-slate-300 bg-white'
                  }`}
                >
                  <div className="w-11 h-11 rounded-2xl bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                    <CalendarIcon size={22} />
                  </div>
                  <div className="flex-1">
                    <span className="text-sm font-bold text-slate-900 block">
                      Só uma vez
                    </span>
                    <span className="text-xs text-slate-500">
                      Gasto pontual ou dinheiro extra que só acontece nesta data.
                    </span>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 5: Date and Confirmation */}
          {step === 5 && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <div>
                <label className="block text-xs font-semibold text-slate-600 mb-1.5">
                  {recurrence === 'monthly'
                    ? 'Qual é o dia do mês que vence ou cai?'
                    : 'Data do lançamento:'}
                </label>

                {recurrence === 'monthly' ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-slate-700">Todo dia</span>
                      <input
                        type="number"
                        min="1"
                        max="31"
                        value={dayOfMonth}
                        onChange={(e) =>
                          setDayOfMonth(
                            Math.max(1, Math.min(31, parseInt(e.target.value) || 1))
                          )
                        }
                        className="w-24 px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-lg font-bold text-slate-900 tabular-nums text-center focus:bg-white focus:outline-none focus:border-teal-500"
                      />
                      <span className="text-sm text-slate-500">de cada mês</span>
                    </div>

                    {/* Quick day buttons */}
                    <div className="flex gap-2">
                      {[5, 10, 15, 20, 25].map((d) => (
                        <button
                          key={d}
                          type="button"
                          onClick={() => setDayOfMonth(d)}
                          className={`min-h-[44px] flex-1 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                            dayOfMonth === d
                              ? 'bg-teal-600 text-white border-teal-600'
                              : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                          }`}
                        >
                          Dia {d}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <input
                    type="date"
                    required
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:bg-white focus:outline-none focus:border-teal-500"
                  />
                )}
              </div>

              {/* Summary Card Before Saving */}
              <div className="p-4 bg-teal-50/90 border border-teal-200 rounded-2xl text-xs text-teal-950 space-y-2">
                <span className="font-bold text-teal-800 uppercase tracking-wider text-[10px] block">
                  Resumo do que será lançado:
                </span>
                <p className="text-sm font-bold text-slate-900 leading-snug">
                  {description || 'Lançamento'}
                </p>
                <div className="flex flex-wrap items-center gap-2 text-slate-700 text-xs">
                  <span className="font-bold text-teal-800">
                    {formatBRL(currentAmount)}
                  </span>
                  <span>·</span>
                  <span>{category}</span>
                  <span>·</span>
                  <span>
                    {recurrence === 'monthly'
                      ? `Todo dia ${dayOfMonth}`
                      : recurrence === 'installment'
                      ? `${installments} parcelas de ${formatBRL(currentAmount / installments)}`
                      : 'Só uma vez'}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom Actions */}
        <div className="p-4 sm:p-5 border-t border-slate-100 bg-white flex items-center gap-3 shrink-0">
          {step > 1 && (
            <button
              type="button"
              onClick={handleBack}
              className="min-h-[48px] px-5 rounded-2xl text-xs sm:text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors flex items-center justify-center gap-1.5"
            >
              <ArrowLeft size={16} />
              <span>Voltar</span>
            </button>
          )}

          <button
            type="button"
            disabled={!canGoNext()}
            onClick={handleNext}
            className={`flex-1 min-h-[48px] py-3.5 px-6 rounded-2xl text-xs sm:text-sm font-bold text-white shadow-md transition-all flex items-center justify-center gap-2 ${
              canGoNext()
                ? 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20 active:scale-[0.98]'
                : 'bg-slate-300 cursor-not-allowed opacity-60'
            }`}
          >
            {step < totalSteps ? (
              <>
                <span>Continuar</span>
                <ArrowRight size={16} />
              </>
            ) : (
              <>
                <Check size={18} className="stroke-[2.5]" />
                <span>Salvar Lançamento</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
