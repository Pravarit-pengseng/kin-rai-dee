-- Migration: Create public.admins table for Admin Role & Permission Management
-- Enables Table Editor GUI in Supabase Studio to manage admin roles easily

CREATE TABLE IF NOT EXISTS public.admins (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    role VARCHAR(50) NOT NULL DEFAULT 'admin' CHECK (role IN ('super_admin', 'admin', 'moderator')),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT admins_user_id_unique UNIQUE (user_id),
    CONSTRAINT admins_email_unique UNIQUE (email)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_admins_user_id ON public.admins (user_id);
CREATE INDEX IF NOT EXISTS idx_admins_is_active ON public.admins (is_active);

-- Enable Row Level Security (RLS)
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;

-- Restrict SELECT so users can only view their own admin record (prevents admin enumeration)
DROP POLICY IF EXISTS "Allow authenticated read admins" ON public.admins;
DROP POLICY IF EXISTS "Admins can view their own record" ON public.admins;
CREATE POLICY "Admins can view their own record" ON public.admins
    FOR SELECT TO authenticated
    USING (user_id = auth.uid());

-- Allow service_role full control
GRANT ALL ON TABLE public.admins TO postgres, service_role;
GRANT SELECT ON TABLE public.admins TO anon, authenticated;

-- Seed initial admin accounts
INSERT INTO public.admins (user_id, email, name, role, is_active)
SELECT id, email, COALESCE(raw_user_meta_data->>'display_name', email), 'super_admin', TRUE
FROM auth.users
WHERE email = 'admin@kinraidee.app'
ON CONFLICT (user_id) DO UPDATE SET is_active = TRUE, role = 'super_admin';

INSERT INTO public.admins (user_id, email, name, role, is_active)
SELECT id, email, COALESCE(raw_user_meta_data->>'display_name', 'Admin User'), 'super_admin', TRUE
FROM auth.users
WHERE email = 'admin@gmail.com'
ON CONFLICT (user_id) DO UPDATE SET is_active = TRUE, role = 'super_admin';

INSERT INTO public.admins (user_id, email, name, role, is_active)
SELECT id, email, 'แอดมินเอก', 'moderator', TRUE
FROM auth.users
WHERE email = 'mod.aek@kinraidee.app'
ON CONFLICT (user_id) DO UPDATE SET is_active = TRUE, role = 'moderator';

INSERT INTO public.admins (user_id, email, name, role, is_active)
SELECT id, email, 'แอดมินปอนด์', 'moderator', TRUE
FROM auth.users
WHERE email = 'support.pond@kinraidee.app'
ON CONFLICT (user_id) DO UPDATE SET is_active = TRUE, role = 'moderator';
