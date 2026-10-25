-- ==============================================================================
-- Migration: Enterprise Security Hardening & Row Level Security (RLS)
-- Version: 20261025030000
-- Covers:
--   1. Secure Helper Functions (is_admin, is_super_admin) with search_path protection
--   2. Least-Privilege Grants & Revokes on all public tables
--   3. Enable and enforce RLS across all tables
--   4. Block Filtering and Hidden Content filtering policies
--   5. Account Deletion PDPA / GDPR Privacy Protection
--   6. Storage Buckets RLS for avatars and posts
-- ==============================================================================

-- ── 1. Secure Helper Functions ────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
      AND is_active = TRUE
  );
$$;

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.admins
    WHERE user_id = auth.uid()
      AND role = 'super_admin'
      AND is_active = TRUE
  );
$$;

REVOKE EXECUTE ON FUNCTION public.is_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated, service_role;

REVOKE EXECUTE ON FUNCTION public.is_super_admin() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated, service_role;


-- ── 2. Least-Privilege Grants & Revokes ──────────────────────────────────────
-- Master catalogs: read-only for public, modifications strictly by service_role
REVOKE DELETE, TRUNCATE, INSERT, UPDATE ON TABLE public.community_rules FROM anon, authenticated, PUBLIC;
REVOKE DELETE, TRUNCATE, INSERT, UPDATE ON TABLE public.categories FROM anon, authenticated, PUBLIC;
REVOKE DELETE, TRUNCATE, INSERT, UPDATE ON TABLE public.foods FROM anon, authenticated, PUBLIC;
REVOKE DELETE, TRUNCATE, INSERT, UPDATE ON TABLE public.ingredients FROM anon, authenticated, PUBLIC;
REVOKE DELETE, TRUNCATE, INSERT, UPDATE ON TABLE public.ingredient_categories FROM anon, authenticated, PUBLIC;

GRANT SELECT ON TABLE public.community_rules TO anon, authenticated;
GRANT SELECT ON TABLE public.categories TO anon, authenticated;
GRANT SELECT ON TABLE public.foods TO anon, authenticated;
GRANT SELECT ON TABLE public.ingredients TO anon, authenticated;
GRANT SELECT ON TABLE public.ingredient_categories TO anon, authenticated;

-- Admin & Audit tables: restrict public access
REVOKE ALL ON TABLE public.admins FROM anon, PUBLIC;
REVOKE ALL ON TABLE public.audit_logs FROM anon, PUBLIC;
REVOKE ALL ON TABLE public.moderation_actions FROM anon, PUBLIC;

GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON TABLE public.admins TO authenticated;
GRANT SELECT ON TABLE public.audit_logs TO authenticated;
GRANT SELECT, INSERT ON TABLE public.moderation_actions TO authenticated;


-- ── 3. Enable Row Level Security (RLS) on ALL Tables ─────────────────────────
ALTER TABLE public.community_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredients ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ingredient_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appeals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.account_deletion_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;


-- ── 4. RLS Policies: Master Catalogs ──────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can read active community rules" ON public.community_rules;
CREATE POLICY "Anyone can read active community rules"
  ON public.community_rules FOR SELECT
  USING (is_active = TRUE OR public.is_admin());

DROP POLICY IF EXISTS "Admins can manage community rules" ON public.community_rules;
CREATE POLICY "Admins can manage community rules"
  ON public.community_rules FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

DROP POLICY IF EXISTS "Anyone can read categories" ON public.categories;
CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read foods" ON public.foods;
CREATE POLICY "Anyone can read foods" ON public.foods FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read ingredients" ON public.ingredients;
CREATE POLICY "Anyone can read ingredients" ON public.ingredients FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can read ingredient_categories" ON public.ingredient_categories;
CREATE POLICY "Anyone can read ingredient_categories" ON public.ingredient_categories FOR SELECT USING (true);


-- ── 5. RLS Policies: Admins Table ────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can view their own record" ON public.admins;
CREATE POLICY "Admins can view their own record"
  ON public.admins FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Super Admins can manage admins" ON public.admins;
CREATE POLICY "Super Admins can manage admins"
  ON public.admins FOR ALL
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());


-- ── 6. RLS Policies: Audit Logs (Strict Admin-Only) ─────────────────────────
DROP POLICY IF EXISTS "Admins can view audit logs" ON public.audit_logs;
CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins and service role can insert audit logs" ON public.audit_logs;
CREATE POLICY "Admins and service role can insert audit logs"
  ON public.audit_logs FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());


-- ── 7. RLS Policies: Moderation Actions (Admin-Only) ────────────────────────
DROP POLICY IF EXISTS "Admins can view moderation actions" ON public.moderation_actions;
CREATE POLICY "Admins can view moderation actions"
  ON public.moderation_actions FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can insert moderation actions" ON public.moderation_actions;
CREATE POLICY "Admins can insert moderation actions"
  ON public.moderation_actions FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());


-- ── 8. RLS Policies: Reports (UGC Safety) ───────────────────────────────────
DROP POLICY IF EXISTS "Users can submit reports" ON public.reports;
CREATE POLICY "Users can submit reports"
  ON public.reports FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Users can view their own reports" ON public.reports;
CREATE POLICY "Users can view their own reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (auth.uid() = reporter_id);

DROP POLICY IF EXISTS "Admins can view all reports" ON public.reports;
CREATE POLICY "Admins can view all reports"
  ON public.reports FOR SELECT
  TO authenticated
  USING (public.is_admin());

DROP POLICY IF EXISTS "Admins can update reports" ON public.reports;
CREATE POLICY "Admins can update reports"
  ON public.reports FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ── 9. RLS Policies: Appeals (Owner + Admin) ────────────────────────────────
DROP POLICY IF EXISTS "Users can view their own appeals" ON public.appeals;
CREATE POLICY "Users can view their own appeals"
  ON public.appeals FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can submit appeals" ON public.appeals;
CREATE POLICY "Users can submit appeals"
  ON public.appeals FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can update appeals" ON public.appeals;
CREATE POLICY "Admins can update appeals"
  ON public.appeals FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ── 10. RLS Policies: Blocked Users (Personal Privacy) ───────────────────────
DROP POLICY IF EXISTS "Users can view their own blocked users" ON public.blocked_users;
CREATE POLICY "Users can view their own blocked users"
  ON public.blocked_users FOR SELECT
  TO authenticated
  USING (auth.uid() = blocker_id);

DROP POLICY IF EXISTS "Users can block other users" ON public.blocked_users;
CREATE POLICY "Users can block other users"
  ON public.blocked_users FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = blocker_id AND blocker_id != blocked_id);

DROP POLICY IF EXISTS "Users can unblock users" ON public.blocked_users;
CREATE POLICY "Users can unblock users"
  ON public.blocked_users FOR DELETE
  TO authenticated
  USING (auth.uid() = blocker_id);


-- ── 11. RLS Policies: Comments (Integrity, Block Filtering & Anti-Abuse) ─────
DROP POLICY IF EXISTS "Users can view comments" ON public.comments;
CREATE POLICY "Users can view comments"
  ON public.comments FOR SELECT
  USING (
    (
      is_hidden = FALSE 
      OR auth.uid() = user_id 
      OR public.is_admin()
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_users
      WHERE blocker_id = auth.uid() AND blocked_id = comments.user_id
    )
  );

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON public.comments;
CREATE POLICY "Users can update their own comments"
  ON public.comments FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Users can delete their own comments" ON public.comments;
CREATE POLICY "Users can delete their own comments"
  ON public.comments FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin());


-- ── 12. RLS Policies: Posts (Hidden Content & Block Enforcement) ─────────────
DROP POLICY IF EXISTS "Users can view active posts" ON public.posts;
CREATE POLICY "Users can view active posts"
  ON public.posts FOR SELECT
  USING (
    (
      is_hidden = FALSE 
      OR auth.uid() = user_id 
      OR public.is_admin()
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_users
      WHERE blocker_id = auth.uid() AND blocked_id = posts.user_id
    )
  );

DROP POLICY IF EXISTS "Admins can update posts visibility" ON public.posts;
CREATE POLICY "Admins can update posts visibility"
  ON public.posts FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id OR public.is_admin())
  WITH CHECK (auth.uid() = user_id OR public.is_admin());


-- ── 13. RLS Policies: Account Deletion Requests (PDPA & GDPR Data Privacy) ───
DROP POLICY IF EXISTS "allow_submit_deletion_request" ON public.account_deletion_requests;
CREATE POLICY "allow_submit_deletion_request"
  ON public.account_deletion_requests FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "allow_view_own_deletion_request" ON public.account_deletion_requests;
CREATE POLICY "allow_view_own_deletion_request"
  ON public.account_deletion_requests FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id 
    OR email = (auth.jwt()->>'email') 
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "admins_manage_deletion_requests" ON public.account_deletion_requests;
CREATE POLICY "admins_manage_deletion_requests"
  ON public.account_deletion_requests FOR UPDATE
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());


-- ── 14. Storage Buckets & Policies ───────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('avatars', 'avatars', true),
    ('posts', 'posts', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Anyone can view avatars" ON storage.objects;
CREATE POLICY "Anyone can view avatars" ON storage.objects
  FOR SELECT TO PUBLIC
  USING (bucket_id = 'avatars');

DROP POLICY IF EXISTS "Users can upload their own avatars" ON storage.objects;
CREATE POLICY "Users can upload their own avatars" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their own avatars" ON storage.objects;
CREATE POLICY "Users can update their own avatars" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their own avatars" ON storage.objects;
CREATE POLICY "Users can delete their own avatars" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Anyone can view post images" ON storage.objects;
CREATE POLICY "Anyone can view post images" ON storage.objects
  FOR SELECT TO PUBLIC
  USING (bucket_id = 'posts');

DROP POLICY IF EXISTS "Users can upload their own post images" ON storage.objects;
CREATE POLICY "Users can upload their own post images" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'posts' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their own post images" ON storage.objects;
CREATE POLICY "Users can update their own post images" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'posts' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their own post images" ON storage.objects;
CREATE POLICY "Users can delete their own post images" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'posts' AND (storage.foldername(name))[1] = auth.uid()::text);
