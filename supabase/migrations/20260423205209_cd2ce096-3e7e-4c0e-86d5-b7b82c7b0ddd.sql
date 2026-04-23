-- Expenses table — one row per shared cost tied to an event
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL,
  paid_by UUID NOT NULL,
  title TEXT NOT NULL,
  amount NUMERIC(12, 2) NOT NULL CHECK (amount >= 0),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

CREATE INDEX idx_expenses_event ON public.expenses(event_id);

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Expenses viewable by authenticated"
  ON public.expenses FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can create expenses"
  ON public.expenses FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = paid_by);

CREATE POLICY "Payer can update own expense"
  ON public.expenses FOR UPDATE
  TO authenticated
  USING (auth.uid() = paid_by);

CREATE POLICY "Payer can delete own expense"
  ON public.expenses FOR DELETE
  TO authenticated
  USING (auth.uid() = paid_by);

CREATE TRIGGER expenses_set_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

-- Expense shares — who owes how much for each expense (defaults to equal split)
CREATE TABLE public.expense_shares (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  expense_id UUID NOT NULL REFERENCES public.expenses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  share_amount NUMERIC(12, 2) NOT NULL CHECK (share_amount >= 0),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE (expense_id, user_id)
);

CREATE INDEX idx_expense_shares_expense ON public.expense_shares(expense_id);
CREATE INDEX idx_expense_shares_user ON public.expense_shares(user_id);

ALTER TABLE public.expense_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Shares viewable by authenticated"
  ON public.expense_shares FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated can add shares"
  ON public.expense_shares FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can update shares"
  ON public.expense_shares FOR UPDATE
  TO authenticated
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated can delete shares"
  ON public.expense_shares FOR DELETE
  TO authenticated
  USING (auth.uid() IS NOT NULL);