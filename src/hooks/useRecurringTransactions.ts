import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type RecurringTransaction = Database["public"]["Tables"]["recurring_expenses"]["Row"];
export type RecurringTransactionInsert = Database["public"]["Tables"]["recurring_expenses"]["Insert"];
export type RecurringTransactionUpdate = Database["public"]["Tables"]["recurring_expenses"]["Update"];

const KEY = ["recurring_expenses"] as const;

async function getUserId(): Promise<string> {
  const { data } = await supabase.auth.getSession();
  const id = data.session?.user?.id;
  if (!id) throw new Error("Not authenticated");
  return id;
}

export function useRecurringTransactions() {
  return useQuery<RecurringTransaction[], Error>({
    queryKey: KEY,
    queryFn: async () => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from("recurring_expenses")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });
}

export function useAddRecurringTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Omit<RecurringTransactionInsert, "user_id">) => {
      const userId = await getUserId();
      const { data, error } = await supabase
        .from("recurring_expenses")
        .insert({ ...payload, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useEditRecurringTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, updates }: { id: string; updates: RecurringTransactionUpdate }) => {
      const { data, error } = await supabase
        .from("recurring_expenses")
        .update(updates)
        .eq("id", id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}

export function useDeleteRecurringTransaction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("recurring_expenses").delete().eq("id", id);
      if (error) throw error;
      return id;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  });
}
