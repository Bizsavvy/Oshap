-- Seed data for Aji's Kitchen demo restaurant

-- Insert demo restaurant
INSERT INTO restaurants (id, name, bank_name, account_number, account_name, whatsapp_number)
VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Aji''s Kitchen',
  'Access Bank',
  '0123456789',
  'Aji''s Kitchen Ltd',
  '+2348012345678'
)
ON CONFLICT (id) DO NOTHING;

-- Insert demo tables
INSERT INTO tables (id, restaurant_id) VALUES
  ('T1', '00000000-0000-0000-0000-000000000001'),
  ('T2', '00000000-0000-0000-0000-000000000001'),
  ('T3', '00000000-0000-0000-0000-000000000001'),
  ('T4', '00000000-0000-0000-0000-000000000001'),
  ('T5', '00000000-0000-0000-0000-000000000001'),
  ('T6', '00000000-0000-0000-0000-000000000001'),
  ('T7', '00000000-0000-0000-0000-000000000001'),
  ('T8', '00000000-0000-0000-0000-000000000001'),
  ('T9', '00000000-0000-0000-0000-000000000001'),
  ('T10', '00000000-0000-0000-0000-000000000001'),
  ('T11', '00000000-0000-0000-0000-000000000001'),
  ('T12', '00000000-0000-0000-0000-000000000001')
ON CONFLICT (id) DO NOTHING;

-- Insert demo menu items
INSERT INTO menu_items (restaurant_id, name, price, category, description, image_url, sort_order) VALUES
  ('00000000-0000-0000-0000-000000000001', 'Chicken Shawarma', 2500, 'Meals', 'Grilled chicken wrap with garlic sauce, pickles and fries', 'https://images.unsplash.com/photo-1529042410759-befb1204b468?w=400&q=80', 1),
  ('00000000-0000-0000-0000-000000000001', 'Beef Shawarma', 3000, 'Meals', 'Tender beef strips with tahini sauce and fresh vegetables', 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?w=400&q=80', 2),
  ('00000000-0000-0000-0000-000000000001', 'Jollof Rice & Chicken', 3500, 'Meals', 'Party-style jollof rice with a perfectly grilled chicken thigh', 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=400&q=80', 3),
  ('00000000-0000-0000-0000-000000000001', 'Fried Rice & Turkey', 4000, 'Meals', 'Vegetable fried rice served with peppered turkey', 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=400&q=80', 4),
  ('00000000-0000-0000-0000-000000000001', 'Peppered Chicken', 2000, 'Meals', 'Spicy fried chicken in a pepper sauce', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=400&q=80', 5),
  ('00000000-0000-0000-0000-000000000001', 'Suya Platter', 3000, 'Grills', 'Grilled beef skewers with yaji spice, onions and tomatoes', 'https://images.unsplash.com/photo-1544025162-d76694265947?w=400&q=80', 1),
  ('00000000-0000-0000-0000-000000000001', 'Grilled Fish', 5000, 'Grills', 'Whole catfish grilled with pepper sauce and plantain', 'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?w=400&q=80', 2),
  ('00000000-0000-0000-0000-000000000001', 'Asun', 3500, 'Grills', 'Spicy smoked goat meat with peppers and onions', 'https://images.unsplash.com/photo-1553621042-f6e147245754?w=400&q=80', 3),
  ('00000000-0000-0000-0000-000000000001', 'Chapman', 1500, 'Drinks', 'Classic Nigerian cocktail with Fanta, Sprite and bitters', 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=400&q=80', 1),
  ('00000000-0000-0000-0000-000000000001', 'Zobo', 800, 'Drinks', 'Refreshing hibiscus drink with ginger and pineapple', 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&q=80', 2),
  ('00000000-0000-0000-0000-000000000001', 'Fresh Orange Juice', 1200, 'Drinks', 'Freshly squeezed orange juice, no sugar added', 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&q=80', 3),
  ('00000000-0000-0000-0000-000000000001', 'Coca-Cola', 500, 'Drinks', 'Classic Coca-Cola 50cl bottle', 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400&q=80', 4),
  ('00000000-0000-0000-0000-000000000001', 'Malt', 600, 'Drinks', 'Amstel Malt 50cl bottle', 'https://images.unsplash.com/photo-1558645836-e44122a743ee?w=400&q=80', 5),
  ('00000000-0000-0000-0000-000000000001', 'Puff Puff', 500, 'Sides', '6 pieces of fluffy Nigerian doughnuts', 'https://images.unsplash.com/photo-1601050690597-df0568f70950?w=400&q=80', 1),
  ('00000000-0000-0000-0000-000000000001', 'Plantain Chips', 800, 'Sides', 'Crunchy plantain chips with a spicy dip', 'https://images.unsplash.com/photo-1599487405259-2a2b7e2898fb?w=400&q=80', 2),
  ('00000000-0000-0000-0000-000000000001', 'French Fries', 1000, 'Sides', 'Golden crispy fries with ketchup', 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?w=400&q=80', 3),
  ('00000000-0000-0000-0000-000000000001', 'Coleslaw', 500, 'Sides', 'Fresh coleslaw with creamy dressing', 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400&q=80', 4)
ON CONFLICT DO NOTHING;
