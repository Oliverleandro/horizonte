import { Transaction, MonthProjection, ProjectedOccurrence, SimulationConfig } from '../types/finance';
import { formatShortMonth, formatDateBR } from './formatters';
import { roundMoney, addMoney, subtractMoney, divideMoney } from './money';

/**
 * Calculates monthly projection for 3, 6, or 12 months based on current balance and transactions.
 * Also identifies exact dates where balance dips into negative.
 */
export function calculateProjection(
  currentBalance: number,
  transactions: Transaction[],
  monthsCount: number = 6,
  baseDate: Date = new Date()
): {
  monthlyProjections: MonthProjection[];
  criticalAlert: {
    isNegative: boolean;
    date?: string;
    formattedDate?: string;
    amount?: number;
    monthIndex?: number;
    daysUntil?: number;
  } | null;
  lowestBalance: {
    amount: number;
    month: string;
    date: string;
  };
} {
  const monthlyProjections: MonthProjection[] = [];
  let runningBalance = roundMoney(currentBalance);
  let criticalAlert: {
    isNegative: boolean;
    date?: string;
    formattedDate?: string;
    amount?: number;
    monthIndex?: number;
    daysUntil?: number;
  } | null = null;

  let lowestBalance = {
    amount: runningBalance,
    month: formatShortMonth(baseDate),
    date: baseDate.toISOString().slice(0, 10),
  };

  const currentYear = baseDate.getFullYear();
  const currentMonthIndex = baseDate.getMonth(); // 0-11
  const currentDay = baseDate.getDate();

  for (let i = 0; i < monthsCount; i++) {
    const targetMonthDate = new Date(currentYear, currentMonthIndex + i, 1);
    const targetYear = targetMonthDate.getFullYear();
    const targetMonth = targetMonthDate.getMonth(); // 0-11
    const monthKey = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}`;
    const daysInMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

    const isCurrentMonth = i === 0;
    const startBalanceForMonth = runningBalance;

    const monthOccurrences: ProjectedOccurrence[] = [];

    transactions.forEach((tx) => {
      const [txYear, txMonth, txDay] = tx.startDate.split('-').map(Number);
      const txStartMonthDate = new Date(txYear, txMonth - 1, 1);

      if (tx.recurrence === 'once') {
        if (txYear === targetYear && txMonth - 1 === targetMonth) {
          if (!isCurrentMonth || txDay >= currentDay) {
            monthOccurrences.push({
              id: `${tx.id}-${monthKey}`,
              transactionId: tx.id,
              description: tx.description,
              amount: roundMoney(tx.amount),
              type: tx.type,
              category: tx.category,
              date: tx.startDate,
              formattedDate: formatDateBR(tx.startDate),
              recurrence: 'once',
            });
          }
        }
      } else if (tx.recurrence === 'monthly') {
        const hasStarted = targetMonthDate >= txStartMonthDate;
        if (hasStarted) {
          const effectiveDay = Math.min(tx.dayOfMonth || txDay || 1, daysInMonth);
          const occurrenceDate = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(effectiveDay).padStart(2, '0')}`;

          if (!isCurrentMonth || effectiveDay >= currentDay) {
            monthOccurrences.push({
              id: `${tx.id}-${monthKey}`,
              transactionId: tx.id,
              description: tx.description,
              amount: roundMoney(tx.amount),
              type: tx.type,
              category: tx.category,
              date: occurrenceDate,
              formattedDate: formatDateBR(occurrenceDate),
              recurrence: 'monthly',
            });
          }
        }
      } else if (tx.recurrence === 'installment') {
        const totalInstallments = tx.totalInstallments || 1;
        const installmentAmount = tx.installmentAmount !== undefined
          ? roundMoney(tx.installmentAmount)
          : divideMoney(tx.amount, totalInstallments);
        const startInstallment = tx.currentInstallment || 1;

        const monthDiff = (targetYear - txYear) * 12 + (targetMonth - (txMonth - 1));
        const currentInstNumber = startInstallment + monthDiff;

        if (monthDiff >= 0 && currentInstNumber <= totalInstallments) {
          const effectiveDay = Math.min(tx.dayOfMonth || txDay || 1, daysInMonth);
          const occurrenceDate = `${targetYear}-${String(targetMonth + 1).padStart(2, '0')}-${String(effectiveDay).padStart(2, '0')}`;

          if (!isCurrentMonth || effectiveDay >= currentDay) {
            monthOccurrences.push({
              id: `${tx.id}-${monthKey}-p${currentInstNumber}`,
              transactionId: tx.id,
              description: `${tx.description} (${currentInstNumber}/${totalInstallments})`,
              amount: installmentAmount,
              type: tx.type,
              category: tx.category,
              date: occurrenceDate,
              formattedDate: formatDateBR(occurrenceDate),
              installmentInfo: {
                current: currentInstNumber,
                total: totalInstallments,
              },
              recurrence: 'installment',
            });
          }
        }
      }
    });

    monthOccurrences.sort((a, b) => a.date.localeCompare(b.date));

    let totalIncome = 0;
    let totalExpense = 0;
    let monthMinBalance = startBalanceForMonth;
    let hasMonthNegative = false;
    let firstNegDateInMonth: string | undefined;
    let firstNegAmountInMonth: number | undefined;

    let dayRunningBalance = startBalanceForMonth;

    for (const occ of monthOccurrences) {
      if (occ.type === 'income') {
        totalIncome = addMoney(totalIncome, occ.amount);
        dayRunningBalance = addMoney(dayRunningBalance, occ.amount);
      } else {
        totalExpense = addMoney(totalExpense, occ.amount);
        dayRunningBalance = subtractMoney(dayRunningBalance, occ.amount);
      }

      if (dayRunningBalance < monthMinBalance) {
        monthMinBalance = dayRunningBalance;
      }

      if (dayRunningBalance < lowestBalance.amount) {
        lowestBalance = {
          amount: dayRunningBalance,
          month: formatShortMonth(targetMonthDate),
          date: occ.date,
        };
      }

      if (dayRunningBalance < 0 && !hasMonthNegative) {
        hasMonthNegative = true;
        firstNegDateInMonth = occ.date;
        firstNegAmountInMonth = dayRunningBalance;

        if (!criticalAlert) {
          const [ny, nm, nd] = occ.date.split('-').map(Number);
          const negDateObj = new Date(ny, nm - 1, nd);
          const diffDays = Math.ceil((negDateObj.getTime() - baseDate.getTime()) / (1000 * 60 * 60 * 24));

          criticalAlert = {
            isNegative: true,
            date: occ.date,
            formattedDate: formatDateBR(occ.date),
            amount: dayRunningBalance,
            monthIndex: i,
            daysUntil: Math.max(0, diffDays),
          };
        }
      }
    }

    const netChange = subtractMoney(totalIncome, totalExpense);
    runningBalance = addMoney(runningBalance, netChange);

    monthlyProjections.push({
      monthKey,
      monthLabel: formatShortMonth(targetMonthDate),
      shortLabel: targetMonthDate.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', ''),
      isCurrentMonth,
      startingBalance: startBalanceForMonth,
      totalIncome,
      totalExpense,
      netChange,
      endingBalance: runningBalance,
      lowestProjectedBalance: monthMinBalance,
      hasNegativeBalance: hasMonthNegative || runningBalance < 0,
      firstNegativeDate: firstNegDateInMonth,
      negativeAmount: firstNegAmountInMonth,
      transactions: monthOccurrences,
    });
  }

  return {
    monthlyProjections,
    criticalAlert,
    lowestBalance,
  };
}

/**
 * Returns upcoming 5 due dates from today onwards across all transactions.
 */
export function getUpcomingDueDates(
  transactions: Transaction[],
  baseDate: Date = new Date(),
  limit: number = 5
): ProjectedOccurrence[] {
  const occurrences: ProjectedOccurrence[] = [];
  const currentYear = baseDate.getFullYear();
  const currentMonth = baseDate.getMonth();
  const todayStr = baseDate.toISOString().slice(0, 10);

  for (let m = 0; m < 4; m++) {
    const targetMonthDate = new Date(currentYear, currentMonth + m, 1);
    const targetYear = targetMonthDate.getFullYear();
    const tMonth = targetMonthDate.getMonth();
    const daysInMonth = new Date(targetYear, tMonth + 1, 0).getDate();

    transactions.forEach((tx) => {
      const [txYear, txMonth, txDay] = tx.startDate.split('-').map(Number);
      const txStartMonthDate = new Date(txYear, txMonth - 1, 1);

      if (tx.recurrence === 'once') {
        if (txYear === targetYear && txMonth - 1 === tMonth && tx.startDate >= todayStr) {
          occurrences.push({
            id: `${tx.id}-${tx.startDate}`,
            transactionId: tx.id,
            description: tx.description,
            amount: roundMoney(tx.amount),
            type: tx.type,
            category: tx.category,
            date: tx.startDate,
            formattedDate: formatDateBR(tx.startDate),
            recurrence: 'once',
          });
        }
      } else if (tx.recurrence === 'monthly') {
        if (targetMonthDate >= txStartMonthDate) {
          const effectiveDay = Math.min(tx.dayOfMonth || txDay || 1, daysInMonth);
          const dateStr = `${targetYear}-${String(tMonth + 1).padStart(2, '0')}-${String(effectiveDay).padStart(2, '0')}`;
          if (dateStr >= todayStr) {
            occurrences.push({
              id: `${tx.id}-${dateStr}`,
              transactionId: tx.id,
              description: tx.description,
              amount: roundMoney(tx.amount),
              type: tx.type,
              category: tx.category,
              date: dateStr,
              formattedDate: formatDateBR(dateStr),
              recurrence: 'monthly',
            });
          }
        }
      } else if (tx.recurrence === 'installment') {
        const totalInstallments = tx.totalInstallments || 1;
        const installmentAmount = tx.installmentAmount !== undefined
          ? roundMoney(tx.installmentAmount)
          : divideMoney(tx.amount, totalInstallments);
        const startInstallment = tx.currentInstallment || 1;

        const monthDiff = (targetYear - txYear) * 12 + (tMonth - (txMonth - 1));
        const currentInstNumber = startInstallment + monthDiff;

        if (monthDiff >= 0 && currentInstNumber <= totalInstallments) {
          const effectiveDay = Math.min(tx.dayOfMonth || txDay || 1, daysInMonth);
          const dateStr = `${targetYear}-${String(tMonth + 1).padStart(2, '0')}-${String(effectiveDay).padStart(2, '0')}`;
          if (dateStr >= todayStr) {
            occurrences.push({
              id: `${tx.id}-${dateStr}`,
              transactionId: tx.id,
              description: `${tx.description} (${currentInstNumber}/${totalInstallments})`,
              amount: installmentAmount,
              type: tx.type,
              category: tx.category,
              date: dateStr,
              formattedDate: formatDateBR(dateStr),
              installmentInfo: {
                current: currentInstNumber,
                total: totalInstallments,
              },
              recurrence: 'installment',
            });
          }
        }
      }
    });
  }

  const uniqueOccurrences = Array.from(new Map(occurrences.map((item) => [item.id, item])).values());
  uniqueOccurrences.sort((a, b) => a.date.localeCompare(b.date));

  return uniqueOccurrences.slice(0, limit);
}

/**
 * Calculates simulated projection comparing original vs simulated scenario.
 */
export function calculateSimulation(
  currentBalance: number,
  transactions: Transaction[],
  simConfig: SimulationConfig,
  monthsCount: number = 6,
  baseDate: Date = new Date()
) {
  const baseline = calculateProjection(currentBalance, transactions, monthsCount, baseDate);

  const simulatedTransactions = [...transactions];
  const targetYear = baseDate.getFullYear();
  const targetMonth = baseDate.getMonth() + simConfig.startMonthOffset;
  const startSimDate = new Date(targetYear, targetMonth, 15);
  const startSimDateStr = startSimDate.toISOString().slice(0, 10);

  const roundedAmount = roundMoney(simConfig.amount);

  if (simConfig.type === 'purchase') {
    if (simConfig.installments > 1) {
      simulatedTransactions.push({
        id: 'simulated-purchase',
        description: simConfig.name || 'Nova Compra Simulada',
        amount: roundedAmount,
        type: 'expense',
        category: 'Cartão e Parcelas',
        recurrence: 'installment',
        startDate: startSimDateStr,
        dayOfMonth: 15,
        totalInstallments: simConfig.installments,
        installmentAmount: divideMoney(roundedAmount, simConfig.installments),
        currentInstallment: 1,
      });
    } else {
      simulatedTransactions.push({
        id: 'simulated-purchase',
        description: simConfig.name || 'Nova Compra Simulada',
        amount: roundedAmount,
        type: 'expense',
        category: 'Outros Gastos',
        recurrence: 'once',
        startDate: startSimDateStr,
        dayOfMonth: 15,
      });
    }
  } else if (simConfig.type === 'saving') {
    simulatedTransactions.push({
      id: 'simulated-saving',
      description: simConfig.name || 'Economia Mensal',
      amount: roundedAmount,
      type: 'income',
      category: 'Investimentos',
      recurrence: 'monthly',
      startDate: startSimDateStr,
      dayOfMonth: 1,
    });
  } else if (simConfig.type === 'extra_income') {
    simulatedTransactions.push({
      id: 'simulated-income',
      description: simConfig.name || 'Renda Extra',
      amount: roundedAmount,
      type: 'income',
      category: 'Freelance',
      recurrence: simConfig.isMonthly ? 'monthly' : 'once',
      startDate: startSimDateStr,
      dayOfMonth: 5,
    });
  }

  const simulated = calculateProjection(currentBalance, simulatedTransactions, monthsCount, baseDate);

  const chartData = baseline.monthlyProjections.map((baseMonth, idx) => {
    const simMonth = simulated.monthlyProjections[idx];
    const endingSim = simMonth ? simMonth.endingBalance : baseMonth.endingBalance;
    return {
      monthKey: baseMonth.monthKey,
      monthLabel: baseMonth.monthLabel,
      shortLabel: baseMonth.shortLabel,
      saldoAtual: baseMonth.endingBalance,
      saldoSimulado: endingSim,
      diferenca: subtractMoney(endingSim, baseMonth.endingBalance),
      isNegativeOriginal: baseMonth.endingBalance < 0,
      isNegativeSimulado: endingSim < 0,
    };
  });

  return {
    baseline,
    simulated,
    chartData,
  };
}
