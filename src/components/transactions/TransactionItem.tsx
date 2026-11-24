import React from 'react';
import {
  Pencil,
  Trash2,
  Calendar,
  Layers,
  Repeat,
  ArrowUpRight,
  ArrowDownRight,
} from 'lucide-react';
import { Transaction } from '../../types/finance';
import { formatBRL, formatDateBR } from '../../utils/formatters';

interface TransactionItemProps {
  transaction: Transaction;
  onEdit: (tx: Transaction) => void;
  onDeleteWithUndo: (id: string) => void;
}

export const TransactionItem: React.FC<TransactionItemProps> = ({
  transaction,
  onEdit,
  onDeleteWithUndo,
}) => {
  const isIncome = transaction.type === 'income';

  return (
    <div className="bg-white p-4 rounded-3xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3 group hover:border-teal-300 transition-all">
      <div className="flex items-center gap-3 min-w-0">
        <div
          className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 ${
            isIncome
              ? 'bg-emerald-50 text-emerald-600'
              : 'bg-slate-100 text-slate-600'
          }`}
        >
          {isIncome ? (
            <ArrowUpRight size={22} className="stroke-[2.2]" />
          ) : (
            <ArrowDownRight size={22} className="stroke-[2.2]" />
          )}
        </div>

        <div className="min-w-0">
          <h4 className="text-sm font-bold text-slate-800 truncate">
            {transaction.description}
          </h4>

          <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-500 mt-0.5">
            <span className="font-medium">{transaction.category}</span>
            <span>·</span>

            {/* Recurrence tag */}
            {transaction.recurrence === 'monthly' && (
              <span className="inline-flex items-center gap-1 text-[11px] text-teal-700 font-bold bg-teal-50 px-2 py-0.5 rounded-lg">
                <Repeat size={11} />
                Todo dia {transaction.dayOfMonth || 5}
              </span>
            )}

            {transaction.recurrence === 'installment' && (
              <span className="inline-flex items-center gap-1 text-[11px] text-indigo-700 font-bold bg-indigo-50 px-2 py-0.5 rounded-lg">
                <Layers size={11} />
                {transaction.totalInstallments}x de{' '}
                {formatBRL(
                  transaction.installmentAmount ||
                    transaction.amount / (transaction.totalInstallments || 1)
                )}
              </span>
            )}

            {transaction.recurrence === 'once' && (
              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-lg">
                <Calendar size={11} />
                {formatDateBR(transaction.startDate)}
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <div className="text-right">
          <span
            className={`text-sm sm:text-base font-extrabold tabular-nums block ${
              isIncome ? 'text-emerald-600' : 'text-slate-900'
            }`}
          >
            {isIncome ? '+ ' : '- '}
            {formatBRL(transaction.amount)}
          </span>
          {transaction.recurrence === 'installment' && (
            <span className="text-[10px] text-slate-400 block font-medium">
              Total parcelado
            </span>
          )}
        </div>

        {/* Action icons with large hit targets */}
        <div className="flex items-center gap-1">
          <button
            onClick={() => onEdit(transaction)}
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-slate-400 hover:text-teal-700 hover:bg-teal-50 transition-colors"
            title="Editar lançamento"
            aria-label={`Editar ${transaction.description}`}
          >
            <Pencil size={17} />
          </button>
          <button
            onClick={() => onDeleteWithUndo(transaction.id)}
            className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-xl flex items-center justify-center text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
            title="Excluir (com opção de desfazer)"
            aria-label={`Excluir ${transaction.description}`}
          >
            <Trash2 size={17} />
          </button>
        </div>
      </div>
    </div>
  );
};
