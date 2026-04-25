import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { cn, formatCurrencyStrict } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface RecurringItem {
  id: string;
  amount: number;
  description: string;
  category: string;
  frequency: string;
  start_date: string;
  last_processed_date?: string | null;
  is_active: boolean;
}

interface Props {
  items: RecurringItem[];
  symbol: string;
  monthlyEquivalent: (amount: number, freq: string) => number;
  onSelectItem?: (id: string) => void;
}

// Build all upcoming due dates for an item between two dates (inclusive)
const expandDates = (item: RecurringItem, from: Date, to: Date): Date[] => {
  const dates: Date[] = [];
  const start = item.last_processed_date ? new Date(item.last_processed_date) : new Date(item.start_date);
  // Move start forward to first occurrence on/after `from`
  let cursor = new Date(start);
  cursor.setHours(0, 0, 0, 0);

  // Walk forward in increments until we pass `to`
  const stepForward = (d: Date) => {
    if (item.frequency === "weekly") d.setDate(d.getDate() + 7);
    else if (item.frequency === "yearly") d.setFullYear(d.getFullYear() + 1);
    else d.setMonth(d.getMonth() + 1);
  };

  // If cursor is after `to`, no occurrences
  if (cursor > to) {
    // Could be a future-dated start within range
    if (cursor >= from && cursor <= to) dates.push(new Date(cursor));
    return dates;
  }

  // Push cursor forward until in range
  while (cursor < from) stepForward(cursor);
  while (cursor <= to) {
    dates.push(new Date(cursor));
    stepForward(cursor);
  }
  return dates;
};

const RecurringCalendar = ({ items, symbol, monthlyEquivalent, onSelectItem }: Props) => {
  const [viewDate, setViewDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    return d;
  });

  const monthLabel = viewDate.toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);
  const startWeekday = firstDay.getDay(); // 0=Sun
  const daysInMonth = lastDay.getDate();

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Map of dayNum -> items due that day
  const dueByDay = useMemo(() => {
    const map = new Map<number, RecurringItem[]>();
    items.filter((i) => i.is_active).forEach((it) => {
      const occurrences = expandDates(it, firstDay, lastDay);
      occurrences.forEach((d) => {
        const key = d.getDate();
        const arr = map.get(key) || [];
        arr.push(it);
        map.set(key, arr);
      });
    });
    return map;
  }, [items, year, month]);

  // Total due this month (sum of amounts on each occurrence)
  const monthTotal = useMemo(() => {
    let sum = 0;
    dueByDay.forEach((arr) => arr.forEach((it) => (sum += Number(it.amount))));
    return sum;
  }, [dueByDay]);

  const occurrenceCount = useMemo(() => {
    let n = 0;
    dueByDay.forEach((arr) => (n += arr.length));
    return n;
  }, [dueByDay]);

  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const selectedItems = selectedDay ? dueByDay.get(selectedDay) || [] : [];

  const cells: (number | null)[] = [];
  for (let i = 0; i < startWeekday; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const goPrev = () => {
    setSelectedDay(null);
    setViewDate(new Date(year, month - 1, 1));
  };
  const goNext = () => {
    setSelectedDay(null);
    setViewDate(new Date(year, month + 1, 1));
  };

  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={goPrev}
          className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <p className="font-bold text-foreground text-base">{monthLabel}</p>
        <button
          onClick={goNext}
          className="w-9 h-9 rounded-full hover:bg-muted flex items-center justify-center text-muted-foreground"
          aria-label="Next month"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Total summary */}
      <Card className="p-3 rounded-xl border border-border/60 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <CalendarIcon className="h-4 w-4" />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Due This Month
            </p>
            <p className="text-xs text-muted-foreground">{occurrenceCount} payment{occurrenceCount === 1 ? "" : "s"}</p>
          </div>
        </div>
        <p className="font-bold text-foreground tabular-nums">
          {formatCurrencyStrict(monthTotal, symbol, 2)}
        </p>
      </Card>

      {/* Weekday header */}
      <div className="grid grid-cols-7 gap-1 px-1">
        {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
          <div key={i} className="text-center text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            {d}
          </div>
        ))}
      </div>

      {/* Days grid */}
      <div className="grid grid-cols-7 gap-1 px-1">
        {cells.map((d, idx) => {
          if (d === null) return <div key={idx} className="aspect-square" />;
          const due = dueByDay.get(d);
          const hasDue = !!due && due.length > 0;
          const dayDate = new Date(year, month, d);
          const isToday = dayDate.getTime() === today.getTime();
          const isPast = dayDate < today;
          const isSelected = selectedDay === d;
          const dayTotal = due ? due.reduce((s, it) => s + Number(it.amount), 0) : 0;

          return (
            <button
              key={idx}
              onClick={() => setSelectedDay(isSelected ? null : d)}
              className={cn(
                "aspect-square rounded-lg flex flex-col items-center justify-center gap-0.5 text-xs font-semibold transition-all relative",
                isSelected
                  ? "bg-primary text-primary-foreground shadow"
                  : hasDue
                    ? isPast
                      ? "bg-muted text-muted-foreground"
                      : "bg-primary/10 text-primary hover:bg-primary/20"
                    : "text-foreground hover:bg-muted",
                isToday && !isSelected && "ring-2 ring-primary"
              )}
            >
              <span>{d}</span>
              {hasDue && (
                <span
                  className={cn(
                    "text-[8px] font-bold tabular-nums leading-none",
                    isSelected ? "opacity-90" : isPast ? "opacity-70" : "opacity-80"
                  )}
                >
                  {symbol}
                  {dayTotal >= 1000 ? `${(dayTotal / 1000).toFixed(1)}k` : dayTotal.toFixed(0)}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected day list */}
      {selectedDay && (
        <Card className="p-3 rounded-xl border border-border/60 shadow-sm space-y-2">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            {monthLabel.split(" ")[0]} {selectedDay} • {selectedItems.length} due
          </p>
          {selectedItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No payments due.</p>
          ) : (
            selectedItems.map((it) => (
              <button
                key={it.id}
                onClick={() => onSelectItem?.(it.id)}
                className="w-full flex items-center justify-between py-1.5 px-1 rounded-md hover:bg-muted text-left"
              >
                <div className="min-w-0">
                  <p className="font-semibold text-sm truncate text-foreground">{it.description}</p>
                  <p className="text-[11px] text-muted-foreground">{it.category} • {it.frequency}</p>
                </div>
                <p className="font-bold text-sm tabular-nums shrink-0 ml-2">
                  {formatCurrencyStrict(Number(it.amount), symbol, 2)}
                </p>
              </button>
            ))
          )}
        </Card>
      )}
    </div>
  );
};

export default RecurringCalendar;
