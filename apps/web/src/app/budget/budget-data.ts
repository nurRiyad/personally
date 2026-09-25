export type BudgetGroup = string;
export type Expense = {
  id: string;
  amount: number;
  date: string;
  note?: string;
};
export type Income = {
  id: string;
  amount: number;
  date: string;
  note?: string;
};
export type BudgetItem = {
  id: string;
  name: string;
  group: BudgetGroup;
  planned: number;
  recurring: boolean;
  expenses: Expense[];
};
export type IncomeBlock = {
  id: string;
  name: string;
  planned: number;
  recurring: boolean;
  income: Income[];
};
export type ShoppingItem = {
  id: string;
  name: string;
  amount: number;
  purchased: boolean;
};
export type BudgetMonth = {
  key: string;
  incomeBlocks: IncomeBlock[];
  items: BudgetItem[];
  shopping: ShoppingItem[];
  note: string;
  cashInPocket: number;
};
export const monthLabel = (key: string) =>
  new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(
    new Date(`${key}-01T00:00:00`),
  );
export const currency = (amount: number) =>
  new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace('BDT', '৳');
export const totalSpent = (item: BudgetItem) =>
  item.expenses.reduce((total, expense) => total + expense.amount, 0);
export const totalPlanned = (month: BudgetMonth) =>
  month.items.reduce((total, item) => total + item.planned, 0);
export const totalSpentForMonth = (month: BudgetMonth) =>
  month.items.reduce((total, item) => total + totalSpent(item), 0);
export const totalPlannedIncome = (month: BudgetMonth) =>
  month.incomeBlocks.reduce((total, block) => total + block.planned, 0);
export const totalIncome = (month: BudgetMonth) =>
  month.incomeBlocks.reduce(
    (total, block) =>
      total + block.income.reduce((sum, entry) => sum + entry.amount, 0),
    0,
  );
export const percentage = (spent: number, planned: number) =>
  planned === 0 ? 0 : Math.min(100, Math.round((spent / planned) * 100));
