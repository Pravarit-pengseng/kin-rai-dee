-- ==============================================================================
-- Migration: Fix Anonymous (Unauthenticated) SELECT RLS Policies
-- Version: 20261116010000
-- Fixes feed & profile loading when user is not logged in (anon role):
--   public.is_admin() has EXECUTE revoked from anon, so calling it inside
--   shared SELECT policies causes "permission denied for function is_admin"
--   for unauthenticated visitors. Split SELECT policies into `anon` (no
--   is_admin() / auth.uid() calls) and `authenticated`.
-- ==============================================================================

-- ── 1. public.posts ───────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view active posts" ON public.posts;
DROP POLICY IF EXISTS "Anon can view active posts" ON public.posts;

CREATE POLICY "Anon can view active posts"
  ON public.posts FOR SELECT
  TO anon
  USING (COALESCE(is_hidden, FALSE) = FALSE);

CREATE POLICY "Users can view active posts"
  ON public.posts FOR SELECT
  TO authenticated
  USING (
    (
      COALESCE(is_hidden, FALSE) = FALSE
      OR auth.uid() = user_id
      OR public.is_admin()
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_users
      WHERE blocker_id = auth.uid() AND blocked_id = posts.user_id
    )
  );

-- ── 2. public.profiles ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view active profiles" ON public.profiles;
DROP POLICY IF EXISTS "Anon can view active profiles" ON public.profiles;

CREATE POLICY "Anon can view active profiles"
  ON public.profiles FOR SELECT
  TO anon
  USING (COALESCE(is_suspended, FALSE) = FALSE);

CREATE POLICY "Users can view active profiles"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (
    COALESCE(is_suspended, FALSE) = FALSE
    OR auth.uid() = id
    OR public.is_admin()
  );

-- ── 3. public.comments ────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Users can view active comments" ON public.comments;
DROP POLICY IF EXISTS "Anon can view active comments" ON public.comments;

CREATE POLICY "Anon can view active comments"
  ON public.comments FOR SELECT
  TO anon
  USING (COALESCE(is_hidden, FALSE) = FALSE);

CREATE POLICY "Users can view active comments"
  ON public.comments FOR SELECT
  TO authenticated
  USING (
    (
      COALESCE(is_hidden, FALSE) = FALSE
      OR auth.uid() = user_id
      OR public.is_admin()
    )
    AND NOT EXISTS (
      SELECT 1 FROM public.blocked_users
      WHERE blocker_id = auth.uid() AND blocked_id = comments.user_id
    )
  );

-- ── 4. public.community_rules ─────────────────────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view active community rules" ON public.community_rules;
DROP POLICY IF EXISTS "Anon can view active community rules" ON public.community_rules;

CREATE POLICY "Anon can view active community rules"
  ON public.community_rules FOR SELECT
  TO anon
  USING (is_active = TRUE);

CREATE POLICY "Anyone can view active community rules"
  ON public.community_rules FOR SELECT
  TO authenticated
  USING (is_active = TRUE OR public.is_admin());
