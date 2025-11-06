export const EXPENSE_CATEGORIES = [
  { value: "Groceries", label: "🛒 Groceries", color: "hsl(var(--chart-1))" },
  { value: "Shopping", label: "🛍️ Shopping", color: "hsl(var(--chart-2))" },
  { value: "Education", label: "📚 Education", color: "hsl(var(--chart-3))" },
  { value: "Transport", label: "🚗 Transport", color: "hsl(var(--chart-4))" },
  { value: "Dining", label: "🍽️ Dining", color: "hsl(var(--chart-5))" },
  { value: "Utilities", label: "💡 Utilities", color: "hsl(var(--chart-6))" },
  { value: "Entertainment", label: "🎬 Entertainment", color: "hsl(var(--chart-7))" },
  { value: "Health", label: "🏥 Health", color: "hsl(var(--chart-8))" },
  { value: "Rent", label: "🏠 Rent", color: "hsl(var(--chart-9))" },
  { value: "Insurance", label: "🛡️ Insurance", color: "hsl(var(--chart-10))" },
  { value: "Gifts", label: "🎁 Gifts", color: "hsl(var(--chart-11))" },
  { value: "Other", label: "📦 Other", color: "hsl(var(--chart-12))" }
] as const;

export const PAYMENT_METHODS = [
  { value: "Cash", label: "💵 Cash" },
  { value: "Credit Card", label: "💳 Credit Card" },
  { value: "Debit Card", label: "💳 Debit Card" },
  { value: "UPI", label: "📱 UPI" },
  { value: "Bank Transfer", label: "🏦 Bank Transfer" },
  { value: "Other", label: "💰 Other" }
] as const;

export const getCategoryColor = (category: string) => {
  const cat = EXPENSE_CATEGORIES.find(c => c.value === category);
  return cat?.color || "hsl(var(--chart-12))";
};
