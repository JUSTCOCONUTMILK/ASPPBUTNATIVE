import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useFinanceManager } from "./src/hooks/useFinanceManager";

const tabs = ["Dashboard", "Transactions", "Accounts", "Budgets", "Goals", "Currency"];
const rates = { USD: 1, EUR: 0.92, RUB: 91.5, GBP: 0.79, KZT: 450, CNY: 7.15, AZN: 1.7 };

export default function App() {
  const { state, setState, totals, isReady } = useFinanceManager();
  const [authMode, setAuthMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [activeTab, setActiveTab] = useState("Dashboard");

  const { user, accounts, transactions, budgets, goals } = state;

  const [txForm, setTxForm] = useState({
    amount: "",
    description: "",
    category: "Other",
    type: "Expense",
    accountId: 1,
    goalId: 1,
  });
  const [accountForm, setAccountForm] = useState({ name: "", balance: "", type: "Cash" });
  const [budgetForm, setBudgetForm] = useState({ category: "Food", limit: "" });
  const [goalForm, setGoalForm] = useState({ name: "", targetAmount: "", currentAmount: "" });
  const [converter, setConverter] = useState({ amount: "100", from: "USD", to: "EUR", result: "" });

  const expenseByCategory = useMemo(() => {
    const map = {};
    transactions
      .filter((t) => t.type === "Expense")
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + t.amount;
      });
    return map;
  }, [transactions]);

  const handleAuth = () => {
    if (!email || !password || (authMode === "register" && !fullName)) return;
    if (authMode === "register") {
      setAuthMode("login");
      setPassword("");
      return;
    }
    setState((prev) => ({ ...prev, user: { fullName: fullName || "User Name", email } }));
  };

  const addTransaction = () => {
    const amount = Number(txForm.amount);
    if (!amount || !txForm.description) return;

    const id = Date.now();
    const next = {
      id,
      amount,
      description: txForm.description,
      category: txForm.category,
      type: txForm.type,
      accountId: Number(txForm.accountId),
      goalId: txForm.type === "Transfer" ? Number(txForm.goalId) : null,
      date: new Date(),
    };
    const nextTransactions = [next, ...transactions];
    const nextAccounts = accounts.map((a) => {
        if (a.id !== next.accountId) return a;
        if (next.type === "Income") return { ...a, balance: a.balance + next.amount };
        return { ...a, balance: a.balance - next.amount };
      });

    let nextGoals = goals;
    if (next.type === "Transfer" && next.goalId) {
      nextGoals = goals.map((g) =>
        g.id === next.goalId ? { ...g, currentAmount: g.currentAmount + next.amount } : g
      );
    }
    setState((prev) => ({ ...prev, transactions: nextTransactions, accounts: nextAccounts, goals: nextGoals }));

    setTxForm({ ...txForm, amount: "", description: "" });
  };

  const deleteTransaction = (id) => {
    const item = transactions.find((t) => t.id === id);
    if (!item) return;
    const nextTransactions = transactions.filter((t) => t.id !== id);
    const nextAccounts = accounts.map((a) => {
        if (a.id !== item.accountId) return a;
        if (item.type === "Income") return { ...a, balance: a.balance - item.amount };
        return { ...a, balance: a.balance + item.amount };
      });
    setState((prev) => ({ ...prev, transactions: nextTransactions, accounts: nextAccounts }));
  };

  const addAccount = () => {
    const balance = Number(accountForm.balance);
    if (!accountForm.name || Number.isNaN(balance)) return;
    setState((prev) => ({
      ...prev,
      accounts: [
        ...prev.accounts,
      { id: Date.now(), name: accountForm.name, balance, type: accountForm.type, currency: "USD" },
      ],
    }));
    setAccountForm({ name: "", balance: "", type: "Cash" });
  };

  const addBudget = () => {
    const limit = Number(budgetForm.limit);
    if (!budgetForm.category || !limit) return;
    setState((prev) => ({
      ...prev,
      budgets: [...prev.budgets, { id: Date.now(), category: budgetForm.category, limit }],
    }));
    setBudgetForm({ category: "Food", limit: "" });
  };

  const addGoal = () => {
    const targetAmount = Number(goalForm.targetAmount);
    const currentAmount = Number(goalForm.currentAmount || 0);
    if (!goalForm.name || !targetAmount) return;
    setState((prev) => ({
      ...prev,
      goals: [...prev.goals, { id: Date.now(), name: goalForm.name, targetAmount, currentAmount }],
    }));
    setGoalForm({ name: "", targetAmount: "", currentAmount: "" });
  };

  const convert = () => {
    const amount = Number(converter.amount);
    const total = (amount / rates[converter.from]) * rates[converter.to];
    setConverter((prev) => ({ ...prev, result: `${amount} ${prev.from} = ${total.toFixed(2)} ${prev.to}` }));
  };

  if (!isReady) {
    return (
      <SafeAreaView style={[styles.screen, styles.center]}>
        <StatusBar style="light" />
        <ActivityIndicator size="large" color="#3b82f6" />
        <Text style={styles.muted}>Loading data...</Text>
      </SafeAreaView>
    );
  }

  if (!user) {
    return (
      <SafeAreaView style={styles.screen}>
        <StatusBar style="light" />
        <View style={styles.authCard}>
          <Text style={styles.title}>{authMode === "login" ? "Welcome Back" : "Create Account"}</Text>
          <Text style={styles.sub}>Login to manage your finances</Text>
          {authMode === "register" && (
            <TextInput
              value={fullName}
              onChangeText={setFullName}
              placeholder="Full name"
              placeholderTextColor="#9ca3af"
              style={styles.input}
            />
          )}
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="email@pro.com"
            placeholderTextColor="#9ca3af"
            keyboardType="email-address"
            autoCapitalize="none"
            style={styles.input}
          />
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="Password"
            placeholderTextColor="#9ca3af"
            secureTextEntry
            style={styles.input}
          />
          <TouchableOpacity style={styles.btnPrimary} onPress={handleAuth}>
            <Text style={styles.btnText}>{authMode === "login" ? "Login" : "Register"}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.btnGhost}
            onPress={() => setAuthMode((m) => (m === "login" ? "register" : "login"))}
          >
            <Text style={styles.btnGhostText}>
              {authMode === "login" ? "Don't have an account? Register" : "Already have an account? Login"}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.screen}>
      <StatusBar style="light" />
      <View style={styles.header}>
        <Text style={styles.logo}>FinancePro Native</Text>
        <TouchableOpacity onPress={() => setState((prev) => ({ ...prev, user: null }))}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabs}>
        {tabs.map((tab) => (
          <TouchableOpacity
            key={tab}
            onPress={() => setActiveTab(tab)}
            style={[styles.tabBtn, activeTab === tab && styles.tabBtnActive]}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.content}>
        {activeTab === "Dashboard" && (
          <View>
            <View style={styles.row}>
              <Card title="Total Balance" value={`$${totals.totalBalance.toFixed(2)}`} />
              <Card title="Total Income" value={`$${totals.totalIncome.toFixed(2)}`} />
              <Card title="Total Expenses" value={`$${totals.totalExpense.toFixed(2)}`} />
            </View>
            <Panel title="Expenses by Category">
              {Object.keys(expenseByCategory).length === 0 && <Text style={styles.muted}>No data yet</Text>}
              {Object.entries(expenseByCategory).map(([category, amount]) => (
                <View key={category} style={styles.progressWrap}>
                  <Text style={styles.text}>{category}</Text>
                  <View style={styles.progressBg}>
                    <View style={[styles.progressFill, { width: `${Math.min((amount / 500) * 100, 100)}%` }]} />
                  </View>
                  <Text style={styles.text}>${amount.toFixed(2)}</Text>
                </View>
              ))}
            </Panel>
          </View>
        )}

        {activeTab === "Transactions" && (
          <Panel title="Transaction History">
            <Input label="Description" value={txForm.description} onChangeText={(v) => setTxForm({ ...txForm, description: v })} />
            <Input label="Amount" value={txForm.amount} onChangeText={(v) => setTxForm({ ...txForm, amount: v })} keyboardType="numeric" />
            <SelectRow
              label="Type"
              options={[
                { label: "Expense", value: "Expense" },
                { label: "Income", value: "Income" },
                { label: "Transfer to Savings", value: "Transfer" },
              ]}
              value={txForm.type}
              onChange={(v) => setTxForm({ ...txForm, type: v })}
            />
            <SelectRow
              label="Category"
              options={["Food", "Rent", "Salary", "Shopping", "Travel", "Other"].map((c) => ({ label: c, value: c }))}
              value={txForm.category}
              onChange={(v) => setTxForm({ ...txForm, category: v })}
            />
            <SelectRow
              label="Account"
              options={accounts.map((a) => ({ label: a.name, value: a.id }))}
              value={txForm.accountId}
              onChange={(v) => setTxForm({ ...txForm, accountId: v })}
            />
            {txForm.type === "Transfer" && (
              <SelectRow
                label="Goal"
                options={goals.map((g) => ({ label: g.name, value: g.id }))}
                value={txForm.goalId}
                onChange={(v) => setTxForm({ ...txForm, goalId: v })}
              />
            )}
            <TouchableOpacity style={styles.btnPrimary} onPress={addTransaction}>
              <Text style={styles.btnText}>Add Transaction</Text>
            </TouchableOpacity>

            {transactions.map((t) => (
              <View key={t.id} style={styles.listItem}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.text}>{t.description}</Text>
                  <Text style={styles.muted}>
                    {new Date(t.date).toLocaleDateString()} - {t.category}
                  </Text>
                </View>
                <Text style={[styles.amount, t.type === "Income" ? styles.income : styles.expense]}>
                  {t.type === "Income" ? "+" : "-"}${t.amount.toFixed(2)}
                </Text>
                <TouchableOpacity onPress={() => deleteTransaction(t.id)}>
                  <Text style={styles.delete}>Delete</Text>
                </TouchableOpacity>
              </View>
            ))}
          </Panel>
        )}

        {activeTab === "Accounts" && (
          <Panel title="Manage Accounts">
            <Input label="Account name" value={accountForm.name} onChangeText={(v) => setAccountForm({ ...accountForm, name: v })} />
            <Input
              label="Initial balance"
              value={accountForm.balance}
              onChangeText={(v) => setAccountForm({ ...accountForm, balance: v })}
              keyboardType="numeric"
            />
            <SelectRow
              label="Type"
              options={["Cash", "Bank", "Card", "Savings"].map((t) => ({ label: t, value: t }))}
              value={accountForm.type}
              onChange={(v) => setAccountForm({ ...accountForm, type: v })}
            />
            <TouchableOpacity style={styles.btnPrimary} onPress={addAccount}>
              <Text style={styles.btnText}>Create Account</Text>
            </TouchableOpacity>
            {accounts.map((a) => (
              <View key={a.id} style={styles.listItem}>
                <Text style={styles.text}>{a.name}</Text>
                <Text style={styles.text}>${a.balance.toFixed(2)}</Text>
              </View>
            ))}
          </Panel>
        )}

        {activeTab === "Budgets" && (
          <Panel title="Monthly Budgets">
            <SelectRow
              label="Category"
              options={["Food", "Rent", "Shopping", "Travel", "Other"].map((c) => ({ label: c, value: c }))}
              value={budgetForm.category}
              onChange={(v) => setBudgetForm({ ...budgetForm, category: v })}
            />
            <Input label="Limit" value={budgetForm.limit} onChangeText={(v) => setBudgetForm({ ...budgetForm, limit: v })} keyboardType="numeric" />
            <TouchableOpacity style={styles.btnPrimary} onPress={addBudget}>
              <Text style={styles.btnText}>Set Budget</Text>
            </TouchableOpacity>
            {budgets.map((b) => {
              const spent = transactions
                .filter((t) => t.category === b.category && (t.type === "Expense" || t.type === "Transfer"))
                .reduce((s, t) => s + t.amount, 0);
              const percentage = Math.min((spent / b.limit) * 100, 100);
              return (
                <View key={b.id} style={styles.budgetItem}>
                  <Text style={styles.text}>
                    {b.category}: ${spent.toFixed(0)} / ${b.limit}
                  </Text>
                  <View style={styles.progressBg}>
                    <View style={[styles.progressFill, { width: `${percentage}%` }]} />
                  </View>
                </View>
              );
            })}
          </Panel>
        )}

        {activeTab === "Goals" && (
          <Panel title="Savings Goals">
            <Input label="Goal name" value={goalForm.name} onChangeText={(v) => setGoalForm({ ...goalForm, name: v })} />
            <Input
              label="Target amount"
              value={goalForm.targetAmount}
              onChangeText={(v) => setGoalForm({ ...goalForm, targetAmount: v })}
              keyboardType="numeric"
            />
            <Input
              label="Current amount"
              value={goalForm.currentAmount}
              onChangeText={(v) => setGoalForm({ ...goalForm, currentAmount: v })}
              keyboardType="numeric"
            />
            <TouchableOpacity style={styles.btnPrimary} onPress={addGoal}>
              <Text style={styles.btnText}>Track Goal</Text>
            </TouchableOpacity>
            {goals.map((g) => {
              const percentage = Math.min((g.currentAmount / g.targetAmount) * 100, 100);
              return (
                <View key={g.id} style={styles.budgetItem}>
                  <Text style={styles.text}>
                    {g.name}: ${g.currentAmount} / ${g.targetAmount}
                  </Text>
                  <View style={styles.progressBg}>
                    <View style={[styles.progressFill, { width: `${percentage}%` }]} />
                  </View>
                </View>
              );
            })}
          </Panel>
        )}

        {activeTab === "Currency" && (
          <Panel title="Currency Converter">
            <Input
              label="Amount"
              value={converter.amount}
              onChangeText={(v) => setConverter({ ...converter, amount: v })}
              keyboardType="numeric"
            />
            <SelectRow
              label="From"
              options={Object.keys(rates).map((c) => ({ label: c, value: c }))}
              value={converter.from}
              onChange={(v) => setConverter({ ...converter, from: v })}
            />
            <SelectRow
              label="To"
              options={Object.keys(rates).map((c) => ({ label: c, value: c }))}
              value={converter.to}
              onChange={(v) => setConverter({ ...converter, to: v })}
            />
            <TouchableOpacity style={styles.btnPrimary} onPress={convert}>
              <Text style={styles.btnText}>Convert</Text>
            </TouchableOpacity>
            <Text style={styles.text}>{converter.result}</Text>
          </Panel>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function Card({ title, value }) {
  return (
    <View style={styles.card}>
      <Text style={styles.muted}>{title}</Text>
      <Text style={styles.cardValue}>{value}</Text>
    </View>
  );
}

function Panel({ title, children }) {
  return (
    <View style={styles.panel}>
      <Text style={styles.panelTitle}>{title}</Text>
      {children}
    </View>
  );
}

function Input({ label, ...props }) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput placeholderTextColor="#9ca3af" style={styles.input} {...props} />
    </>
  );
}

function SelectRow({ label, options, value, onChange }) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.optionRow}>
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <TouchableOpacity
              key={`${label}-${String(opt.value)}`}
              onPress={() => onChange(opt.value)}
              style={[styles.optionBtn, active && styles.optionBtnActive]}
            >
              <Text style={[styles.optionText, active && styles.optionTextActive]}>{opt.label}</Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: "#030712" },
  center: { alignItems: "center", justifyContent: "center", gap: 12 },
  authCard: { margin: 16, marginTop: 48, padding: 18, borderRadius: 16, backgroundColor: "#111827" },
  title: { color: "#fff", fontSize: 24, fontWeight: "700" },
  sub: { color: "#9ca3af", marginTop: 8, marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#374151",
    backgroundColor: "#1f2937",
    color: "#fff",
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  btnPrimary: { backgroundColor: "#2563eb", padding: 12, borderRadius: 10, marginTop: 4, alignItems: "center" },
  btnText: { color: "#fff", fontWeight: "700" },
  btnGhost: { marginTop: 10, alignItems: "center" },
  btnGhostText: { color: "#93c5fd" },
  header: { paddingHorizontal: 16, paddingTop: 12, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  logo: { color: "#fff", fontSize: 20, fontWeight: "700" },
  logout: { color: "#fda4af" },
  tabs: { maxHeight: 48, marginTop: 10, paddingHorizontal: 8 },
  tabBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    marginHorizontal: 4,
    borderRadius: 999,
    backgroundColor: "#111827",
  },
  tabBtnActive: { backgroundColor: "#1d4ed8" },
  tabText: { color: "#9ca3af", fontWeight: "600" },
  tabTextActive: { color: "#fff" },
  content: { padding: 14, paddingBottom: 80 },
  row: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  card: { width: "31%", minWidth: 105, padding: 12, borderRadius: 12, backgroundColor: "#111827" },
  cardValue: { color: "#fff", marginTop: 6, fontSize: 16, fontWeight: "700" },
  panel: { backgroundColor: "#111827", borderRadius: 14, padding: 14, marginTop: 10 },
  panelTitle: { color: "#fff", fontSize: 17, fontWeight: "700", marginBottom: 10 },
  label: { color: "#cbd5e1", marginBottom: 6, marginTop: 2 },
  optionRow: { marginBottom: 10 },
  optionBtn: {
    backgroundColor: "#1f2937",
    borderWidth: 1,
    borderColor: "#374151",
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginRight: 8,
  },
  optionBtnActive: { backgroundColor: "#2563eb", borderColor: "#2563eb" },
  optionText: { color: "#cbd5e1", fontWeight: "600" },
  optionTextActive: { color: "#fff" },
  text: { color: "#fff" },
  muted: { color: "#9ca3af" },
  listItem: {
    borderTopWidth: 1,
    borderTopColor: "#1f2937",
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  amount: { fontWeight: "700" },
  income: { color: "#4ade80" },
  expense: { color: "#f87171" },
  delete: { color: "#fda4af" },
  budgetItem: { marginBottom: 10 },
  progressWrap: { marginBottom: 8 },
  progressBg: { backgroundColor: "#374151", height: 8, borderRadius: 99, marginVertical: 6 },
  progressFill: { backgroundColor: "#3b82f6", height: "100%", borderRadius: 99 },
});
