import { useMemo, useState } from "react";
import { ArrowLeft, Plus, Search, Sparkles, Trash2, Check } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { suggestEmojiForCategory } from "@/lib/categories";
import {
  useAllCategories,
  useCustomCategories,
  useAddCategory,
  useDeleteCategory,
} from "@/hooks/useCategories";

const ICON_PICKS = [
  "📦","🛒","🍔","☕","🍿","🍽️","🍕","🍺",
  "🚗","⛽","🚕","🚌","🅿️","✈️","🏨","🧳",
  "⚡","🌐","📱","💧","🔥","🔁","🏠","🛡️",
  "👕","👟","💻","🛋️","🛍️","💄","💪","💊",
  "🩺","🦷","🎬","🎵","🎮","📖","🎓","🐶",
  "🧸","🎁","🧾","📈","🐖","💼","💰","❤️",
];

export default function Categories() {
  const navigate = useNavigate();
  const { data: allCats, isLoading } = useAllCategories();
  const { data: customs = [] } = useCustomCategories();
  const addCategory = useAddCategory();
  const deleteCategory = useDeleteCategory();

  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("📦");
  const [emojiTouched, setEmojiTouched] = useState(false);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allCats;
    return allCats.filter(
      (c) =>
        c.value.toLowerCase().includes(q) ||
        (c.parent ?? "").toLowerCase().includes(q)
    );
  }, [allCats, search]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const c of filtered) {
      const key = c.parent || "Other";
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(c);
    }
    return Array.from(map.entries());
  }, [filtered]);

  const customIds = useMemo(
    () => new Map(customs.map((c) => [c.name.toLowerCase(), c.id])),
    [customs]
  );

  const handleNameChange = (v: string) => {
    setName(v);
    if (!emojiTouched) setEmoji(suggestEmojiForCategory(v));
  };

  const resetForm = () => {
    setName("");
    setEmoji("📦");
    setEmojiTouched(false);
  };

  const handleSubmit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      toast.error("Please enter a category name");
      return;
    }
    try {
      await addCategory.mutateAsync({ name: trimmed, emoji });
      toast.success(`Added “${trimmed}”`);
      resetForm();
      setDialogOpen(false);
    } catch (e: any) {
      const msg = e?.message?.includes("duplicate")
        ? "That category already exists"
        : e?.message || "Failed to add category";
      toast.error(msg);
    }
  };

  const handleDelete = async (id: string, label: string) => {
    try {
      await deleteCategory.mutateAsync(id);
      toast.success(`Removed “${label}”`);
    } catch (e: any) {
      toast.error(e?.message || "Failed to delete");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background/80 backdrop-blur border-b border-border">
        <div className="flex items-center gap-2 px-4 py-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 -ml-2"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-lg font-semibold flex-1 truncate">Categories</h1>
          <Button
            size="sm"
            className="h-9 rounded-full px-3"
            onClick={() => {
              resetForm();
              setDialogOpen(true);
            }}
          >
            <Plus className="h-4 w-4 mr-1" />
            Add
          </Button>
        </div>
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search categories"
              className="pl-9 h-10 rounded-2xl bg-muted/40 border-border"
            />
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-6">
        {isLoading ? (
          <div className="grid grid-cols-3 gap-3">
            {Array.from({ length: 9 }).map((_, i) => (
              <Skeleton key={i} className="h-24 rounded-2xl" />
            ))}
          </div>
        ) : grouped.length === 0 ? (
          <div className="text-center text-sm text-muted-foreground py-12">
            No categories match “{search}”.
          </div>
        ) : (
          grouped.map(([group, items]) => (
            <section key={group}>
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-1">
                {group}
              </h2>
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {items.map((c) => {
                  const customId = customIds.get(c.value.toLowerCase());
                  return (
                    <div
                      key={c.value}
                      className={cn(
                        "relative group rounded-2xl border border-border bg-card p-3 flex flex-col items-center justify-center gap-1.5 transition-all",
                        "hover:border-primary/40 hover:shadow-sm"
                      )}
                    >
                      <div className="text-2xl leading-none">{c.emoji}</div>
                      <div className="text-xs font-medium text-center truncate w-full">
                        {c.value}
                      </div>
                      {customId ? (
                        <button
                          type="button"
                          onClick={() => handleDelete(customId, c.value)}
                          className="absolute -top-1.5 -right-1.5 h-6 w-6 rounded-full bg-destructive text-destructive-foreground flex items-center justify-center shadow opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity"
                          aria-label={`Delete ${c.value}`}
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      ) : null}
                    </div>
                  );
                })}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Add dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-sm rounded-3xl">
          <DialogHeader>
            <DialogTitle>New Category</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="cat-name">Name</Label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Gym, Coffee, Subscriptions"
                autoFocus
                className="h-11 rounded-2xl"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label>Icon</Label>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Sparkles className="h-3 w-3" />
                  AI suggested
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center text-2xl">
                  {emoji}
                </div>
                <div className="flex-1 grid grid-cols-8 gap-1 max-h-32 overflow-y-auto p-1 rounded-2xl border border-border bg-muted/30">
                  {ICON_PICKS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => {
                        setEmoji(ic);
                        setEmojiTouched(true);
                      }}
                      className={cn(
                        "h-8 w-8 rounded-lg flex items-center justify-center text-base transition-colors",
                        emoji === ic
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-background"
                      )}
                    >
                      {emoji === ic ? <Check className="h-3.5 w-3.5" /> : ic}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2">
            <Button
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              disabled={addCategory.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={addCategory.isPending || !name.trim()}
            >
              {addCategory.isPending ? "Adding..." : "Add Category"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
