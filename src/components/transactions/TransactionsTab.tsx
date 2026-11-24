import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, ReceiptText, Sparkles } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction } from '../../types/finance';
import { TransactionItem } from './TransactionItem';
import { TransactionWizardModal } from './TransactionWizardModal';
import { EmptyState } from '../common/EmptyState';
import { HelpTooltip } from '../common/HelpTooltip';
import { formatBRL } from '../../utils/formatters';

export const TransactionsTab: React.FC = () => {
  const {
    transactions,
    addTransaction,
    updateTransaction,
    deleteTransactionWithUndo,
  } = useFinance();

  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<
    'all' | 'income' | 'expense' | 'monthly' | 'installment'
  >('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const handleEdit = (tx: Transaction) => {
    setEditingTx(tx);
    setIsModalOpen(true);
  };

  const handleSave = (txData: Omit<Transaction, 'id'>, editId?: string) => {
    if (editId) {
      updateTransaction(editId, txData);
    } else {
      addTransaction(txData);
    }
  };

  // Filtered transactions
  const filtered = useMemo(() => {
    return transactions.filter((tx) => {
      const matchSearch =
        tx.description.toLowerCase().includes(search.toLowerCase()) ||
        tx.category.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;

      if (filterType === 'income') return tx.type === 'income';
      if (filterType === 'expense') return tx.type === 'expense';
      if (filterType === 'monthly') return tx.recurrence === 'monthly';
      if (filterType === 'installment') return tx.recurrence === 'installment';
      return true;
    });
  }, [transactions, search, filterType]);

  // Aggregate monthly base
  const monthlyIncomes = transactions
    .filter((t) => t.type === 'income' && t.recurrence === 'monthly')
    .reduce((a, b) => a + b.amount, 0);

  const monthlyExpenses = transactions
    .filter((t) => t.type === 'expense' && t.recurrence === 'monthly')
    .reduce((a, b) => a + b.amount, 0);

  return (
    <div className="space-y-4 pb-20 animate-in fade-in duration-150">
      {/* Header & Quick stats */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-1.5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Seus Lançamentos
            </h2>
            <HelpTooltip
              title="Lançamentos Futuros"
              text="Aqui ficam todas as contas que você cadastrou. Elas são usadas para projetar o saldo de cada mês."
            />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Tudo o que entra e sai do seu bolso agora e nos próximos meses
          </p>
        </div>

        <button
          onClick={() => {
            setEditingTx(null);
            setIsModalOpen(true);
          }}
          className="min-h-[48px] px-5 py-2.5 bg-teal-600 hover:bg-teal-700 text-white rounded-2xl text-xs sm:text-sm font-bold shadow-md shadow-teal-600/20 transition-all flex items-center justify-center gap-2 active:scale-95"
        >
          <Plus size={18} className="stroke-[2.5]" />
          <span>Novo Lançamento</span>
        </button>
      </div>

      {/* Recurrent Monthly Base Card */}
      <div className="bg-slate-900 text-white p-4 sm:p-5 rounded-3xl shadow-sm flex items-center justify-between text-xs">
        <div>
          <div className="flex items-center gap-1 mb-1">
            <span className="text-slate-400 text-[11px] font-semibold">
              Contas Fixas de Todo Mês
            </span>
            <HelpTooltip
              title="Contas Fixas"
              text="São gastos e ganhos que acontecem todo mês, como aluguel e salário."
            />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-emerald-400 font-extrabold tabular-nums text-sm sm:text-base">
              +{formatBRL(monthlyIncomes)}
            </span>
            <span className="text-slate-600 font-bold">/</span>
            <span className="text-rose-300 font-extrabold tabular-nums text-sm sm:text-base">
              -{formatBRL(monthlyExpenses)}
            </span>
          </div>
        </div>

        <div className="text-right">
          <span className="text-slate-400 block text-[11px] font-semibold mb-1">
            Resultado Fixo
          </span>
          <span
            className={`font-extrabold tabular-nums text-sm sm:text-base ${
              monthlyIncomes - monthlyExpenses >= 0
                ? 'text-teal-300'
                : 'text-rose-400'
            }`}
          >
            {formatBRL(monthlyIncomes - monthlyExpenses)}/mês
          </span>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="space-y-2">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou categoria..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-slate-200/90 rounded-2xl text-xs sm:text-sm text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all shadow-xs"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold text-slate-400 hover:text-slate-600"
            >
              Limpar
            </button>
          )}
        </div>

        {/* Filter chips with minimum height 40px */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <div className="flex items-center text-xs text-slate-400 pl-1 pr-1.5 shrink-0">
            <Filter size={13} className="mr-1" />
            <span>Ver:</span>
          </div>
          {[
            { id: 'all', label: 'Tudo' },
            { id: 'income', label: 'Entrou (Ganhos)' },
            { id: 'expense', label: 'Saiu (Gastos)' },
            { id: 'monthly', label: 'Todo Mês' },
            { id: 'installment', label: 'Parcelados' },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilterType(f.id as typeof filterType)}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-colors shrink-0 ${
                filterType === f.id
                  ? 'bg-teal-600 text-white shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List or Empty State */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title={search ? 'Nenhum lançamento encontrado' : 'Nenhuma conta cadastrada ainda'}
          description={
            search
              ? 'Tente buscar com outra palavra ou limpe o filtro acima.'
              : 'Cadastre suas contas e ganhos para começar a prever o saldo dos próximos meses.'
          }
          actionLabel="Adicionar Lançamento"
          onAction={() => {
            setEditingTx(null);
            setIsModalOpen(true);
          }}
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((tx) => (
            <TransactionItem
              key={tx.id}
              transaction={tx}
              onEdit={handleEdit}
              onDeleteWithUndo={deleteTransactionWithUndo}
            />
          ))}
        </div>
      )}

      {/* Wizard Modal */}
      <TransactionWizardModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setEditingTx(null);
        }}
        onSave={handleSave}
        editingTransaction={editingTx}
      />
    </div>
  );
};
