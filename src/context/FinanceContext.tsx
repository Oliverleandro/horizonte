import React, { createContext, useContext, useState, useEffect, useMemo, useRef } from 'react';
import {
  Transaction,
  Goal,
  MonthProjection,
  ProjectedOccurrence,
  WizardSetupData,
  Category,
  TransactionType,
  RecurrenceType,
} from '../types/finance';
import { getInitialData } from '../data/initialData';
import { calculateProjection, getUpcomingDueDates } from '../utils/projections';
import {
  roundMoney,
  addMoney,
  subtractMoney,
  divideMoney,
} from '../utils/money';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { useAuth } from './AuthContext';

interface CriticalAlert {
  isNegative: boolean;
  date?: string;
  formattedDate?: string;
  amount?: number;
  monthIndex?: number;
  daysUntil?: number;
}

export interface ToastState {
  id: string;
  message: string;
  canUndo: boolean;
}

interface DeletedItemBackup {
  type: 'transaction' | 'goal';
  data: Transaction | Goal;
}

interface FinanceContextType {
  currentBalance: number;
  setCurrentBalance: (balance: number) => Promise<void>;
  transactions: Transaction[];
  addTransaction: (tx: Omit<Transaction, 'id'>) => Promise<void>;
  updateTransaction: (id: string, tx: Partial<Transaction>) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  deleteTransactionWithUndo: (id: string) => Promise<void>;
  goals: Goal[];
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt'>) => Promise<void>;
  updateGoal: (id: string, goal: Partial<Goal>) => Promise<void>;
  deleteGoal: (id: string) => Promise<void>;
  deleteGoalWithUndo: (id: string) => Promise<void>;
  contributeToGoal: (id: string, amount: number, tipo?: 'deposito' | 'resgate') => Promise<void>;
  activeTab: 'inicio' | 'lancamentos' | 'simulador' | 'metas' | 'perfil';
  setActiveTab: (tab: 'inicio' | 'lancamentos' | 'simulador' | 'metas' | 'perfil') => void;
  projectionMonths: 3 | 6 | 12;
  setProjectionMonths: (months: 3 | 6 | 12) => void;
  // Computed values
  monthlyProjections: MonthProjection[];
  criticalAlert: CriticalAlert | null;
  lowestBalance: { amount: number; month: string; date: string };
  upcomingDues: ProjectedOccurrence[];
  // Loading & Sync states
  isSyncing: boolean;
  networkError: string | null;
  retrySync: () => Promise<void>;
  // Toast & Undo
  toast: ToastState | null;
  dismissToast: () => void;
  undoLastDelete: () => Promise<void>;
  // Onboarding
  hasCompletedOnboarding: boolean;
  isOnboardingOpen: boolean;
  setIsOnboardingOpen: (open: boolean) => void;
  completeOnboarding: () => Promise<void>;
  setupFromWizard: (data: WizardSetupData) => Promise<void>;
  // Actions
  resetToSampleData: () => Promise<void>;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'inicio' | 'lancamentos' | 'simulador' | 'metas' | 'perfil'>('inicio');
  const [projectionMonths, setProjectionMonths] = useState<3 | 6 | 12>(6);
  const [currentBalance, setCurrentBalanceState] = useState<number>(0);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [goals, setGoals] = useState<Goal[]>([]);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState<boolean>(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(false);

  // Sync and network states
  const [isSyncing, setIsSyncing] = useState<boolean>(true);
  const [networkError, setNetworkError] = useState<string | null>(null);

  // Toast and Undo state
  const [toast, setToast] = useState<ToastState | null>(null);
  const lastDeletedRef = useRef<DeletedItemBackup | null>(null);
  const toastTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (message: string, canUndo: boolean = false) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToast({
      id: `toast-${Date.now()}`,
      message,
      canUndo,
    });
    toastTimeoutRef.current = setTimeout(() => {
      setToast(null);
      lastDeletedRef.current = null;
    }, 5500);
  };

  const dismissToast = () => {
    if (toastTimeoutRef.current) clearTimeout(toastTimeoutRef.current);
    setToast(null);
  };

  const saveLocalFinance = (
    userId: string,
    balance: number,
    txList: Transaction[],
    goalsList: Goal[],
    onboarded: boolean
  ) => {
    try {
      localStorage.setItem(
        `horizonte_finance_${userId}`,
        JSON.stringify({
          currentBalance: balance,
          transactions: txList,
          goals: goalsList,
          hasCompletedOnboarding: onboarded,
          updatedAt: new Date().toISOString(),
        })
      );
    } catch (e) {
      console.error('Falha ao salvar dados locais:', e);
    }
  };

  // Sync data from Supabase or Local Storage when user logs in
  const syncFromSupabase = async () => {
    if (!user) {
      setTransactions([]);
      setGoals([]);
      setCurrentBalanceState(0);
      setIsSyncing(false);
      return;
    }

    if (!isSupabaseConfigured) {
      // Local Storage mode per user account
      try {
        const localDataKey = `horizonte_finance_${user.id}`;
        const saved = localStorage.getItem(localDataKey);

        if (saved) {
          const parsed = JSON.parse(saved);
          const loadedBalance = roundMoney(Number(parsed.currentBalance) || 0);
          const loadedTx: Transaction[] = Array.isArray(parsed.transactions) ? parsed.transactions : [];
          const loadedGoals: Goal[] = Array.isArray(parsed.goals) ? parsed.goals : [];
          const loadedOnboarding = Boolean(parsed.hasCompletedOnboarding);

          setCurrentBalanceState(loadedBalance);
          setTransactions(loadedTx);
          setGoals(loadedGoals);
          setHasCompletedOnboarding(loadedOnboarding);

          if (!loadedOnboarding && loadedTx.length === 0) {
            setIsOnboardingOpen(true);
          }
        } else {
          // If demo user, initialize with sample data
          if (user.id === 'usr_demo_sample' || user.email === 'demonstracao@horizonte.app') {
            const sample = getInitialData();
            setCurrentBalanceState(sample.initialBalance);
            setTransactions(sample.initialTransactions);
            setGoals(sample.initialGoals);
            setHasCompletedOnboarding(true);
            saveLocalFinance(user.id, sample.initialBalance, sample.initialTransactions, sample.initialGoals, true);
          } else {
            // New user account starts completely fresh with onboarding wizard
            setCurrentBalanceState(0);
            setTransactions([]);
            setGoals([]);
            setHasCompletedOnboarding(false);
            setIsOnboardingOpen(true);
            saveLocalFinance(user.id, 0, [], [], false);
          }
        }
      } catch (err) {
        console.error('Erro ao ler dados locais:', err);
      } finally {
        setIsSyncing(false);
      }
      return;
    }

    setIsSyncing(true);
    setNetworkError(null);

    try {
      // 1. Fetch user profile (current balance & onboarding status)
      const { data: profileData, error: profileErr } = await supabase
        .from('perfis')
        .select('*')
        .eq('id', user.id)
        .single();

      if (!profileErr && profileData) {
        setCurrentBalanceState(roundMoney(Number(profileData.saldo_atual) || 0));
        setHasCompletedOnboarding(Boolean(profileData.onboarding_concluido));
        if (!profileData.onboarding_concluido) {
          setIsOnboardingOpen(true);
        }
      }

      // 2. Fetch transactions (lancamentos)
      const { data: txData, error: txErr } = await supabase
        .from('lancamentos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (txErr) throw txErr;

      const mappedTx: Transaction[] = (txData || []).map((row) => ({
        id: row.id,
        user_id: row.user_id,
        description: row.descricao,
        amount: roundMoney(Number(row.valor)),
        type: row.tipo as TransactionType,
        category: row.categoria as Category,
        recurrence: row.recorrencia as RecurrenceType,
        startDate: row.data_inicio,
        dayOfMonth: row.dia_do_mes,
        totalInstallments: row.total_parcelas,
        installmentAmount: row.valor_parcela ? roundMoney(Number(row.valor_parcela)) : undefined,
        currentInstallment: row.parcela_atual || 1,
        created_at: row.created_at,
      }));

      // If user has zero transactions and hasn't finished onboarding, show onboarding
      if (mappedTx.length === 0 && (!profileData || !profileData.onboarding_concluido)) {
        setIsOnboardingOpen(true);
      }

      setTransactions(mappedTx);

      // 3. Fetch goals (cofrinhos)
      const { data: goalsData, error: goalsErr } = await supabase
        .from('cofrinhos')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (goalsErr) throw goalsErr;

      const mappedGoals: Goal[] = (goalsData || []).map((row) => ({
        id: row.id,
        user_id: row.user_id,
        title: row.titulo,
        targetAmount: roundMoney(Number(row.valor_alvo)),
        currentAmount: roundMoney(Number(row.valor_atual)),
        targetDate: row.data_alvo,
        category: row.categoria,
        createdAt: row.created_at,
      }));

      setGoals(mappedGoals);

      // Cache locally
      saveLocalFinance(
        user.id,
        roundMoney(Number(profileData?.saldo_atual) || 0),
        mappedTx,
        mappedGoals,
        Boolean(profileData?.onboarding_concluido)
      );
    } catch {
      // Local fallback in case of cloud failure
      try {
        const saved = localStorage.getItem(`horizonte_finance_${user.id}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          setCurrentBalanceState(roundMoney(Number(parsed.currentBalance) || 0));
          setTransactions(parsed.transactions || []);
          setGoals(parsed.goals || []);
          setHasCompletedOnboarding(Boolean(parsed.hasCompletedOnboarding));
        }
      } catch {
        // ignore
      }
      setNetworkError('Não foi possível sincronizar com o banco na nuvem. Modo local ativo.');
    } finally {
      setIsSyncing(false);
    }
  };

  useEffect(() => {
    syncFromSupabase();
  }, [user?.id]);

  // Automatically persist local state whenever data changes for the active user
  useEffect(() => {
    if (user && !isSyncing) {
      saveLocalFinance(user.id, currentBalance, transactions, goals, hasCompletedOnboarding);
    }
  }, [user?.id, currentBalance, transactions, goals, hasCompletedOnboarding, isSyncing]);

  const retrySync = async () => {
    await syncFromSupabase();
  };

  // Mutators for balance
  const setCurrentBalance = async (balance: number) => {
    const previousBalance = currentBalance;
    const rounded = roundMoney(balance);
    setCurrentBalanceState(rounded);

    if (user && isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('perfis')
          .update({ saldo_atual: rounded, updated_at: new Date().toISOString() })
          .eq('id', user.id);

        if (error) {
          setCurrentBalanceState(previousBalance);
          showToast('Não foi possível atualizar o saldo. Tente novamente.', false);
          return;
        }
      } catch {
        setCurrentBalanceState(previousBalance);
        showToast('Não foi possível atualizar o saldo. Tente novamente.', false);
        return;
      }
    }
    showToast('Saldo atual atualizado com sucesso!');
  };

  // Mutators for Transactions
  const addTransaction = async (tx: Omit<Transaction, 'id'>) => {
    const tempId = `tx-${Date.now()}`;
    const roundedTx: Transaction = {
      ...tx,
      amount: roundMoney(tx.amount),
      installmentAmount: tx.installmentAmount ? roundMoney(tx.installmentAmount) : undefined,
      id: tempId,
      user_id: user?.id,
    };

    // Optimistic UI update
    setTransactions((prev) => [roundedTx, ...prev]);

    if (user && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('lancamentos')
          .insert({
            user_id: user.id,
            descricao: roundedTx.description,
            valor: roundedTx.amount,
            tipo: roundedTx.type,
            categoria: roundedTx.category,
            recorrencia: roundedTx.recurrence,
            data_inicio: roundedTx.startDate,
            dia_do_mes: roundedTx.dayOfMonth,
            total_parcelas: roundedTx.totalInstallments,
            valor_parcela: roundedTx.installmentAmount,
            parcela_atual: roundedTx.currentInstallment || 1,
          })
          .select()
          .single();

        if (error) {
          // Revert optimistic update!
          setTransactions((prev) => prev.filter((item) => item.id !== tempId));
          showToast('Não foi possível salvar o lançamento. Tente novamente.', false);
          return;
        }

        if (data) {
          // Replace tempId with real UUID from Supabase
          setTransactions((prev) =>
            prev.map((item) => (item.id === tempId ? { ...item, id: data.id } : item))
          );
        }
      } catch {
        setTransactions((prev) => prev.filter((item) => item.id !== tempId));
        showToast('Não foi possível salvar o lançamento. Tente novamente.', false);
        return;
      }
    }

    showToast(`"${tx.description}" foi salvo com sucesso!`, false);
  };

  const updateTransaction = async (id: string, updated: Partial<Transaction>) => {
    const previousTransactions = transactions;
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, ...updated } : tx))
    );

    if (user && isSupabaseConfigured) {
      try {
        const dbPayload: Record<string, unknown> = {};
        if (updated.description !== undefined) dbPayload.descricao = updated.description;
        if (updated.amount !== undefined) dbPayload.valor = roundMoney(updated.amount);
        if (updated.type !== undefined) dbPayload.tipo = updated.type;
        if (updated.category !== undefined) dbPayload.categoria = updated.category;
        if (updated.recurrence !== undefined) dbPayload.recorrencia = updated.recurrence;
        if (updated.startDate !== undefined) dbPayload.data_inicio = updated.startDate;
        if (updated.dayOfMonth !== undefined) dbPayload.dia_do_mes = updated.dayOfMonth;
        if (updated.totalInstallments !== undefined) dbPayload.total_parcelas = updated.totalInstallments;
        if (updated.installmentAmount !== undefined) dbPayload.valor_parcela = roundMoney(updated.installmentAmount);

        const { error } = await supabase
          .from('lancamentos')
          .update(dbPayload)
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          setTransactions(previousTransactions);
          showToast('Não foi possível atualizar o lançamento. Tente novamente.', false);
          return;
        }
      } catch {
        setTransactions(previousTransactions);
        showToast('Não foi possível atualizar o lançamento. Tente novamente.', false);
        return;
      }
    }
    showToast('Lançamento atualizado!');
  };

  const deleteTransaction = async (id: string) => {
    const previousTransactions = transactions;
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));

    if (user && isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('lancamentos')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          setTransactions(previousTransactions);
          showToast('Não foi possível excluir o lançamento. Tente novamente.', false);
        }
      } catch {
        setTransactions(previousTransactions);
        showToast('Não foi possível excluir o lançamento. Tente novamente.', false);
      }
    }
  };

  const deleteTransactionWithUndo = async (id: string) => {
    const item = transactions.find((t) => t.id === id);
    if (!item) return;

    const previousTransactions = transactions;
    lastDeletedRef.current = { type: 'transaction', data: item };
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));

    if (user && isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('lancamentos')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          setTransactions(previousTransactions);
          lastDeletedRef.current = null;
          showToast('Não foi possível excluir o lançamento. Tente novamente.', false);
          return;
        }
      } catch {
        setTransactions(previousTransactions);
        lastDeletedRef.current = null;
        showToast('Não foi possível excluir o lançamento. Tente novamente.', false);
        return;
      }
    }
    showToast(`"${item.description}" foi removido.`, true);
  };

  // Mutators for Goals (Cofrinhos)
  const addGoal = async (goalData: Omit<Goal, 'id' | 'createdAt'>) => {
    const tempId = `goal-${Date.now()}`;
    const newGoal: Goal = {
      ...goalData,
      targetAmount: roundMoney(goalData.targetAmount),
      currentAmount: roundMoney(goalData.currentAmount),
      id: tempId,
      user_id: user?.id,
      createdAt: new Date().toISOString().slice(0, 10),
    };
    setGoals((prev) => [...prev, newGoal]);

    if (user && isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('cofrinhos')
          .insert({
            user_id: user.id,
            titulo: newGoal.title,
            valor_alvo: newGoal.targetAmount,
            valor_atual: newGoal.currentAmount,
            data_alvo: newGoal.targetDate,
            categoria: newGoal.category || 'Reserva',
          })
          .select()
          .single();

        if (error) {
          setGoals((prev) => prev.filter((item) => item.id !== tempId));
          showToast('Não foi possível criar a meta. Tente novamente.', false);
          return;
        }

        if (data) {
          setGoals((prev) =>
            prev.map((item) => (item.id === tempId ? { ...item, id: data.id } : item))
          );
        }
      } catch {
        setGoals((prev) => prev.filter((item) => item.id !== tempId));
        showToast('Não foi possível criar a meta. Tente novamente.', false);
        return;
      }
    }
    showToast(`Meta "${newGoal.title}" criada!`, false);
  };

  const updateGoal = async (id: string, updated: Partial<Goal>) => {
    const previousGoals = goals;
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, ...updated } : g))
    );

    if (user && isSupabaseConfigured) {
      try {
        const dbPayload: Record<string, unknown> = {};
        if (updated.title !== undefined) dbPayload.titulo = updated.title;
        if (updated.targetAmount !== undefined) dbPayload.valor_alvo = roundMoney(updated.targetAmount);
        if (updated.currentAmount !== undefined) dbPayload.valor_atual = roundMoney(updated.currentAmount);
        if (updated.targetDate !== undefined) dbPayload.data_alvo = updated.targetDate;
        if (updated.category !== undefined) dbPayload.categoria = updated.category;

        const { error } = await supabase
          .from('cofrinhos')
          .update(dbPayload)
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          setGoals(previousGoals);
          showToast('Não foi possível atualizar a meta. Tente novamente.', false);
          return;
        }
      } catch {
        setGoals(previousGoals);
        showToast('Não foi possível atualizar a meta. Tente novamente.', false);
        return;
      }
    }
    showToast('Meta atualizada!');
  };

  const deleteGoal = async (id: string) => {
    const previousGoals = goals;
    setGoals((prev) => prev.filter((g) => g.id !== id));

    if (user && isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('cofrinhos')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          setGoals(previousGoals);
          showToast('Não foi possível excluir a meta. Tente novamente.', false);
        }
      } catch {
        setGoals(previousGoals);
        showToast('Não foi possível excluir a meta. Tente novamente.', false);
      }
    }
  };

  const deleteGoalWithUndo = async (id: string) => {
    const item = goals.find((g) => g.id === id);
    if (!item) return;

    const previousGoals = goals;
    lastDeletedRef.current = { type: 'goal', data: item };
    setGoals((prev) => prev.filter((g) => g.id !== id));

    if (user && isSupabaseConfigured) {
      try {
        const { error } = await supabase
          .from('cofrinhos')
          .delete()
          .eq('id', id)
          .eq('user_id', user.id);

        if (error) {
          setGoals(previousGoals);
          lastDeletedRef.current = null;
          showToast('Não foi possível excluir a meta. Tente novamente.', false);
          return;
        }
      } catch {
        setGoals(previousGoals);
        lastDeletedRef.current = null;
        showToast('Não foi possível excluir a meta. Tente novamente.', false);
        return;
      }
    }
    showToast(`Meta "${item.title}" foi removida.`, true);
  };

  /**
   * Rule 2: contributeToGoal:
   * - Calculate new amount outside setGoals using current value read before
   * - Accept deposit or withdrawal ('deposito' | 'resgate')
   * - Amount is always positive, withdrawal cannot exceed current amount
   * - Update cofrinho and record movimentacoes_cofrinhos via RPC movimentar_cofrinho
   */
  const contributeToGoal = async (
    id: string,
    amount: number,
    tipo: 'deposito' | 'resgate' = 'deposito'
  ) => {
    const currentGoal = goals.find((g) => g.id === id);
    if (!currentGoal) return;

    const positiveAmount = roundMoney(Math.abs(amount));
    if (positiveAmount <= 0) {
      showToast('O valor da movimentação deve ser maior que zero.', false);
      return;
    }

    if (tipo === 'resgate' && positiveAmount > currentGoal.currentAmount) {
      showToast('O valor do resgate não pode ser maior que o saldo guardado na meta.', false);
      return;
    }

    const calculatedNewAmount =
      tipo === 'resgate'
        ? subtractMoney(currentGoal.currentAmount, positiveAmount)
        : addMoney(currentGoal.currentAmount, positiveAmount);

    const previousGoals = goals;
    // Optimistic state update
    setGoals((prev) =>
      prev.map((g) => (g.id === id ? { ...g, currentAmount: calculatedNewAmount } : g))
    );

    if (user && isSupabaseConfigured) {
      try {
        // Attempt transactional RPC call first
        const { data: rpcData, error: rpcErr } = await supabase.rpc('movimentar_cofrinho', {
          p_cofrinho_id: id,
          p_valor: positiveAmount,
          p_tipo: tipo,
        });

        if (rpcErr) {
          // If RPC fails or is missing, try direct table fallback
          const { error: updErr } = await supabase
            .from('cofrinhos')
            .update({ valor_atual: calculatedNewAmount })
            .eq('id', id)
            .eq('user_id', user.id);

          const { error: movErr } = await supabase
            .from('movimentacoes_cofrinhos')
            .insert({
              user_id: user.id,
              cofrinho_id: id,
              valor: positiveAmount,
              tipo: tipo,
              data: new Date().toISOString(),
            });

          if (updErr || movErr) {
            setGoals(previousGoals);
            showToast('Não foi possível registrar a movimentação. Tente novamente.', false);
            return;
          }
        } else if (rpcData && typeof rpcData.valor_atual === 'number') {
          // Sync with server returned value
          setGoals((prev) =>
            prev.map((g) => (g.id === id ? { ...g, currentAmount: roundMoney(Number(rpcData.valor_atual)) } : g))
          );
        }
      } catch {
        setGoals(previousGoals);
        showToast('Não foi possível registrar a movimentação. Tente novamente.', false);
        return;
      }
    }

    showToast(
      tipo === 'resgate'
        ? `Resgate de R$ ${positiveAmount.toFixed(2)} registrado com sucesso!`
        : `Aporte de R$ ${positiveAmount.toFixed(2)} guardado na meta!`,
      false
    );
  };

  const undoLastDelete = async () => {
    const backup = lastDeletedRef.current;
    if (!backup) return;

    if (backup.type === 'transaction') {
      const tx = backup.data as Transaction;
      setTransactions((prev) => [tx, ...prev]);

      if (user && isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('lancamentos')
            .insert({
              id: tx.id.startsWith('tx-') ? undefined : tx.id,
              user_id: user.id,
              descricao: tx.description,
              valor: tx.amount,
              tipo: tx.type,
              categoria: tx.category,
              recorrencia: tx.recurrence,
              data_inicio: tx.startDate,
              dia_do_mes: tx.dayOfMonth,
              total_parcelas: tx.totalInstallments,
              valor_parcela: tx.installmentAmount,
              parcela_atual: tx.currentInstallment || 1,
            })
            .select()
            .single();

          if (error) {
            setTransactions((prev) => prev.filter((t) => t.id !== tx.id));
            showToast('Não foi possível restaurar o lançamento. Tente novamente.', false);
            return;
          }

          if (data && tx.id.startsWith('tx-')) {
            setTransactions((prev) => prev.map((t) => (t.id === tx.id ? { ...t, id: data.id } : t)));
          }
        } catch {
          setTransactions((prev) => prev.filter((t) => t.id !== tx.id));
          showToast('Não foi possível restaurar o lançamento. Tente novamente.', false);
          return;
        }
      }
      showToast(`Lançamento "${tx.description}" restaurado!`, false);
    } else if (backup.type === 'goal') {
      const g = backup.data as Goal;
      setGoals((prev) => [g, ...prev]);

      if (user && isSupabaseConfigured) {
        try {
          const { data, error } = await supabase
            .from('cofrinhos')
            .insert({
              id: g.id.startsWith('goal-') ? undefined : g.id,
              user_id: user.id,
              titulo: g.title,
              valor_alvo: g.targetAmount,
              valor_atual: g.currentAmount,
              data_alvo: g.targetDate,
              categoria: g.category || 'Reserva',
            })
            .select()
            .single();

          if (error) {
            setGoals((prev) => prev.filter((item) => item.id !== g.id));
            showToast('Não foi possível restaurar a meta. Tente novamente.', false);
            return;
          }

          if (data && g.id.startsWith('goal-')) {
            setGoals((prev) => prev.map((item) => (item.id === g.id ? { ...item, id: data.id } : item)));
          }
        } catch {
          setGoals((prev) => prev.filter((item) => item.id !== g.id));
          showToast('Não foi possível restaurar a meta. Tente novamente.', false);
          return;
        }
      }
      showToast(`Meta "${g.title}" restaurada!`, false);
    }
    lastDeletedRef.current = null;
  };

  const completeOnboarding = async () => {
    setHasCompletedOnboarding(true);
    setIsOnboardingOpen(false);
    if (user && isSupabaseConfigured) {
      try {
        await supabase
          .from('perfis')
          .update({ onboarding_concluido: true, updated_at: new Date().toISOString() })
          .eq('id', user.id);
      } catch (e) {
        console.error('Erro ao marcar onboarding no Supabase:', e);
      }
    }
  };

  /**
   * Rule 1 & Rule 6:
   * - Insert with .select() and swap temporary ids with real database IDs
   * - Reopening the wizard must not overwrite existing transactions
   */
  const setupFromWizard = async (data: WizardSetupData) => {
    const roundedBalance = roundMoney(data.currentBalance);
    setCurrentBalanceState(roundedBalance);

    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth();

    const makeDate = (day: number) => {
      const d = new Date(currentYear, currentMonth, day);
      return d.toISOString().slice(0, 10);
    };

    const newTransactions: Transaction[] = [];

    // Salary
    if (data.salary > 0) {
      newTransactions.push({
        id: `tx-salary-${Date.now()}`,
        user_id: user?.id,
        description: 'Meu Salário / Renda Principal',
        amount: roundMoney(data.salary),
        type: 'income',
        category: 'Salário',
        recurrence: 'monthly',
        startDate: makeDate(data.salaryDay),
        dayOfMonth: data.salaryDay,
      });
    }

    // Bills
    data.bills.forEach((bill, idx) => {
      if (bill.amount > 0 && bill.description.trim()) {
        newTransactions.push({
          id: `tx-bill-${Date.now()}-${idx}`,
          user_id: user?.id,
          description: bill.description.trim(),
          amount: roundMoney(bill.amount),
          type: 'expense',
          category: bill.category,
          recurrence: 'monthly',
          startDate: makeDate(bill.dayOfMonth),
          dayOfMonth: bill.dayOfMonth,
        });
      }
    });

    // Do NOT wipe existing transactions: append new ones
    setTransactions((prev) => [...newTransactions, ...prev]);

    // Save to Supabase
    if (user && isSupabaseConfigured) {
      try {
        // 1. Update balance & onboarding flag
        const { error: profileErr } = await supabase
          .from('perfis')
          .update({
            saldo_atual: roundedBalance,
            onboarding_concluido: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', user.id);

        if (profileErr) {
          showToast('Não foi possível salvar o saldo inicial. Tente novamente.', false);
        }

        // 2. Insert new transactions with .select()
        if (newTransactions.length > 0) {
          const dbRows = newTransactions.map((tx) => ({
            user_id: user.id,
            descricao: tx.description,
            valor: tx.amount,
            tipo: tx.type,
            categoria: tx.category,
            recorrencia: tx.recurrence,
            data_inicio: tx.startDate,
            dia_do_mes: tx.dayOfMonth,
          }));

          const { data: insertedData, error: txErr } = await supabase
            .from('lancamentos')
            .insert(dbRows)
            .select();

          if (txErr) {
            // Revert newly added transactions
            setTransactions((prev) => prev.filter((t) => !newTransactions.some((nt) => nt.id === t.id)));
            showToast('Não foi possível salvar os lançamentos do assistente.', false);
            return;
          }

          if (insertedData && insertedData.length > 0) {
            // Map temporary IDs to real database UUIDs
            const idMap = new Map<number, string>();
            insertedData.forEach((row, idx) => {
              idMap.set(idx, row.id);
            });

            setTransactions((prev) =>
              prev.map((t) => {
                const foundIdx = newTransactions.findIndex((nt) => nt.id === t.id);
                if (foundIdx !== -1 && idMap.has(foundIdx)) {
                  return { ...t, id: idMap.get(foundIdx)! };
                }
                return t;
              })
            );
          }
        }
      } catch {
        setTransactions((prev) => prev.filter((t) => !newTransactions.some((nt) => nt.id === t.id)));
        showToast('Não foi possível salvar os dados do assistente.', false);
        return;
      }
    }

    setHasCompletedOnboarding(true);
    setIsOnboardingOpen(false);
    setActiveTab('inicio');
    showToast('Pronto! Sua primeira projeção futura foi gerada.', false);
  };

  /**
   * Rule 6: Remover "dados de exemplo" do app de produção.
   * resetToSampleData nunca pode apagar dados reais; disponível apenas em DEV com confirmação digitada.
   */
  const resetToSampleData = async () => {
    if (!import.meta.env.DEV) {
      showToast('Ação restrita ao ambiente de desenvolvimento.', false);
      return;
    }

    const confirmation = window.prompt(
      'Atenção: Para carregar dados de exemplo e substituir seus lançamentos atuais em modo de teste, digite "CONFIRMAR":'
    );
    if (confirmation !== 'CONFIRMAR') {
      showToast('Restauração de exemplo cancelada.');
      return;
    }

    const sample = getInitialData();
    setCurrentBalanceState(sample.initialBalance);
    setTransactions(sample.initialTransactions);
    setGoals(sample.initialGoals);
    setProjectionMonths(6);

    if (user && isSupabaseConfigured) {
      try {
        await supabase
          .from('perfis')
          .update({ saldo_atual: sample.initialBalance })
          .eq('id', user.id);

        // Clean existing test data for this user
        await supabase.from('lancamentos').delete().eq('user_id', user.id);
        await supabase.from('cofrinhos').delete().eq('user_id', user.id);

        // Insert sample transactions with .select()
        const txRows = sample.initialTransactions.map((tx) => ({
          user_id: user.id,
          descricao: tx.description,
          valor: tx.amount,
          tipo: tx.type,
          categoria: tx.category,
          recorrencia: tx.recurrence,
          data_inicio: tx.startDate,
          dia_do_mes: tx.dayOfMonth,
          total_parcelas: tx.totalInstallments,
          valor_parcela: tx.installmentAmount,
        }));
        const { data: dbTx } = await supabase.from('lancamentos').insert(txRows).select();
        if (dbTx) {
          setTransactions(
            dbTx.map((row) => ({
              id: row.id,
              user_id: row.user_id,
              description: row.descricao,
              amount: Number(row.valor),
              type: row.tipo as TransactionType,
              category: row.categoria as Category,
              recurrence: row.recorrencia as RecurrenceType,
              startDate: row.data_inicio,
              dayOfMonth: row.dia_do_mes,
              totalInstallments: row.total_parcelas,
              installmentAmount: row.valor_parcela ? Number(row.valor_parcela) : undefined,
              currentInstallment: row.parcela_atual || 1,
            }))
          );
        }

        // Insert sample goals with .select()
        const goalRows = sample.initialGoals.map((g) => ({
          user_id: user.id,
          titulo: g.title,
          valor_alvo: g.targetAmount,
          valor_atual: g.currentAmount,
          data_alvo: g.targetDate,
          categoria: g.category || 'Reserva',
        }));
        const { data: dbGoals } = await supabase.from('cofrinhos').insert(goalRows).select();
        if (dbGoals) {
          setGoals(
            dbGoals.map((row) => ({
              id: row.id,
              user_id: row.user_id,
              title: row.titulo,
              targetAmount: Number(row.valor_alvo),
              currentAmount: Number(row.valor_atual),
              targetDate: row.data_alvo,
              category: row.categoria,
            }))
          );
        }
      } catch (e) {
        console.error('Erro ao resetar para dados de exemplo no Supabase:', e);
      }
    }

    showToast('Dados de exemplo restaurados com sucesso!');
  };

  // Compute projections
  const projectionResults = useMemo(() => {
    return calculateProjection(currentBalance, transactions, projectionMonths);
  }, [currentBalance, transactions, projectionMonths]);

  // Compute upcoming dues
  const upcomingDues = useMemo(() => {
    return getUpcomingDueDates(transactions, new Date(), 5);
  }, [transactions]);

  return (
    <FinanceContext.Provider
      value={{
        currentBalance,
        setCurrentBalance,
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        deleteTransactionWithUndo,
        goals,
        addGoal,
        updateGoal,
        deleteGoal,
        deleteGoalWithUndo,
        contributeToGoal,
        activeTab,
        setActiveTab,
        projectionMonths,
        setProjectionMonths,
        monthlyProjections: projectionResults.monthlyProjections,
        criticalAlert: projectionResults.criticalAlert,
        lowestBalance: projectionResults.lowestBalance,
        upcomingDues,
        isSyncing,
        networkError,
        retrySync,
        toast,
        dismissToast,
        undoLastDelete,
        hasCompletedOnboarding,
        isOnboardingOpen,
        setIsOnboardingOpen,
        completeOnboarding,
        setupFromWizard,
        resetToSampleData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
