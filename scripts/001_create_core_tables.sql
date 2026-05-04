-- Oshap Core Database Schema
-- Migration: create_core_tables

-- ============ Restaurants ============
CREATE TABLE IF NOT EXISTS restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  bank_name TEXT,
  account_number TEXT,
  account_name TEXT,
  whatsapp_number TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============ Tables ============
CREATE TABLE IF NOT EXISTS tables (
  id TEXT PRIMARY KEY,  -- e.g. "T12"
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'CLOSED')),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============ Menu Items ============
CREATE TABLE IF NOT EXISTS menu_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  price INTEGER NOT NULL, -- in kobo/minor units
  category TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  available BOOLEAN DEFAULT true,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============ Orders ============
CREATE TABLE IF NOT EXISTS orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id TEXT NOT NULL REFERENCES tables(id),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'CREATED' CHECK (status IN ('CREATED', 'PAYMENT_PENDING', 'CONFIRMED')),
  total INTEGER NOT NULL DEFAULT 0,
  reference TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============ Order Items ============
CREATE TABLE IF NOT EXISTS order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  price INTEGER NOT NULL
);

-- ============ Payments ============
CREATE TABLE IF NOT EXISTS payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'NOT_PAID' CHECK (status IN ('NOT_PAID', 'CLAIMED', 'VERIFIED')),
  proof_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- ============ Indexes ============
CREATE INDEX IF NOT EXISTS idx_tables_restaurant ON tables(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_restaurant ON menu_items(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_menu_items_category ON menu_items(restaurant_id, category);
CREATE INDEX IF NOT EXISTS idx_orders_table ON orders(table_id);
CREATE INDEX IF NOT EXISTS idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX IF NOT EXISTS idx_orders_reference ON orders(reference);
CREATE INDEX IF NOT EXISTS idx_order_items_order ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_payments_order ON payments(order_id);

-- ============ RLS Policies ============
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;

-- Public read access for menu browsing (no auth required for MVP)
CREATE POLICY "Public can read restaurants" ON restaurants FOR SELECT USING (true);
CREATE POLICY "Public can read tables" ON tables FOR SELECT USING (true);
CREATE POLICY "Public can read menu items" ON menu_items FOR SELECT USING (true);
CREATE POLICY "Public can read orders" ON orders FOR SELECT USING (true);
CREATE POLICY "Public can read order items" ON order_items FOR SELECT USING (true);
CREATE POLICY "Public can read payments" ON payments FOR SELECT USING (true);

-- Public insert/update for MVP (customers place orders without auth)
CREATE POLICY "Public can create orders" ON orders FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update orders" ON orders FOR UPDATE USING (true);
CREATE POLICY "Public can create order items" ON order_items FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can create payments" ON payments FOR INSERT WITH CHECK (true);
CREATE POLICY "Public can update payments" ON payments FOR UPDATE USING (true);
