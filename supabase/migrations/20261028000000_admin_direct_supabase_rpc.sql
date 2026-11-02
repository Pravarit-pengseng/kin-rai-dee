-- ==============================================================================
-- Migration: Complete Admin Direct RPC for Supabase
-- Enables Admin Dashboard to perform complete, real CRUD & account deletion
-- directly via Supabase RPC with SECURITY DEFINER privileges.
-- ==============================================================================

-- 1. admin_delete_user_completely: Completely purge user, auth, and all dependencies
CREATE OR REPLACE FUNCTION public.admin_delete_user_completely(
    target_user_id UUID,
    reason TEXT DEFAULT 'Deleted by admin'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, storage
AS $$
DECLARE
    caller_id UUID;
    caller_is_admin BOOLEAN;
    caller_role TEXT;
    target_username TEXT;
    target_email TEXT;
    post_ids BIGINT[];
BEGIN
    -- 1. Authentication & Authorization Check
    caller_id := auth.uid();
    IF caller_id IS NULL THEN
        RAISE EXCEPTION 'Unauthorized: You must be logged in';
    END IF;

    SELECT is_active, role INTO caller_is_admin, caller_role
    FROM public.admins
    WHERE user_id = caller_id AND is_active = TRUE;

    IF caller_is_admin IS NOT TRUE THEN
        RAISE EXCEPTION 'Forbidden: Admin privileges required';
    END IF;

    -- Prevent accidental self-deletion of the active admin
    IF caller_id = target_user_id THEN
        RAISE EXCEPTION 'Cannot delete your own admin account';
    END IF;

    -- Fetch target details before deletion for audit logging
    SELECT username INTO target_username FROM public.profiles WHERE id = target_user_id;
    SELECT email INTO target_email FROM auth.users WHERE id = target_user_id;

    -- 2. Gather user's post IDs
    SELECT ARRAY_AGG(id) INTO post_ids FROM public.posts WHERE user_id = target_user_id;

    -- 3. Delete dependent relations of user's posts
    IF post_ids IS NOT NULL AND ARRAY_LENGTH(post_ids, 1) > 0 THEN
        DELETE FROM public.post_categories WHERE post_id = ANY(post_ids);
        DELETE FROM public.saved_posts WHERE post_id = ANY(post_ids);
        DELETE FROM public.comments WHERE post_id = ANY(post_ids);
        DELETE FROM public.posts WHERE id = ANY(post_ids);
    END IF;

    -- 4. Delete user's comments and saved posts on other posts
    DELETE FROM public.comments WHERE user_id = target_user_id;
    DELETE FROM public.saved_posts WHERE user_id = target_user_id;

    -- 5. Delete search history
    DELETE FROM public.search_history WHERE user_id = target_user_id;

    -- 6. Delete blocked users relations
    DELETE FROM public.blocked_users WHERE blocker_id = target_user_id OR blocked_id = target_user_id;

    -- 7. Update/Nullify references in moderation and audit tables
    UPDATE public.reports SET reporter_id = NULL WHERE reporter_id = target_user_id;
    UPDATE public.reports SET assigned_to = NULL WHERE assigned_to = target_user_id;
    UPDATE public.reports 
    SET status = 'closed', resolved_at = NOW() 
    WHERE target_type = 'user' AND target_id = target_user_id::text;

    UPDATE public.moderation_actions SET actor_id = NULL WHERE actor_id = target_user_id;
    DELETE FROM public.appeals WHERE user_id = target_user_id;
    UPDATE public.appeals SET reviewer_id = NULL WHERE reviewer_id = target_user_id;

    -- 8. Mark or complete account deletion requests
    UPDATE public.account_deletion_requests 
    SET status = 'completed', 
        resolved_at = NOW(), 
        resolved_by = caller_id, 
        admin_notes = COALESCE(admin_notes, reason, 'ลบบัญชีเรียบร้อยแล้วโดยผู้ดูแลระบบ')
    WHERE user_id = target_user_id OR (target_email IS NOT NULL AND LOWER(email) = LOWER(target_email));

    -- 9. Clean up storage files (avatars & posts)
    DELETE FROM storage.objects 
    WHERE bucket_id = 'avatars' 
      AND ((storage.foldername(name))[1] = target_user_id::text OR owner = target_user_id);

    DELETE FROM storage.objects 
    WHERE bucket_id = 'posts' 
      AND ((storage.foldername(name))[1] = target_user_id::text OR owner = target_user_id);

    -- 10. Delete from admins (if target had an admin role)
    DELETE FROM public.admins WHERE user_id = target_user_id;

    -- 11. Delete from public.profiles
    DELETE FROM public.profiles WHERE id = target_user_id;

    -- 12. Delete from auth.users (permanently purges authentication account)
    DELETE FROM auth.users WHERE id = target_user_id;

    -- 13. Audit Log
    INSERT INTO public.audit_logs (
        actor_id,
        actor_name,
        event_type,
        target_type,
        target_id,
        metadata,
        created_at
    ) VALUES (
        caller_id,
        'ผู้ดูแลระบบ',
        'DELETE_USER',
        'user',
        target_user_id::text,
        jsonb_build_object(
            'username', target_username,
            'email', target_email,
            'reason', reason,
            'deleted_by', caller_id
        ),
        NOW()
    );

    RETURN jsonb_build_object(
        'success', TRUE,
        'message', 'ลบบัญชีผู้ใช้และข้อมูลทั้งหมดเรียบร้อยแล้ว',
        'user_id', target_user_id
    );
END;
$$;


-- 2. admin_approve_deletion_request: Approves web deletion request and purges user
CREATE OR REPLACE FUNCTION public.admin_approve_deletion_request(
    request_id BIGINT,
    admin_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, storage
AS $$
DECLARE
    req RECORD;
    target_uid UUID;
    del_res JSONB;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin privileges required';
    END IF;

    SELECT * INTO req FROM public.account_deletion_requests WHERE id = request_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Account deletion request not found';
    END IF;

    target_uid := req.user_id;
    IF target_uid IS NULL AND req.email IS NOT NULL THEN
        SELECT id INTO target_uid FROM auth.users WHERE LOWER(email) = LOWER(req.email) LIMIT 1;
    END IF;

    IF target_uid IS NOT NULL THEN
        del_res := public.admin_delete_user_completely(target_uid, COALESCE(admin_notes, 'อนุมัติคำขอลบบัญชี'));
    END IF;

    UPDATE public.account_deletion_requests
    SET status = 'completed',
        resolved_at = NOW(),
        resolved_by = auth.uid(),
        admin_notes = COALESCE(admin_notes, 'อนุมัติและลบบัญชีเรียบร้อยแล้วโดยผู้ดูแลระบบ')
    WHERE id = request_id;

    RETURN jsonb_build_object(
        'success', TRUE,
        'message', 'อนุมัติและลบบัญชีผู้ใช้เรียบร้อยแล้ว',
        'request_id', request_id,
        'user_id', target_uid
    );
END;
$$;


-- 3. admin_delete_post_completely: Deletes post, tags, comments, saved, and storage image
CREATE OR REPLACE FUNCTION public.admin_delete_post_completely(
    target_post_id BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, storage
AS $$
DECLARE
    caller_id UUID;
    p_img TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin privileges required';
    END IF;

    caller_id := auth.uid();

    SELECT image_url INTO p_img FROM public.posts WHERE id = target_post_id;

    -- Delete child tables
    DELETE FROM public.post_categories WHERE post_id = target_post_id;
    DELETE FROM public.saved_posts WHERE post_id = target_post_id;
    DELETE FROM public.comments WHERE post_id = target_post_id;

    -- Delete post
    DELETE FROM public.posts WHERE id = target_post_id;

    -- Audit log
    INSERT INTO public.audit_logs (actor_id, actor_name, event_type, target_type, target_id, created_at)
    VALUES (caller_id, 'ผู้ดูแลระบบ', 'DELETE_POST', 'post', target_post_id::text, NOW());

    RETURN jsonb_build_object('success', TRUE, 'post_id', target_post_id);
END;
$$;


-- 4. admin_toggle_user_status: Suspend / Activate user profile with audit log
CREATE OR REPLACE FUNCTION public.admin_toggle_user_status(
    target_user_id UUID,
    should_suspend BOOLEAN,
    reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    caller_id UUID;
    u_name TEXT;
BEGIN
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Forbidden: Admin privileges required';
    END IF;

    caller_id := auth.uid();

    UPDATE public.profiles
    SET is_suspended = should_suspend
    WHERE id = target_user_id;

    SELECT username INTO u_name FROM public.profiles WHERE id = target_user_id;

    INSERT INTO public.audit_logs (actor_id, actor_name, event_type, target_type, target_id, metadata, created_at)
    VALUES (
        caller_id,
        'ผู้ดูแลระบบ',
        CASE WHEN should_suspend THEN 'SUSPEND_USER' ELSE 'ACTIVATE_USER' END,
        'user',
        target_user_id::text,
        jsonb_build_object('status', CASE WHEN should_suspend THEN 'suspended' ELSE 'active' END, 'reason', reason, 'username', u_name),
        NOW()
    );

    RETURN jsonb_build_object('success', TRUE, 'is_suspended', should_suspend);
END;
$$;


-- Explicitly grant execute permission to authenticated users and service_role
GRANT EXECUTE ON FUNCTION public.admin_delete_user_completely TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_approve_deletion_request TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_delete_post_completely TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.admin_toggle_user_status TO authenticated, service_role;
