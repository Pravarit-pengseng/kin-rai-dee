-- ==============================================================================
-- Migration: RLS Policy Cleanup, Column Tampering Protection & DB Validation
-- Version: 20261116000000
-- Fixes remaining direct-Supabase security gaps before production:
--   1. Drop legacy permissive SELECT policies ("Anyone can view posts" / "Anyone can view profiles")
--   2. Prevent non-admin users from tampering with moderation columns (is_suspended, is_hidden)
--   3. Enforce length/URL CHECK constraints on posts & comments + block-check on comment INSERT
-- ==============================================================================

-- ── 1. Drop Legacy Permissive SELECT Policies ─────────────────────────────────
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
DROP POLICY IF EXISTS "Anyone can view profiles" ON public.profiles;

DROP POLICY IF EXISTS "Users can view active profiles" ON public.profiles;
CREATE POLICY "Users can view active profiles"
  ON public.profiles FOR SELECT
  USING (
    is_suspended = FALSE
    OR auth.uid() = id
    OR public.is_admin()
  );


-- ── 2. Prevent Non-Admin Tampering With Moderation Columns ────────────────────
CREATE OR REPLACE FUNCTION public.prevent_moderation_column_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.role() = 'service_role' OR public.is_admin() THEN
    RETURN NEW;
  END IF;

  IF TG_TABLE_NAME = 'profiles' AND NEW.is_suspended IS DISTINCT FROM OLD.is_suspended THEN
    RAISE EXCEPTION 'Only admins can modify is_suspended'
      USING ERRCODE = '42501';
  END IF;

  IF TG_TABLE_NAME IN ('posts', 'comments') AND NEW.is_hidden IS DISTINCT FROM OLD.is_hidden THEN
    RAISE EXCEPTION 'Only admins can modify is_hidden'
      USING ERRCODE = '42501';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_profiles_prevent_moderation_tampering ON public.profiles;
CREATE TRIGGER trg_profiles_prevent_moderation_tampering
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_moderation_column_tampering();

DROP TRIGGER IF EXISTS trg_posts_prevent_moderation_tampering ON public.posts;
CREATE TRIGGER trg_posts_prevent_moderation_tampering
  BEFORE UPDATE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_moderation_column_tampering();

DROP TRIGGER IF EXISTS trg_comments_prevent_moderation_tampering ON public.comments;
CREATE TRIGGER trg_comments_prevent_moderation_tampering
  BEFORE UPDATE ON public.comments
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_moderation_column_tampering();


-- ── 3. DB-Level Validation Constraints (Mirroring Backend Rules) ──────────────
-- Use NOT VALID so existing legacy rows do not block migration while all new writes are enforced.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'posts_food_name_length_chk'
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_food_name_length_chk
      CHECK (char_length(btrim(food_name)) BETWEEN 1 AND 200) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'posts_description_length_chk'
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_description_length_chk
      CHECK (description IS NULL OR char_length(description) <= 2000) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'posts_restaurant_url_chk'
  ) THEN
    ALTER TABLE public.posts
      ADD CONSTRAINT posts_restaurant_url_chk
      CHECK (
        restaurant_url IS NULL
        OR (
          char_length(restaurant_url) <= 500
          AND restaurant_url !~* '^\s*(javascript|data|vbscript):'
        )
      ) NOT VALID;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'comments_content_length_chk'
  ) THEN
    ALTER TABLE public.comments
      ADD CONSTRAINT comments_content_length_chk
      CHECK (char_length(btrim(content)) BETWEEN 1 AND 1000) NOT VALID;
  END IF;
END;
$$;


-- ── 4. Block-Check Enforcement on Comment INSERT ──────────────────────────────
DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.comments;
CREATE POLICY "Authenticated users can create comments"
  ON public.comments FOR INSERT
  TO authenticated
  WITH CHECK (
    auth.uid() = user_id
    AND NOT EXISTS (
      SELECT 1
      FROM public.posts p
      JOIN public.blocked_users b
        ON (b.blocker_id = auth.uid() AND b.blocked_id = p.user_id)
        OR (b.blocker_id = p.user_id AND b.blocked_id = auth.uid())
      WHERE p.id = comments.post_id
    )
  );
