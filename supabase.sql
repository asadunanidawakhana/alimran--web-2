-- Al Imran Tense Learner Database Schema
-- Run this in your Supabase SQL Editor

-- 1. Users Table
CREATE TABLE IF NOT EXISTS public.users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    username TEXT NOT NULL,
    avatar_url TEXT,
    xp INTEGER DEFAULT 0,
    level INTEGER DEFAULT 1,
    current_streak INTEGER DEFAULT 0,
    hearts INTEGER DEFAULT 5,
    role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Groups Table (Batches)
CREATE TABLE IF NOT EXISTS public.groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    group_type TEXT NOT NULL CHECK (group_type IN ('boys', 'girls')),
    code TEXT NOT NULL UNIQUE,
    password TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Group Members (Mapping users to groups with anonymous names)
CREATE TABLE IF NOT EXISTS public.group_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    anonymous_name TEXT NOT NULL,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(group_id, user_id)
);

-- 4. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    group_id UUID REFERENCES public.groups(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    message_text TEXT,
    file_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. Shop Items Table
CREATE TABLE IF NOT EXISTS public.shop_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    item_type TEXT NOT NULL CHECK (item_type IN ('avatar', 'perk', 'theme')),
    price INTEGER NOT NULL DEFAULT 0,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Seed Shop Items
TRUNCATE public.shop_items CASCADE;
INSERT INTO public.shop_items (name, item_type, price, image_url) VALUES
('Pro Boy Alpha', 'avatar', 100, '/avatars/boy1.png'),
('Pro Boy Sigma', 'avatar', 150, '/avatars/boy2.png'),
('Pro Girl Alpha', 'avatar', 100, '/avatars/girl1.png'),
('Pro Girl Sigma', 'avatar', 150, '/avatars/girl2.png'),
('Streak Freezer', 'perk', 150, null),
('XP Boost x2', 'perk', 300, null),
('Dark Mode', 'theme', 500, null),
('Neon Mode', 'theme', 700, null);

-- 6. User Purchases Table
CREATE TABLE IF NOT EXISTS public.user_purchases (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    item_id UUID REFERENCES public.shop_items(id) ON DELETE CASCADE,
    purchased_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, item_id)
);

-- Enable RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.group_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_purchases ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all access (simplified for this app)
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Enable all access for users" ON public.users;
    DROP POLICY IF EXISTS "Enable all access for groups" ON public.groups;
    DROP POLICY IF EXISTS "Enable all access for group_members" ON public.group_members;
    DROP POLICY IF EXISTS "Enable all access for messages" ON public.messages;
    DROP POLICY IF EXISTS "Enable all access for shop_items" ON public.shop_items;
    
    DROP POLICY IF EXISTS "Enable all access for user_purchases" ON public.user_purchases;
END $$;

CREATE POLICY "Enable all access for users" ON public.users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for groups" ON public.groups FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for group_members" ON public.group_members FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for messages" ON public.messages FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for shop_items" ON public.shop_items FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Enable all access for user_purchases" ON public.user_purchases FOR ALL USING (true) WITH CHECK (true);

-- 7. Site Settings Table
CREATE TABLE IF NOT EXISTS public.site_settings (
    id TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

INSERT INTO public.site_settings (id, value) VALUES
('boys_section_password', 'boys123'),
('girls_section_password', 'girls123'),
('master_password', 'admin123')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for site_settings" ON public.site_settings;
CREATE POLICY "Enable all access for site_settings" ON public.site_settings FOR ALL USING (true) WITH CHECK (true);

-- 8. STORAGE POLICIES (Fixes the Image Upload Error)
-- Ensure bucket exists
INSERT INTO storage.buckets (id, name, public) 
VALUES ('Images only', 'Images only', true)
ON CONFLICT (id) DO NOTHING;

-- Policy for Public View
DROP POLICY IF EXISTS "Public View" ON storage.objects;
CREATE POLICY "Public View" ON storage.objects FOR SELECT USING (bucket_id = 'Images only');

-- Policy for Upload (Allow all for simplicity, as we don't use Auth users)
DROP POLICY IF EXISTS "Any Upload" ON storage.objects;
CREATE POLICY "Any Upload" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'Images only');

-- Policy for Delete
DROP POLICY IF EXISTS "Any Delete" ON storage.objects;
CREATE POLICY "Any Delete" ON storage.objects FOR DELETE USING (bucket_id = 'Images only');

-- Enable Realtime
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.users;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.groups;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
    ALTER PUBLICATION supabase_realtime ADD TABLE public.site_settings;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;
