-- Migration: add_kitchen_order_statuses
-- The kitchen display sets orders to PREPARING and READY, but these
-- statuses were missing from the CHECK constraint, causing an internal
-- server error when kitchen staff clicked "Start" or "Ready".

ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('CREATED', 'PREPARING', 'READY', 'PAYMENT_PENDING', 'CONFIRMED', 'CANCELLED'));
