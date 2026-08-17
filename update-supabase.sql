-- ============================================================
-- Al Imran App — Supabase Update SQL
-- Copy and paste ALL of this into the Supabase SQL Editor
-- ============================================================

-- 1. Enable pg_trgm extension FIRST (required for the GIN index below)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Add username index for fast user search (partial/ILIKE matching)
CREATE INDEX IF NOT EXISTS idx_users_username_trgm
ON users USING gin (username gin_trgm_ops);

-- 3. Simple B-tree index on username for exact lookups
CREATE INDEX IF NOT EXISTS idx_users_username
ON users (lower(username));

-- ============================================================
-- 4. Enable Realtime for key tables
-- (Allows live score sync in battles and live profile updates)
-- ============================================================

-- Enable Realtime on users table (for live profile + leaderboard)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'users'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE users;
  END IF;
END $$;

-- Enable Realtime on battle_queue (for match notifications)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'battle_queue'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE battle_queue;
  END IF;
END $$;

-- Enable Realtime on battles (for 1v1 match detection)
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'battles'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE battles;
  END IF;
END $$;

-- ============================================================
-- 5. Remove old 3D avatars & add new ones
-- ============================================================

-- Delete the old boy1, boy2, girl1, girl2 entries from the shop
DELETE FROM shop_items
WHERE image_url IN ('/avatars/boy1.png', '/avatars/boy2.png', '/avatars/girl1.png', '/avatars/girl2.png');

-- Insert the new avatars
INSERT INTO shop_items (id, name, item_type, price, image_url)
VALUES
  ('b01a3333-3333-4333-a333-333333333333', 'Bilal Elite',    'avatar', 200, '/avatars/boy3.png'),
  ('b01a4444-4444-4444-a444-444444444444', 'Hassan Prime',   'avatar', 200, '/avatars/boy4.png'),
  ('b01a5555-5555-4555-a555-555555555555', 'Hamza Ultra',    'avatar', 250, '/avatars/boy5.png'),
  ('b01a6666-6666-4666-a666-666666666666', 'Farhan Pro',     'avatar', 250, '/avatars/boy6.png'),
  ('b01a7777-7777-4777-a777-777777777777', 'Asad Pro Max',   'avatar', 300, '/avatars/boy7.png'),
  ('b01a8888-8888-4888-a888-888888888888', 'Abdullah King',  'avatar', 300, '/avatars/boy8.png'),
  ('c01a3333-3333-4333-a333-333333333333', 'Zara Elite',     'avatar', 200, '/avatars/girl3.png'),
  ('c01a4444-4444-4444-a444-444444444444', 'Noor Prime',     'avatar', 200, '/avatars/girl4.png'),
  ('c01a5555-5555-4555-a555-555555555555', 'Layla Apex',     'avatar', 250, '/avatars/girl5.png'),
  ('c01a6666-6666-4666-a666-666666666666', 'Aysha Elite',    'avatar', 250, '/avatars/girl6.png'),
  ('c01a7777-7777-4777-a777-777777777777', 'Insha Ultimate', 'avatar', 300, '/avatars/girl7.png'),
  ('c01a8888-8888-4888-a888-888888888888', 'Amna Ultra',     'avatar', 300, '/avatars/girl8.png')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url;

-- Also update old boy avatars with gender info if your table has a gender column
-- ALTER TABLE shop_items ADD COLUMN IF NOT EXISTS gender text DEFAULT 'other';
-- UPDATE shop_items SET gender = 'boy' WHERE image_url LIKE '%boy%';
-- UPDATE shop_items SET gender = 'girl' WHERE image_url LIKE '%girl%';

-- ============================================================
-- 6. Add a Double XP Boost perk to the shop
-- ============================================================

INSERT INTO shop_items (id, name, item_type, price)
VALUES
  ('d01a7777-7777-4777-a777-777777777777', 'Double XP Boost', 'perk', 300)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- DONE! Your database is now updated.
-- ============================================================
