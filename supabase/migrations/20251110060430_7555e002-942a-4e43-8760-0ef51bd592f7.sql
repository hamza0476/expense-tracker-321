-- Add currency support to expenses table
ALTER TABLE public.expenses 
ADD COLUMN currency text NOT NULL DEFAULT 'USD',
ADD COLUMN original_amount numeric,
ADD COLUMN exchange_rate numeric DEFAULT 1.0;

-- Add default currency preference to profiles
ALTER TABLE public.profiles
ADD COLUMN default_currency text DEFAULT 'USD';

-- Create exchange rates cache table
CREATE TABLE public.exchange_rates (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  base_currency text NOT NULL,
  target_currency text NOT NULL,
  rate numeric NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(base_currency, target_currency)
);

ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Allow everyone to read exchange rates
CREATE POLICY "Exchange rates are viewable by everyone"
ON public.exchange_rates
FOR SELECT
USING (true);

-- Create index for faster lookups
CREATE INDEX idx_exchange_rates_currencies ON public.exchange_rates(base_currency, target_currency);