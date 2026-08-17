-- =====================================================
-- Al Imran Platform — Migration Script
-- Run this in your Supabase SQL Editor
-- =====================================================

-- 1. Add IP tracking columns to users table
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_ip TEXT;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS login_history JSONB DEFAULT '[]'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS coins INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS perks JSONB DEFAULT '{"hints": 3, "refills": 2}'::jsonb;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS completed_topics TEXT[] DEFAULT '{}'::TEXT[];
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_test_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS selected_theme TEXT DEFAULT 'default';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS time_xp_earned_today INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_time_xp_date DATE;

-- 2. Create Ban System Table
CREATE TABLE IF NOT EXISTS public.user_bans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  username TEXT,
  user_ip TEXT,
  banned_by TEXT DEFAULT 'admin',
  reason TEXT DEFAULT 'Violation of community guidelines',
  ban_type TEXT DEFAULT 'permanent' CHECK (ban_type IN ('temporary', 'permanent')),
  banned_until TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  is_active BOOLEAN DEFAULT true
);

-- Enable RLS for bans table
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for user_bans" ON public.user_bans;
CREATE POLICY "Enable all access for user_bans" ON public.user_bans FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for bans
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_bans;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 3. Create Battle System Tables
CREATE TABLE IF NOT EXISTS public.battles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  player1_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  player2_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  player1_score INTEGER DEFAULT 0,
  player2_score INTEGER DEFAULT 0,
  status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished')),
  current_question_index INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  finished_at TIMESTAMP WITH TIME ZONE,
  winner_id UUID
);

CREATE TABLE IF NOT EXISTS public.battle_queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
  joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS for battles
ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_queue ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for battles" ON public.battles;
DROP POLICY IF EXISTS "Enable all access for battle_queue" ON public.battle_queue;
CREATE POLICY "Enable all access for battles" ON public.battles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for battle_queue" ON public.battle_queue FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for battles
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.battles;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_queue;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 4. Shop System Tables
CREATE TABLE IF NOT EXISTS public.shop_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  item_type TEXT NOT NULL CHECK (item_type IN ('avatar', 'perk', 'theme')),
  price INTEGER DEFAULT 0,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Cleanup duplicates if any before adding constraint (for existing tables)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'shop_items') THEN
        DELETE FROM public.shop_items a
        USING public.shop_items b
        WHERE a.id > b.id AND a.name = b.name;
        
        -- Add unique constraint if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE table_name = 'shop_items' AND column_name = 'name') THEN
            ALTER TABLE public.shop_items ADD CONSTRAINT shop_items_name_key UNIQUE (name);
        END IF;
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.user_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
  item_id UUID REFERENCES public.shop_items(id) ON DELETE CASCADE,
  purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, item_id)
);

-- Enable RLS for shop tables
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for shop_items" ON public.shop_items;
DROP POLICY IF EXISTS "Enable all access for user_purchases" ON public.user_purchases;
CREATE POLICY "Enable all access for shop_items" ON public.shop_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for user_purchases" ON public.user_purchases FOR ALL USING (true) WITH CHECK (true);

-- Enable Realtime for shop
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.shop_items;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_purchases;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- 5. Seed Shop Items
INSERT INTO public.shop_items (id, name, item_type, price, image_url) VALUES
('b01a1111-1111-4111-a111-111111111111', 'Pro Boy Alpha', 'avatar', 100, '/avatars/boy1.png'),
('b01a2222-2222-4222-a222-222222222222', 'Pro Boy Sigma', 'avatar', 150, '/avatars/boy2.png'),
('b01a3333-3333-4333-a333-333333333333', 'Pro Girl Alpha', 'avatar', 100, '/avatars/girl1.png'),
('b01a4444-4444-4444-a444-444444444444', 'Pro Girl Sigma', 'avatar', 150, '/avatars/girl2.png'),
('d01a5555-5555-4555-a555-555555555555', 'Hint Protocol Bundle', 'perk', 150, null),
('e01a6666-6666-4666-a666-666666666666', 'Life Support Refill', 'perk', 100, null)
ON CONFLICT (name) DO UPDATE SET price = EXCLUDED.price, image_url = EXCLUDED.image_url;

-- Done! Your database is now updated.
