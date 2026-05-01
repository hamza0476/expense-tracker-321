import { useState } from "react";
import { ChevronDown, Check, Boxes } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useCategoryOptions } from "@/hooks/useCategories";

export interface CategoryOption {
  value: string;
  label: string;
  emoji: string;
}

export const EXPENSE_CATEGORY_OPTIONS: CategoryOption[] = [
  { value: "Groceries", label: "Groceries", emoji: "🛒" },
  { value: "Shopping", label: "Shopping", emoji: "🛍️" },
  { value: "Education", label: "Education", emoji: "📚" },
  { value: "Transport", label: "Transport", emoji: "🚗" },
  { value: "Dining", label: "Dining", emoji: "🍽️" },
  { value: "Utilities", label: "Utilities", emoji: "💡" },
  { value: "Entertainment", label: "Entertainment", emoji: "🎬" },
  { value: "Health", label: "Health", emoji: "🏥" },
  { value: "Rent", label: "Rent", emoji: "🏠" },
  { value: "Insurance", label: "Insurance", emoji: "🛡️" },
  { value: "Gifts", label: "Gifts", emoji: "🎁" },
  { value: "Other", label: "Other", emoji: "📦" },
];

export const INCOME_CATEGORY_OPTIONS: CategoryOption[] = [
  { value: "Salary", label: "Salary", emoji: "💼" },
  { value: "Selling", label: "Selling", emoji: "🏷️" },
  { value: "Business", label: "Business", emoji: "📈" },
  { value: "Gifts", label: "Gifts", emoji: "🎁" },
  { value: "Other", label: "Other", emoji: "💰" },
];

interface Props {
  value: string;
  onChange: (value: string) => void;
  options?: CategoryOption[];
  className?: string;
}

export const CategoryPicker = ({
  value,
  onChange,
  options,
  className,
}: Props) => {
  const dynamicOptions = useCategoryOptions();
  const resolved = options ?? dynamicOptions ?? EXPENSE_CATEGORY_OPTIONS;
  const [open, setOpen] = useState(false);
  const selected =
    resolved.find((o) => o.value === value) || resolved[0] || EXPENSE_CATEGORY_OPTIONS[0];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "w-full h-12 rounded-2xl border border-border bg-card px-3 flex items-center gap-2.5 text-sm font-medium transition-colors hover:border-primary/40",
            className
          )}
        >
          <div className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center shrink-0">
            <Boxes className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-base shrink-0">{selected.emoji}</span>
          <span className="flex-1 text-left truncate">{selected.label}</span>
          <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={6}
        className="w-[var(--radix-popover-trigger-width)] p-1.5 rounded-2xl shadow-xl border-border/60 max-h-[60vh] overflow-y-auto"
      >
        {options.map((opt) => {
          const active = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={cn(
                "w-full h-11 px-3 rounded-xl flex items-center gap-3 text-sm font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "hover:bg-muted text-foreground"
              )}
            >
              {active ? (
                <Check className="w-4 h-4 shrink-0" strokeWidth={3} />
              ) : (
                <span className="w-4" />
              )}
              <span className="text-lg">{opt.emoji}</span>
              <span className="flex-1 text-left">{opt.label}</span>
            </button>
          );
        })}
      </PopoverContent>
    </Popover>
  );
};
