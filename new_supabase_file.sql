-- ==============================================================================
-- AL IMRAN TENSES LEARNER — COMPLETE SUPABASE DATABASE RECONSTRUCTION SCHEMA
-- File: new_supabase_file.sql
-- Description: Recreates all tables, relationships, constraints, indexes, RLS 
--              policies, realtime subscriptions, storage buckets, and seed data.
-- ==============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ==============================================================================
-- 2. CORE TABLES
-- ==============================================================================

-- 2.1 Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT NOT NULL UNIQUE,
    avatar_url TEXT,
    xp INTEGER DEFAULT 0 NOT NULL,
    level INTEGER DEFAULT 1 NOT NULL,
    current_streak INTEGER DEFAULT 0 NOT NULL,
    hearts INTEGER DEFAULT 5 NOT NULL,
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')) NOT NULL,
    coins INTEGER DEFAULT 0 NOT NULL,
    perks JSONB DEFAULT '{"hints": 3, "refills": 2}'::jsonb NOT NULL,
    completed_topics TEXT[] DEFAULT '{}'::TEXT[] NOT NULL,
    last_test_at TIMESTAMP WITH TIME ZONE,
    prev_test_score INTEGER,
    prev_test_total INTEGER,
    selected_theme TEXT DEFAULT 'default',
    time_xp_earned_today INTEGER DEFAULT 0 NOT NULL,
    last_time_xp_date DATE,
    last_ip TEXT,
    login_history JSONB DEFAULT '[]'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2.2 Groups Table (Batches / Classes)
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    group_type TEXT NOT NULL CHECK (group_type IN ('boys', 'girls')),
    code TEXT NOT NULL UNIQUE,
    password TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2.3 Group Members Table (Mapping users to groups with anonymous names)
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    anonymous_name TEXT NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_group_user UNIQUE (group_id, user_id)
);

-- 2.4 Messages Table (Group Discussions & Media)
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID NOT NULL REFERENCES public.groups(id) ON DELETE CASCADE,
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    message_text TEXT,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2.5 Shop Items Table
CREATE TABLE IF NOT EXISTS public.shop_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    item_type TEXT NOT NULL CHECK (item_type IN ('avatar', 'perk', 'theme')),
    price INTEGER DEFAULT 0 NOT NULL,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2.6 User Purchases Table
CREATE TABLE IF NOT EXISTS public.user_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES public.shop_items(id) ON DELETE CASCADE,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    CONSTRAINT unique_user_item UNIQUE (user_id, item_id)
);

-- 2.7 Site Settings Table (Admin & Security Configurations)
CREATE TABLE IF NOT EXISTS public.site_settings (
    id TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2.8 User Bans Table (Security & Moderation)
CREATE TABLE IF NOT EXISTS public.user_bans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    username TEXT,
    user_ip TEXT,
    banned_by TEXT DEFAULT 'admin',
    reason TEXT DEFAULT 'Violation of community guidelines',
    ban_type TEXT DEFAULT 'permanent' CHECK (ban_type IN ('temporary', 'permanent')),
    banned_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2.9 Battles Table (1v1 Live Arena)
CREATE TABLE IF NOT EXISTS public.battles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    player1_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    player2_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    player1_score INTEGER DEFAULT 0 NOT NULL,
    player2_score INTEGER DEFAULT 0 NOT NULL,
    status TEXT DEFAULT 'waiting' CHECK (status IN ('waiting', 'active', 'finished')) NOT NULL,
    current_question_index INTEGER DEFAULT 0 NOT NULL,
    winner_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    finished_at TIMESTAMP WITH TIME ZONE
);

-- 2.10 Battle Queue Table (1v1 Matchmaking)
CREATE TABLE IF NOT EXISTS public.battle_queue (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE UNIQUE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- 2.11 AI Generated Notes History (Optional Persistent Storage for Student Notes)
CREATE TABLE IF NOT EXISTS public.ai_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    note_type TEXT DEFAULT 'short' CHECK (note_type IN ('short', 'long')),
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- ==============================================================================
-- 3. INDEXES FOR HIGH-PERFORMANCE QUERYING
-- ==============================================================================

-- Trigram Index for fuzzy/instant username search
CREATE INDEX IF NOT EXISTS idx_users_username_trgm ON public.users USING gin (username gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_username_lower ON public.users (lower(username));
CREATE INDEX IF NOT EXISTS idx_users_xp ON public.users (xp DESC);

-- Foreign Key & Filter Indexes
CREATE INDEX IF NOT EXISTS idx_group_members_group_id ON public.group_members (group_id);
CREATE INDEX IF NOT EXISTS idx_group_members_user_id ON public.group_members (user_id);
CREATE INDEX IF NOT EXISTS idx_messages_group_id ON public.messages (group_id, created_at ASC);
CREATE INDEX IF NOT EXISTS idx_user_purchases_user_id ON public.user_purchases (user_id);
CREATE INDEX IF NOT EXISTS idx_user_bans_user_id ON public.user_bans (user_id);
CREATE INDEX IF NOT EXISTS idx_user_bans_user_ip ON public.user_bans (user_ip);
CREATE INDEX IF NOT EXISTS idx_battles_players ON public.battles (player1_id, player2_id);
CREATE INDEX IF NOT EXISTS idx_battles_status ON public.battles (status);
CREATE INDEX IF NOT EXISTS idx_ai_notes_user_id ON public.ai_notes (user_id);

-- ==============================================================================
-- 4. ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================

ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_bans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.battle_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_notes ENABLE ROW LEVEL SECURITY;

-- Clean existing policies safely
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Enable all access for users" ON public.users;
    DROP POLICY IF EXISTS "Enable all access for groups" ON public.groups;
    DROP POLICY IF EXISTS "Enable all access for group_members" ON public.group_members;
    DROP POLICY IF EXISTS "Enable all access for messages" ON public.messages;
    DROP POLICY IF EXISTS "Enable all access for shop_items" ON public.shop_items;
    DROP POLICY IF EXISTS "Enable all access for user_purchases" ON public.user_purchases;
    DROP POLICY IF EXISTS "Enable all access for site_settings" ON public.site_settings;
    DROP POLICY IF EXISTS "Enable all access for user_bans" ON public.user_bans;
    DROP POLICY IF EXISTS "Enable all access for battles" ON public.battles;
    DROP POLICY IF EXISTS "Enable all access for battle_queue" ON public.battle_queue;
    DROP POLICY IF EXISTS "Enable all access for ai_notes" ON public.ai_notes;
END $$;

-- Policy creation (Compatible with app's custom student session system)
CREATE POLICY "Enable all access for users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for groups" ON public.groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for group_members" ON public.group_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for shop_items" ON public.shop_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for user_purchases" ON public.user_purchases FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for site_settings" ON public.site_settings FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for user_bans" ON public.user_bans FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for battles" ON public.battles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for battle_queue" ON public.battle_queue FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for ai_notes" ON public.ai_notes FOR ALL USING (true) WITH CHECK (true);

-- ==============================================================================
-- 5. STORAGE BUCKET & POLICIES
-- ==============================================================================

-- Create bucket 'Images only' if it doesn't already exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('Images only', 'Images only', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Storage Policies
DROP POLICY IF EXISTS "Public View" ON storage.objects;
CREATE POLICY "Public View" ON storage.objects FOR SELECT USING (bucket_id = 'Images only');

DROP POLICY IF EXISTS "Any Upload" ON storage.objects;
CREATE POLICY "Any Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'Images only');

DROP POLICY IF EXISTS "Any Delete" ON storage.objects;
CREATE POLICY "Any Delete" ON storage.objects FOR DELETE USING (bucket_id = 'Images only');

-- ==============================================================================
-- 6. REALTIME SUBSCRIPTIONS
-- ==============================================================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'users') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'groups') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.groups;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'messages') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'site_settings') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'user_bans') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_bans;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'battles') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.battles;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'battle_queue') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.battle_queue;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'shop_items') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.shop_items;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname = 'supabase_realtime' AND tablename = 'user_purchases') THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.user_purchases;
    END IF;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- ==============================================================================
-- 7. INITIAL SEED DATA
-- ==============================================================================

-- 7.1 Default Site Passwords / Settings
INSERT INTO public.site_settings (id, value, updated_at) VALUES
('boys_section_password', 'boys123', NOW()),
('girls_section_password', 'girls123', NOW()),
('master_password', 'admin123', NOW())
ON CONFLICT (id) DO NOTHING;

-- 7.2 Shop Items (Avatars, Bundles, and Perks)
INSERT INTO public.shop_items (id, name, item_type, price, image_url) VALUES
('b01a3333-3333-4333-a333-333333333333', 'Bilal Elite', 'avatar', 200, '/avatars/boy3.png'),
('b01a4444-4444-4444-a444-444444444444', 'Hassan Prime', 'avatar', 200, '/avatars/boy4.png'),
('b01a5555-5555-4555-a555-555555555555', 'Hamza Ultra', 'avatar', 250, '/avatars/boy5.png'),
('b01a6666-6666-4666-a666-666666666666', 'Farhan Pro', 'avatar', 250, '/avatars/boy6.png'),
('b01a7777-7777-4777-a777-777777777777', 'Asad Pro Max', 'avatar', 300, '/avatars/boy7.png'),
('b01a8888-8888-4888-a888-888888888888', 'Abdullah King', 'avatar', 300, '/avatars/boy8.png'),
('c01a3333-3333-4333-a333-333333333333', 'Zara Elite', 'avatar', 200, '/avatars/girl3.png'),
('c01a4444-4444-4444-a444-444444444444', 'Noor Prime', 'avatar', 200, '/avatars/girl4.png'),
('c01a5555-5555-4555-a555-555555555555', 'Layla Apex', 'avatar', 250, '/avatars/girl5.png'),
('c01a6666-6666-4666-a666-666666666666', 'Aysha Elite', 'avatar', 250, '/avatars/girl6.png'),
('c01a7777-7777-4777-a777-777777777777', 'Insha Ultimate', 'avatar', 300, '/avatars/girl7.png'),
('c01a8888-8888-4888-a888-888888888888', 'Amna Ultra', 'avatar', 300, '/avatars/girl8.png'),
('d01a5555-5555-4555-a555-555555555555', 'Hint Protocol Bundle', 'perk', 150, null),
('e01a6666-6666-4666-a666-666666666666', 'Life Support Refill', 'perk', 100, null),
('d01a7777-7777-4777-a777-777777777777', 'Double XP Boost', 'perk', 300, null)
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  price = EXCLUDED.price,
  image_url = EXCLUDED.image_url;

-- ==============================================================================
-- SCHEMA REBUILD COMPLETE
-- ==============================================================================
