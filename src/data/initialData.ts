import { Transaction, Goal } from '../types/finance';

/**
 * Creates sample data with dynamic dates relative to current date
 */
export function getInitialData(): {
  initialBalance: number;
  initialTransactions: Transaction[];
  initialGoals: Goal[];
} {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  // Format helper
  const makeDate = (mOffset: number, day: number) => {
    const d = new Date(year, month + mOffset, day);
    const yStr = d.getFullYear();
    const mStr = String(d.getMonth() + 1).padStart(2, '0');
    const dStr = String(d.getDate()).padStart(2, '0');
    return `${yStr}-${mStr}-${dStr}`;
  };

  const initialTransactions: Transaction[] = [
    {
      id: 'tx-1-salario',
      description: 'Salário CLT Líquido',
      amount: 4850.0,
      type: 'income',
      category: 'Salário',
      recurrence: 'monthly',
      startDate: makeDate(-1, 5),
      dayOfMonth: 5,
    },
    {
      id: 'tx-2-aluguel',
      description: 'Aluguel + Condomínio',
      amount: 1750.0,
      type: 'expense',
      category: 'Moradia',
      recurrence: 'monthly',
      startDate: makeDate(-1, 10),
      dayOfMonth: 10,
    },
    {
      id: 'tx-3-smartphone',
      description: 'Smartphone Galaxy 5G',
      amount: 2400.0,
      type: 'expense',
      category: 'Cartão e Parcelas',
      recurrence: 'installment',
      startDate: makeDate(-2, 15), // started 2 months ago
      dayOfMonth: 15,
      totalInstallments: 10,
      installmentAmount: 240.0,
      currentInstallment: 1, // calculated dynamically in projections
    },
    {
      id: 'tx-4-streaming',
      description: 'Netflix + Spotify Duo',
      amount: 74.8,
      type: 'expense',
      category: 'Lazer e Assinaturas',
      recurrence: 'monthly',
      startDate: makeDate(-3, 22),
      dayOfMonth: 22,
    },
    {
      id: 'tx-5-mercado',
      description: 'Supermercado e Feira',
      amount: 1300.0,
      type: 'expense',
      category: 'Alimentação',
      recurrence: 'monthly',
      startDate: makeDate(-1, 8),
      dayOfMonth: 8,
    },
    {
      id: 'tx-6-luz-internet',
      description: 'Internet Fibra e Luz',
      amount: 290.0,
      type: 'expense',
      category: 'Contas e Serviços',
      recurrence: 'monthly',
      startDate: makeDate(-1, 20),
      dayOfMonth: 20,
    },
    {
      id: 'tx-7-freela',
      description: 'Consultoria / Freelance',
      amount: 800.0,
      type: 'income',
      category: 'Freelance',
      recurrence: 'once',
      startDate: makeDate(1, 18), // next month
      dayOfMonth: 18,
    },
  ];

  const initialGoals: Goal[] = [
    {
      id: 'goal-1',
      title: 'Reserva de Emergência',
      targetAmount: 8000.0,
      currentAmount: 3200.0,
      targetDate: makeDate(6, 1),
      category: 'Segurança',
      createdAt: makeDate(-2, 1),
    },
    {
      id: 'goal-2',
      title: 'Viagem de Fim de Ano',
      targetAmount: 3500.0,
      currentAmount: 1100.0,
      targetDate: makeDate(8, 20),
      category: 'Lazer',
      createdAt: makeDate(-1, 15),
    },
  ];

  return {
    initialBalance: 2450.0,
    initialTransactions,
    initialGoals,
  };
}
