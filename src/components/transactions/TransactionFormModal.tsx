import React, { useState, useEffect } from 'react';
import { X, Check, Calculator, Calendar as CalendarIcon } from 'lucide-react';
import {
  Transaction,
  TransactionType,
  RecurrenceType,
  Category,
} from '../../types/finance';
import { formatBRL } from '../../utils/formatters';
import { parseBRL, divideMoney, multiplyMoney, roundMoney } from '../../utils/money';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (txData: Omit<Transaction, 'id'>, editId?: string) => void;
  editingTransaction?: Transaction | null;
}

const CATEGORIES_INCOME: Category[] = [
  'Salário',
  'Freelance',
  'Investimentos',
  'Outras Receitas',
];

const CATEGORIES_EXPENSE: Category[] = [
  'Moradia',
  'Alimentação',
  'Transporte',
  'Contas e Serviços',
  'Cartão e Parcelas',
  'Lazer e Assinaturas',
  'Saúde',
  'Educação',
  'Outros Gastos',
];

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTransaction,
}) => {
  const [description, setDescription] = useState('');
  const [amountStr, setAmountStr] = useState('');
  const [type, setType] = useState<TransactionType>('expense');
  const [category, setCategory] = useState<Category>('Moradia');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('monthly');
  const [startDate, setStartDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [dayOfMonth, setDayOfMonth] = useState<number>(new Date().getDate());
  const [installments, setInstallments] = useState<number>(3);
  const [installmentAmountStr, setInstallmentAmountStr] = useState<string>('');
  const [installmentInputMode, setInstallmentInputMode] = useState<
    'total' | 'installment'
  >('total');

  // Fill form when editing
  useEffect(() => {
    if (editingTransaction) {
      setDescription(editingTransaction.description);
      setAmountStr(editingTransaction.amount.toString());
      setType(editingTransaction.type);
      setCategory(editingTransaction.category);
      setRecurrence(editingTransaction.recurrence);
      setStartDate(editingTransaction.startDate);
      setDayOfMonth(editingTransaction.dayOfMonth || 5);
      if (editingTransaction.recurrence === 'installment') {
        setInstallments(editingTransaction.totalInstallments || 2);
        setInstallmentAmountStr(
          editingTransaction.installmentAmount
            ? editingTransaction.installmentAmount.toString()
            : (
                editingTransaction.amount /
                (editingTransaction.totalInstallments || 1)
              ).toFixed(2)
        );
      }
    } else {
      // Default clean values
      setDescription('');
      setAmountStr('');
      setType('expense');
      setCategory('Alimentação');
      setRecurrence('monthly');
      const today = new Date();
      setStartDate(today.toISOString().slice(0, 10));
      setDayOfMonth(today.getDate());
      setInstallments(3);
      setInstallmentAmountStr('');
      setInstallmentInputMode('total');
    }
  }, [editingTransaction, isOpen]);

  // Sync category default when type changes
  const handleTypeChange = (newType: TransactionType) => {
    setType(newType);
    if (newType === 'income') {
      if (!CATEGORIES_INCOME.includes(category)) {
        setCategory('Salário');
      }
    } else {
      if (!CATEGORIES_EXPENSE.includes(category)) {
        setCategory('Alimentação');
      }
    }
  };

  // Sync day of month from date input
  const handleDateChange = (val: string) => {
    setStartDate(val);
    const day = parseInt(val.split('-')[2], 10);
    if (!isNaN(day)) setDayOfMonth(day);
  };

  // Installment calculation helpers
  const numAmount = parseBRL(amountStr);
  const numInstallmentAmount = parseBRL(installmentAmountStr);

  let calculatedInstallmentAmount = 0;
  let calculatedTotalAmount = 0;

  if (recurrence === 'installment') {
    if (installmentInputMode === 'total') {
      calculatedTotalAmount = numAmount;
      calculatedInstallmentAmount =
        installments > 0 ? divideMoney(numAmount, installments) : 0;
    } else {
      calculatedInstallmentAmount = numInstallmentAmount;
      calculatedTotalAmount = multiplyMoney(numInstallmentAmount, installments);
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    let finalAmount = numAmount;
    let finalInstallmentAmount: number | undefined;

    if (recurrence === 'installment') {
      if (installmentInputMode === 'total') {
        finalAmount = numAmount;
        finalInstallmentAmount = calculatedInstallmentAmount;
      } else {
        finalAmount = calculatedTotalAmount;
        finalInstallmentAmount = numInstallmentAmount;
      }
    }

    if (finalAmount <= 0) return;

    const txData: Omit<Transaction, 'id'> = {
      description: description.trim(),
      amount: finalAmount,
      type,
      category,
      recurrence,
      startDate,
      dayOfMonth: recurrence === 'monthly' ? dayOfMonth : undefined,
      totalInstallments: recurrence === 'installment' ? installments : undefined,
      installmentAmount: recurrence === 'installment' ? finalInstallmentAmount : undefined,
      currentInstallment: 1,
    };

    onSave(txData, editingTransaction ? editingTransaction.id : undefined);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full sm:max-w-md bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-100 max-h-[92vh] overflow-y-auto">
        {/* Modal Header */}
        <div className="sticky top-0 bg-white/95 backdrop-blur-md px-6 pt-5 pb-3 border-b border-slate-100 flex items-center justify-between z-10">
          <div>
            <h3 className="text-lg font-bold text-slate-900">
              {editingTransaction ? 'Editar Lançamento' : 'Novo Lançamento'}
            </h3>
            <p className="text-xs text-slate-500">
              Registre valores que você espera receber ou pagar
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Type Switcher (Receita vs Despesa) */}
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
              Tipo do Lançamento
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl">
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
                  type === 'expense'
                    ? 'bg-white text-rose-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Despesa (Saída)
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`py-2.5 text-xs font-bold rounded-xl transition-all ${
                  type === 'income'
                    ? 'bg-white text-emerald-700 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Receita (Entrada)
              </button>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Descrição
            </label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Salário, Aluguel, Celular novo, Supermercado..."
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>

          {/* Recurrence Selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">
              Frequência
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setRecurrence('monthly')}
                className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all text-center ${
                  recurrence === 'monthly'
                    ? 'bg-teal-50 border-teal-500 text-teal-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                Mensal recorrente
              </button>
              <button
                type="button"
                onClick={() => setRecurrence('installment')}
                className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all text-center ${
                  recurrence === 'installment'
                    ? 'bg-teal-50 border-teal-500 text-teal-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                Parcelado
              </button>
              <button
                type="button"
                onClick={() => setRecurrence('once')}
                className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all text-center ${
                  recurrence === 'once'
                    ? 'bg-teal-50 border-teal-500 text-teal-800 shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                Única vez
              </button>
            </div>
          </div>

          {/* Value Inputs - Changes according to recurrence */}
          {recurrence === 'installment' ? (
            <div className="p-4 bg-slate-50 border border-slate-200/80 rounded-2xl space-y-3">
              <div className="flex items-center justify-between text-xs text-slate-600">
                <span className="font-semibold flex items-center gap-1">
                  <Calculator size={14} className="text-teal-600" />
                  Cálculo das Parcelas
                </span>
                <div className="flex text-[11px] gap-2">
                  <button
                    type="button"
                    onClick={() => setInstallmentInputMode('total')}
                    className={`underline decoration-teal-500 underline-offset-2 ${
                      installmentInputMode === 'total'
                        ? 'font-bold text-teal-700'
                        : 'text-slate-400'
                    }`}
                  >
                    Valor Total
                  </button>
                  <span className="text-slate-300">|</span>
                  <button
                    type="button"
                    onClick={() => setInstallmentInputMode('installment')}
                    className={`underline decoration-teal-500 underline-offset-2 ${
                      installmentInputMode === 'installment'
                        ? 'font-bold text-teal-700'
                        : 'text-slate-400'
                    }`}
                  >
                    Por Parcela
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {installmentInputMode === 'total' ? (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Valor Total (R$)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      required
                      value={amountStr}
                      onChange={(e) => setAmountStr(e.target.value)}
                      placeholder="Ex: 1200,00"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 tabular-nums focus:outline-none focus:border-teal-500"
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Valor de Cada Parcela (R$)
                    </label>
                    <input
                      type="text"
                      inputMode="decimal"
                      required
                      value={installmentAmountStr}
                      onChange={(e) => setInstallmentAmountStr(e.target.value)}
                      placeholder="Ex: 120,00"
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-bold text-slate-800 tabular-nums focus:outline-none focus:border-teal-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                    Nº de Parcelas
                  </label>
                  <select
                    value={installments}
                    onChange={(e) => setInstallments(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-sm font-semibold text-slate-800 focus:outline-none focus:border-teal-500"
                  >
                    {[2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 18, 24, 36, 48].map((n) => (
                      <option key={n} value={n}>
                        {n} vezes ({n}x)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Installment Summary Preview */}
              <div className="p-2.5 bg-teal-50/70 border border-teal-100 rounded-xl text-xs text-teal-900 flex items-center justify-between">
                <span>Plano gerado:</span>
                <span className="font-bold tabular-nums">
                  {installments}x de {formatBRL(calculatedInstallmentAmount)}
                  <span className="font-normal text-teal-700 ml-1">
                    (= {formatBRL(calculatedTotalAmount)})
                  </span>
                </span>
              </div>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                {recurrence === 'monthly' ? 'Valor Mensal (R$)' : 'Valor Total (R$)'}
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-slate-400">
                  R$
                </span>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  value={amountStr}
                  onChange={(e) => setAmountStr(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-base font-bold text-slate-800 tabular-nums focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
                />
              </div>
            </div>
          )}

          {/* Category */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1">
              Categoria
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            >
              {(type === 'income' ? CATEGORIES_INCOME : CATEGORIES_EXPENSE).map(
                (cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                )
              )}
            </select>
          </div>

          {/* Date & Day of Month */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                <CalendarIcon size={12} className="inline mr-1 text-slate-400" />
                {recurrence === 'once' ? 'Data' : 'Primeiro Mês / Início'}
              </label>
              <input
                type="date"
                required
                value={startDate}
                onChange={(e) => handleDateChange(e.target.value)}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:bg-white focus:outline-none focus:border-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 mb-1">
                Dia do Vencimento
              </label>
              <input
                type="number"
                min="1"
                max="31"
                value={dayOfMonth}
                onChange={(e) => setDayOfMonth(Math.max(1, Math.min(31, parseInt(e.target.value) || 1)))}
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-bold text-slate-800 tabular-nums focus:bg-white focus:outline-none focus:border-teal-500"
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 rounded-xl text-sm font-semibold text-white bg-teal-600 hover:bg-teal-700 shadow-sm transition-colors flex items-center justify-center gap-1.5"
            >
              <Check size={16} />
              <span>{editingTransaction ? 'Salvar Alterações' : 'Adicionar'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
