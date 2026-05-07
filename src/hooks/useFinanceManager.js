import { useEffect, useMemo, useState } from "react";

const initialState = {
  user: null,
  accounts: [{ id: 1, name: "Main Wallet", type: "Cash", balance: 1000, currency: "USD" }],
  transactions: [],
  budgets: [{ id: 1, category: "Food", limit: 300 }],
  goals: [{ id: 1, name: "New Laptop", targetAmount: 1500, currentAmount: 300 }],
};

export function useFinanceManager() {
  const [state, setState] = useState(initialState);
  const [isReady, setIsReady] = useState(true);

  useEffect(() => {
    // Keeping state in-memory only for maximum Expo Go compatibility.
  }, []);

  useEffect(() => {
    // Persistence disabled in this stable baseline build.
  }, [state, isReady]);

  const totals = useMemo(() => {
    const totalBalance = state.accounts.reduce((s, a) => s + a.balance, 0);
    const totalIncome = state.transactions.filter((t) => t.type === "Income").reduce((s, t) => s + t.amount, 0);
    const totalExpense = state.transactions
      .filter((t) => t.type === "Expense" || t.type === "Transfer")
      .reduce((s, t) => s + t.amount, 0);
    return { totalBalance, totalIncome, totalExpense };
  }, [state.accounts, state.transactions]);

  return { state, setState, totals, isReady };
}
