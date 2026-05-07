-- Migration: add_device_token_to_orders
-- Adds a device_token column to orders so that pre-session orders can be
-- scoped to the device that placed them. This prevents Person B from
-- seeing Person A's orders when they both scan the same table QR code.

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS device_token TEXT;

-- Index for fast lookups by device_token + table_id
CREATE INDEX IF NOT EXISTS idx_orders_device_token ON orders(table_id, device_token);
