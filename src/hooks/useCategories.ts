import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  ALL_DEFAULT_CATEGORIES,
  EXPENSE_CATEGORIES,
  type CategoryDef,
} from "@/lib/categories";
import type { CategoryOption } from "@/components/CategoryPicker";

export type CustomCategory = {
  id: string;
  user_id: string;
  name: string;
  emoji: string;
  parent: string | null;
  created_at: string;
  updated_at: string;
};

const QUERY_KEY = ["custom_categories"] as const;

async function fetchCustomCategories(): Promise<CustomCategory[]> {
  const { data: auth } = await supabase.auth.getUser();
  const userId = auth.user?.id;
  if (!userId) return [];
  const { data, error } = await supabase
    .from("custom_categories")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as CustomCategory[];
}

export function useCustomCategories() {
  return useQuery({ queryKey: QUERY_KEY, queryFn: fetchCustomCategories });
}

/**
 * Merged list of defaults + user customs as `CategoryDef` objects.
 * Custom items override defaults with the same `value` (name).
 */
export function useAllCategories(): {
  data: CategoryDef[];
  isLoading: boolean;
} {
  const { data: customs = [], isLoading } = useCustomCategories();

  const customDefs: CategoryDef[] = customs.map((c) => ({
    value: c.name,
    label: `${c.emoji} ${c.name}`,
    emoji: c.emoji,
    color: "hsl(var(--chart-12))",
    parent: c.parent ?? "Custom",
  }));

  const seen = new Set(customDefs.map((c) => c.value.toLowerCase()));
  const merged = [
    ...ALL_DEFAULT_CATEGORIES.filter((d) => !seen.has(d.value.toLowerCase())),
    ...customDefs,
  ];

  return { data: merged, isLoading };
}

/**
 * Picker-friendly options (built-ins + customs). Used by CategoryPicker.
 * Built-ins are kept to the original 12 EXPENSE_CATEGORIES so existing forms stay compact,
 * and any custom user categories are appended.
 */
export function useCategoryOptions(): CategoryOption[] {
  const { data: customs = [] } = useCustomCategories();
  const builtIns: CategoryOption[] = EXPENSE_CATEGORIES.map((c) => ({
    value: c.value,
    label: c.value,
    emoji: c.emoji,
  }));
  const seen = new Set(builtIns.map((b) => b.value.toLowerCase()));
  const customOpts: CategoryOption[] = customs
    .filter((c) => !seen.has(c.name.toLowerCase()))
    .map((c) => ({ value: c.name, label: c.name, emoji: c.emoji }));
  return [...builtIns, ...customOpts];
}

export function useAddCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { name: string; emoji: string; parent?: string | null }) => {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Not authenticated");
      const { data, error } = await supabase
        .from("custom_categories")
        .insert({
          user_id: userId,
          name: input.name.trim(),
          emoji: input.emoji,
          parent: input.parent ?? null,
        })
        .select()
        .single();
      if (error) throw error;
      return data as CustomCategory;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}

export function useDeleteCategory() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("custom_categories").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: QUERY_KEY });
    },
  });
}
