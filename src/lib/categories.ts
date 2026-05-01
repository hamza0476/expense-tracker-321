export type CategoryDef = {
  value: string;
  label: string;
  emoji: string;
  color: string;
  parent?: string;
};

// Default (built-in) categories — kept backward compatible.
// `label` retains the existing "🛒 Groceries" emoji-prefixed format used across the app.
export const EXPENSE_CATEGORIES: CategoryDef[] = [
  { value: "Groceries", label: "🛒 Groceries", emoji: "🛒", color: "hsl(var(--chart-1))", parent: "Food" },
  { value: "Shopping", label: "🛍️ Shopping", emoji: "🛍️", color: "hsl(var(--chart-2))", parent: "Shopping" },
  { value: "Education", label: "📚 Education", emoji: "📚", color: "hsl(var(--chart-3))", parent: "Education" },
  { value: "Transport", label: "🚗 Transport", emoji: "🚗", color: "hsl(var(--chart-4))", parent: "Transport" },
  { value: "Dining", label: "🍽️ Dining", emoji: "🍽️", color: "hsl(var(--chart-5))", parent: "Food" },
  { value: "Utilities", label: "💡 Utilities", emoji: "💡", color: "hsl(var(--chart-6))", parent: "Bills" },
  { value: "Entertainment", label: "🎬 Entertainment", emoji: "🎬", color: "hsl(var(--chart-7))", parent: "Lifestyle" },
  { value: "Health", label: "🏥 Health", emoji: "🏥", color: "hsl(var(--chart-8))", parent: "Health" },
  { value: "Rent", label: "🏠 Rent", emoji: "🏠", color: "hsl(var(--chart-9))", parent: "Bills" },
  { value: "Insurance", label: "🛡️ Insurance", emoji: "🛡️", color: "hsl(var(--chart-10))", parent: "Bills" },
  { value: "Gifts", label: "🎁 Gifts", emoji: "🎁", color: "hsl(var(--chart-11))", parent: "Lifestyle" },
  { value: "Other", label: "📦 Other", emoji: "📦", color: "hsl(var(--chart-12))", parent: "Other" },
];

// Extended catalog (30+) shown on the manage-categories page; users can enable/use these via Add Category too.
// These reuse the chart palette by index (mod 12) so colors stay consistent.
const palette = (i: number) => `hsl(var(--chart-${(i % 12) + 1}))`;

export const EXTRA_CATEGORIES: CategoryDef[] = [
  { value: "Fast Food", label: "🍔 Fast Food", emoji: "🍔", color: palette(0), parent: "Food" },
  { value: "Coffee", label: "☕ Coffee", emoji: "☕", color: palette(1), parent: "Food" },
  { value: "Snacks", label: "🍿 Snacks", emoji: "🍿", color: palette(2), parent: "Food" },
  { value: "Fuel", label: "⛽ Fuel", emoji: "⛽", color: palette(3), parent: "Transport" },
  { value: "Taxi", label: "🚕 Taxi", emoji: "🚕", color: palette(4), parent: "Transport" },
  { value: "Public Transit", label: "🚌 Public Transit", emoji: "🚌", color: palette(5), parent: "Transport" },
  { value: "Parking", label: "🅿️ Parking", emoji: "🅿️", color: palette(6), parent: "Transport" },
  { value: "Flights", label: "✈️ Flights", emoji: "✈️", color: palette(7), parent: "Travel" },
  { value: "Hotels", label: "🏨 Hotels", emoji: "🏨", color: palette(8), parent: "Travel" },
  { value: "Travel", label: "🧳 Travel", emoji: "🧳", color: palette(9), parent: "Travel" },
  { value: "Electricity", label: "⚡ Electricity", emoji: "⚡", color: palette(10), parent: "Bills" },
  { value: "Internet", label: "🌐 Internet", emoji: "🌐", color: palette(11), parent: "Bills" },
  { value: "Phone", label: "📱 Phone", emoji: "📱", color: palette(0), parent: "Bills" },
  { value: "Water", label: "💧 Water", emoji: "💧", color: palette(1), parent: "Bills" },
  { value: "Gas", label: "🔥 Gas", emoji: "🔥", color: palette(2), parent: "Bills" },
  { value: "Subscriptions", label: "🔁 Subscriptions", emoji: "🔁", color: palette(3), parent: "Bills" },
  { value: "Clothes", label: "👕 Clothes", emoji: "👕", color: palette(4), parent: "Shopping" },
  { value: "Electronics", label: "💻 Electronics", emoji: "💻", color: palette(5), parent: "Shopping" },
  { value: "Home", label: "🛋️ Home", emoji: "🛋️", color: palette(6), parent: "Shopping" },
  { value: "Beauty", label: "💄 Beauty", emoji: "💄", color: palette(7), parent: "Lifestyle" },
  { value: "Gym", label: "💪 Gym", emoji: "💪", color: palette(8), parent: "Health" },
  { value: "Pharmacy", label: "💊 Pharmacy", emoji: "💊", color: palette(9), parent: "Health" },
  { value: "Doctor", label: "🩺 Doctor", emoji: "🩺", color: palette(10), parent: "Health" },
  { value: "Movies", label: "🎬 Movies", emoji: "🎬", color: palette(11), parent: "Lifestyle" },
  { value: "Music", label: "🎵 Music", emoji: "🎵", color: palette(0), parent: "Lifestyle" },
  { value: "Games", label: "🎮 Games", emoji: "🎮", color: palette(1), parent: "Lifestyle" },
  { value: "Books", label: "📖 Books", emoji: "📖", color: palette(2), parent: "Education" },
  { value: "Courses", label: "🎓 Courses", emoji: "🎓", color: palette(3), parent: "Education" },
  { value: "Pets", label: "🐶 Pets", emoji: "🐶", color: palette(4), parent: "Lifestyle" },
  { value: "Kids", label: "🧸 Kids", emoji: "🧸", color: palette(5), parent: "Family" },
  { value: "Donations", label: "❤️ Donations", emoji: "❤️", color: palette(6), parent: "Lifestyle" },
  { value: "Taxes", label: "🧾 Taxes", emoji: "🧾", color: palette(7), parent: "Bills" },
  { value: "Investments", label: "📈 Investments", emoji: "📈", color: palette(8), parent: "Finance" },
  { value: "Savings", label: "🐖 Savings", emoji: "🐖", color: palette(9), parent: "Finance" },
];

export const ALL_DEFAULT_CATEGORIES: CategoryDef[] = [
  ...EXPENSE_CATEGORIES,
  ...EXTRA_CATEGORIES,
];

export const PAYMENT_METHODS = [
  { value: "Cash", label: "💵 Cash" },
  { value: "Credit Card", label: "💳 Credit Card" },
  { value: "Debit Card", label: "💳 Debit Card" },
  { value: "UPI", label: "📱 UPI" },
  { value: "Bank Transfer", label: "🏦 Bank Transfer" },
  { value: "Other", label: "💰 Other" },
] as const;

export const getCategoryColor = (category: string) => {
  const cat = ALL_DEFAULT_CATEGORIES.find((c) => c.value === category);
  return cat?.color || "hsl(var(--chart-12))";
};

// ---------- AI-style emoji suggestion ----------
// Lightweight keyword → emoji map. No network calls; instant on every keystroke.
const KEYWORD_EMOJI: Array<[RegExp, string]> = [
  [/gym|fitness|workout|yoga|run/i, "💪"],
  [/coffee|cafe|espresso|latte/i, "☕"],
  [/burger|fast.?food|kfc|mcdonald/i, "🍔"],
  [/pizza/i, "🍕"],
  [/grocery|grocer|supermarket|mart/i, "🛒"],
  [/restaurant|dining|dinner|lunch|breakfast|food/i, "🍽️"],
  [/snack|chips/i, "🍿"],
  [/fuel|gas\s*station|petrol|diesel/i, "⛽"],
  [/taxi|uber|lyft|cab/i, "🚕"],
  [/bus|metro|subway|transit|train/i, "🚌"],
  [/park(ing)?/i, "🅿️"],
  [/flight|airline|plane/i, "✈️"],
  [/hotel|airbnb|stay/i, "🏨"],
  [/travel|trip|vacation|holiday/i, "🧳"],
  [/electric|power|kwh/i, "⚡"],
  [/internet|wifi|broadband/i, "🌐"],
  [/phone|mobile|cell/i, "📱"],
  [/water|plumb/i, "💧"],
  [/gas|heating/i, "🔥"],
  [/subscription|netflix|spotify|prime/i, "🔁"],
  [/cloth|shirt|fashion|apparel/i, "👕"],
  [/shoe|sneaker/i, "👟"],
  [/electronic|laptop|computer|gadget/i, "💻"],
  [/furniture|home|decor/i, "🛋️"],
  [/beauty|makeup|salon|spa/i, "💄"],
  [/pharmacy|medicine|drug/i, "💊"],
  [/doctor|clinic|hospital|medical|health/i, "🩺"],
  [/dental|teeth|dentist/i, "🦷"],
  [/movie|cinema|theater/i, "🎬"],
  [/music|concert|spotify/i, "🎵"],
  [/game|gaming|playstation|xbox/i, "🎮"],
  [/book|reading/i, "📖"],
  [/course|class|tuition|school|college|university|education/i, "🎓"],
  [/pet|dog|cat|vet/i, "🐶"],
  [/kid|child|baby|toy/i, "🧸"],
  [/donation|charity|gift/i, "🎁"],
  [/tax/i, "🧾"],
  [/invest|stock|crypto/i, "📈"],
  [/saving|deposit/i, "🐖"],
  [/rent|mortgage|lease/i, "🏠"],
  [/insurance/i, "🛡️"],
  [/shop|store|mall|amazon/i, "🛍️"],
  [/car|auto|vehicle/i, "🚗"],
  [/bike|bicycle/i, "🚲"],
  [/beer|wine|alcohol|bar|pub/i, "🍺"],
  [/garden|plant/i, "🌱"],
  [/laundry|cleaning/i, "🧺"],
  [/work|office|business/i, "💼"],
  [/salary|paycheck|income/i, "💰"],
];

export const suggestEmojiForCategory = (name: string): string => {
  const trimmed = (name || "").trim();
  if (!trimmed) return "📦";
  for (const [re, emoji] of KEYWORD_EMOJI) {
    if (re.test(trimmed)) return emoji;
  }
  return "📦";
};
