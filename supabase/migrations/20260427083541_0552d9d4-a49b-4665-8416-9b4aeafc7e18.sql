CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON public.expenses (user_id, date DESC, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_budgets_user ON public.budgets (user_id, year, month);
CREATE INDEX IF NOT EXISTS idx_recurring_user_active ON public.recurring_expenses (user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_savings_user ON public.savings_goals (user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_user_date ON public.daily_tasks (user_id, task_date DESC);
CREATE INDEX IF NOT EXISTS idx_profiles_user ON public.profiles (user_id);
CREATE INDEX IF NOT EXISTS idx_chat_user_created ON public.ai_chat_history (user_id, created_at DESC);