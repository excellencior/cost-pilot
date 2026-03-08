-- ==========================================
-- COSTPILOT COMPLETE DATABASE REBUILD SCRIPT
-- ==========================================
-- WARNING: This will DELETE all existing data!
-- Execute this in the Supabase SQL Editor.

-- 1. CLEANUP (Drop existing tables and functions)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users CASCADE;
DROP TRIGGER IF EXISTS on_profile_update ON public.profiles CASCADE;
DROP TRIGGER IF EXISTS on_category_update ON public.categories CASCADE;
DROP TRIGGER IF EXISTS on_transaction_update ON public.transactions CASCADE;
DROP TRIGGER IF EXISTS enforce_deletion_time ON public.profiles CASCADE;

DROP TABLE IF EXISTS public.transactions CASCADE;
DROP TABLE IF EXISTS public.categories CASCADE;
DROP TABLE IF EXISTS public.device_agreements CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.protect_deletion_timestamp() CASCADE;

-- 2. CREATE TABLES

-- Profiles (Extends Supabase Auth)
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    currency TEXT DEFAULT 'USD',
    theme TEXT DEFAULT 'dark',
    deletion_scheduled_at TIMESTAMP WITH TIME ZONE,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Device Agreements (For Landing Page tracking)
CREATE TABLE public.device_agreements (
    device_id TEXT PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    agreed_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Categories
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    icon TEXT NOT NULL,
    color TEXT NOT NULL,
    type TEXT CHECK (type IN ('expense', 'income')) NOT NULL,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    
    UNIQUE(user_id, name, type)
);

-- Transactions
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    payload TEXT NOT NULL, -- Encrypted data
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ENABLE RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.device_agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- 4. POLICIES

-- Profiles
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Device Agreements
CREATE POLICY "Allow anon select by device id" ON public.device_agreements FOR SELECT USING (true);
CREATE POLICY "Allow authenticated insert" ON public.device_agreements FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Allow authenticated update" ON public.device_agreements FOR UPDATE USING (auth.uid() = user_id);

-- Categories
CREATE POLICY "Users can view own and default categories" ON public.categories 
    FOR SELECT USING (auth.uid() = user_id OR is_default = true);
CREATE POLICY "Users can insert own categories" ON public.categories 
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own categories" ON public.categories 
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own categories" ON public.categories 
    FOR DELETE USING (auth.uid() = user_id);

-- Transactions
CREATE POLICY "Users can view own transactions" ON public.transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.transactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own transactions" ON public.transactions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own transactions" ON public.transactions FOR DELETE USING (auth.uid() = user_id);

-- 5. FUNCTIONS & TRIGGERS

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_profile_update BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER on_category_update BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER on_transaction_update BEFORE UPDATE ON public.transactions FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on sign up
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Protect deletion timestamp
CREATE OR REPLACE FUNCTION public.protect_deletion_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.deletion_scheduled_at IS NOT NULL AND OLD.deletion_scheduled_at IS NULL THEN
        NEW.deletion_scheduled_at = timezone('utc'::text, now());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER enforce_deletion_time BEFORE UPDATE ON public.profiles FOR EACH ROW 
WHEN (NEW.deletion_scheduled_at IS DISTINCT FROM OLD.deletion_scheduled_at)
EXECUTE FUNCTION public.protect_deletion_timestamp();

-- 6. SYSTEM SEED (Matching constants.ts)
-- We insert these with is_default = true and user_id = null
INSERT INTO public.categories (id, name, icon, color, type, is_default, user_id)
VALUES 
    ('f31e7e8d-ca1c-41d2-a959-e2cd54c2369f', 'Food', 'restaurant', 'bg-red-100 text-red-500', 'expense', true, NULL),
    ('cd50c5be-a420-4d3d-bf65-53745d6b0d9c', 'Transport', 'directions_bus', 'bg-blue-100 text-blue-500', 'expense', true, NULL),
    ('44c528fb-bc17-4b27-85ac-fd9cae1fd30d', 'Groceries', 'shopping_cart', 'bg-orange-100 text-orange-500', 'expense', true, NULL),
    ('77f69086-8065-4185-a98d-31199de7a8d6', 'Entertainment', 'movie', 'bg-purple-100 text-purple-500', 'expense', true, NULL),
    ('c9b9c638-12d3-4acb-a020-27cfd3ce0657', 'Health', 'health_and_safety', 'bg-teal-100 text-teal-500', 'expense', true, NULL),
    ('f300dee1-39e6-4682-be3c-28ab03763a96', 'Shopping', 'shopping_bag', 'bg-indigo-100 text-indigo-500', 'expense', true, NULL),
    ('0eb33064-93bd-4a6c-bbce-4890bca55f9d', 'Salary', 'payments', 'bg-green-100 text-green-500', 'income', true, NULL),
    ('2365c2fd-4202-4851-b499-f70767d0f607', 'Investment', 'trending_up', 'bg-cyan-100 text-cyan-500', 'income', true, NULL)
ON CONFLICT (id) DO NOTHING;
