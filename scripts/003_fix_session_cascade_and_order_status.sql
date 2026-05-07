-- Migration: fix_session_cascade_and_order_status
-- Fixes two critical issues:
-- 1. ON DELETE CASCADE on orders.session_id was destroying order history when sessions were deleted
-- 2. 'CANCELLED' was not a valid status, so force-clearing unpaid orders would violate the CHECK constraint

-- 1. Fix the cascade: sessions can be deleted without destroying orders
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_session_id_fkey;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_session_id_fkey
  FOREIGN KEY (session_id) REFERENCES public.table_sessions(id)
  ON DELETE SET NULL;

-- 2. Allow CANCELLED status on orders
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('CREATED', 'PAYMENT_PENDING', 'CONFIRMED', 'CANCELLED'));
