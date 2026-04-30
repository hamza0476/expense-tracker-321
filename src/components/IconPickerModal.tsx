import { useMemo, useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Check, RotateCcw } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  ICON_LIBRARY,
  ICON_GROUPS,
  ICON_COLORS,
  DEFAULT_CATEGORY_ICONS,
  getCategoryIconConfig,
  setCategoryIconConfig,
  resetCategoryIconConfig,
  type IconGroup,
} from "@/lib/categoryIcons";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  category: string;
  onSaved?: (config: { icon: string; color: string }) => void;
}

const triggerHaptic = () => {
  if (typeof navigator !== "undefined" && "vibrate" in navigator) {
    try { navigator.vibrate?.(8); } catch { /* noop */ }
  }
};

export const IconPickerModal = ({ open, onOpenChange, category, onSaved }: Props) => {
  const initial = useMemo(() => getCategoryIconConfig(category), [category, open]);
  const [selectedIcon, setSelectedIcon] = useState(initial.icon);
  const [selectedColor, setSelectedColor] = useState(initial.color);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<IconGroup | "All">("All");

  useEffect(() => {
    if (open) {
      const cfg = getCategoryIconConfig(category);
      setSelectedIcon(cfg.icon);
      setSelectedColor(cfg.color);
      setSearch("");
      setTab("All");
    }
  }, [open, category]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return ICON_LIBRARY.filter((i) => {
      if (tab !== "All" && i.group !== tab) return false;
      if (!q) return true;
      if (i.name.includes(q)) return true;
      if (i.keywords?.some((k) => k.includes(q))) return true;
      return i.group.toLowerCase().includes(q);
    });
  }, [search, tab]);

  const handleSave = () => {
    setCategoryIconConfig(category, { icon: selectedIcon, color: selectedColor });
    triggerHaptic();
    onSaved?.({ icon: selectedIcon, color: selectedColor });
    onOpenChange(false);
  };

  const handleReset = () => {
    resetCategoryIconConfig(category);
    const def = DEFAULT_CATEGORY_ICONS[category] || { icon: "package", color: "#64748B" };
    setSelectedIcon(def.icon);
    setSelectedColor(def.color);
    triggerHaptic();
  };

  const PreviewIcon = ICON_LIBRARY.find((i) => i.name === selectedIcon)?.Icon;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl p-0 max-h-[88vh] flex flex-col gap-0 border-t border-border/60"
      >
        {/* Drag handle */}
        <div className="flex justify-center pt-2 pb-1 shrink-0">
          <div className="w-10 h-1.5 rounded-full bg-muted-foreground/30" />
        </div>

        <SheetHeader className="px-5 pb-3 text-left shrink-0">
          <div className="flex items-center gap-3">
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-200"
              style={{ backgroundColor: `${selectedColor}22`, color: selectedColor }}
            >
              {PreviewIcon && <PreviewIcon size={22} strokeWidth={2.2} />}
            </div>
            <div className="flex-1 min-w-0">
              <SheetTitle className="text-base">Customize {category}</SheetTitle>
              <SheetDescription className="text-xs">
                Pick an icon and color
              </SheetDescription>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="h-8 px-2 text-xs gap-1"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </Button>
          </div>
        </SheetHeader>

        {/* Search */}
        <div className="px-5 pb-2 shrink-0">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search icons..."
              className="pl-9 h-10 rounded-xl bg-muted/40 border-border/50"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="px-3 pb-2 shrink-0 overflow-x-auto scrollbar-none">
          <div className="flex gap-1.5 px-2 w-max">
            {(["All", ...ICON_GROUPS] as const).map((g) => {
              const active = tab === g;
              return (
                <button
                  key={g}
                  type="button"
                  onClick={() => setTab(g)}
                  className={cn(
                    "px-3 h-8 rounded-full text-xs font-semibold transition-colors whitespace-nowrap",
                    active
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  )}
                >
                  {g}
                </button>
              );
            })}
          </div>
        </div>

        {/* Icon Grid */}
        <div className="flex-1 overflow-y-auto px-4 py-2 min-h-[180px]">
          {filtered.length === 0 ? (
            <div className="text-center py-10 text-sm text-muted-foreground">
              No icons found
            </div>
          ) : (
            <div className="grid grid-cols-5 gap-2">
              {filtered.map(({ name, Icon }) => {
                const active = selectedIcon === name;
                return (
                  <button
                    key={name}
                    type="button"
                    onClick={() => {
                      setSelectedIcon(name);
                      triggerHaptic();
                    }}
                    className={cn(
                      "aspect-square rounded-2xl flex items-center justify-center transition-all duration-150 border-2 active:scale-90",
                      active
                        ? "border-primary scale-105 shadow-sm"
                        : "border-transparent bg-muted/40 hover:bg-muted"
                    )}
                    style={
                      active
                        ? { backgroundColor: `${selectedColor}1f`, color: selectedColor }
                        : undefined
                    }
                    aria-label={name}
                  >
                    <Icon size={20} strokeWidth={2.2} />
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Color Row */}
        <div className="px-5 py-3 border-t border-border/40 shrink-0">
          <p className="text-xs font-semibold text-muted-foreground mb-2 tracking-wide uppercase">
            Color
          </p>
          <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
            {ICON_COLORS.map((c) => {
              const active = selectedColor === c;
              return (
                <button
                  key={c}
                  type="button"
                  onClick={() => {
                    setSelectedColor(c);
                    triggerHaptic();
                  }}
                  className={cn(
                    "w-9 h-9 rounded-full shrink-0 flex items-center justify-center transition-transform active:scale-90 ring-offset-2 ring-offset-background",
                    active && "ring-2 ring-primary scale-110"
                  )}
                  style={{ backgroundColor: c }}
                  aria-label={`Color ${c}`}
                >
                  {active && <Check className="w-4 h-4 text-white" strokeWidth={3} />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Save */}
        <div className="px-5 pt-2 pb-[calc(env(safe-area-inset-bottom)+12px)] shrink-0">
          <Button onClick={handleSave} className="w-full h-12 rounded-2xl text-base font-semibold">
            Save Icon
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
};
