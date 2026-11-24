export type TransactionType = 'income' | 'expense';

export type RecurrenceType = 'once' | 'monthly' | 'installment';

export type Category =
  | 'Salário'
  | 'Freelance'
  | 'Investimentos'
  | 'Outras Receitas'
  | 'Moradia'
  | 'Alimentação'
  | 'Transporte'
  | 'Contas e Serviços'
  | 'Cartão e Parcelas'
  | 'Lazer e Assinaturas'
  | 'Saúde'
  | 'Educação'
  | 'Outros Gastos';

export interface Transaction {
  id: string;
  user_id?: string;
  description: string;
  amount: number; // in BRL, positive number
  type: TransactionType;
  category: Category;
  recurrence: RecurrenceType;
  startDate: string; // YYYY-MM-DD
  dayOfMonth?: number; // 1-31
  // For installment transactions:
  totalInstallments?: number; // e.g. 10
  installmentAmount?: number; // amount of each installment
  currentInstallment?: number; // starts at 1
  created_at?: string;
}

export interface Goal {
  id: string;
  user_id?: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  targetDate: string; // YYYY-MM-DD
  category?: string;
  createdAt?: string;
}

export interface GoalMovement {
  id: string;
  user_id: string;
  cofrinho_id: string;
  valor: number;
  tipo: 'deposito' | 'resgate';
  data: string;
}

export interface UserProfile {
  id: string;
  email: string;
  nome?: string;
  saldo_atual: number;
  onboarding_concluido: boolean;
  avatar_url?: string;
  created_at?: string;
}

export interface MonthProjection {
  monthKey: string; // "2026-11"
  monthLabel: string; // "Nov 2026"
  shortLabel: string; // "Nov"
  isCurrentMonth: boolean;
  startingBalance: number;
  totalIncome: number;
  totalExpense: number;
  netChange: number;
  endingBalance: number;
  lowestProjectedBalance: number;
  hasNegativeBalance: boolean;
  firstNegativeDate?: string;
  negativeAmount?: number;
  transactions: ProjectedOccurrence[];
}

export interface ProjectedOccurrence {
  id: string;
  transactionId: string;
  description: string;
  amount: number;
  type: TransactionType;
  category: Category;
  date: string; // YYYY-MM-DD
  formattedDate: string;
  installmentInfo?: {
    current: number;
    total: number;
  };
  recurrence: RecurrenceType;
}

export interface SimulationConfig {
  type: 'purchase' | 'saving' | 'extra_income';
  name: string;
  amount: number;
  installments: number;
  isMonthly: boolean;
  startMonthOffset: number; // 0 = this month, 1 = next month
}

export interface WizardSetupData {
  currentBalance: number;
  salary: number;
  salaryDay: number;
  bills: Array<{
    description: string;
    amount: number;
    category: Category;
    dayOfMonth: number;
  }>;
}
