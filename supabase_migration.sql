-- Table Sessions
CREATE TABLE IF NOT EXISTS public.table_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    table_id TEXT NOT NULL,
    pin TEXT NOT NULL,
    status TEXT DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Update Orders table
ALTER TABLE public.orders 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES public.table_sessions(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS customer_name TEXT;

-- RLS Policies (assuming RLS is enabled on these tables, adjust if needed)
-- For MVP, we might allow anonymous access if that's how it's configured
ALTER TABLE public.table_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all for anon on table_sessions" ON public.table_sessions;
CREATE POLICY "Enable all for anon on table_sessions" ON public.table_sessions FOR ALL USING (true);

-- Fix for payments upsert
ALTER TABLE public.payments DROP CONSTRAINT IF EXISTS payments_order_id_key;
ALTER TABLE public.payments ADD CONSTRAINT payments_order_id_key UNIQUE (order_id);

-- Allow public to update table status (waiter closes table)
DROP POLICY IF EXISTS "Public can update tables" ON public.tables;
CREATE POLICY "Public can update tables" ON public.tables FOR UPDATE USING (true);
