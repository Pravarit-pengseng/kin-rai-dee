-- Migration: Support string UUIDs in target_id for audit_logs and moderation_actions
ALTER TABLE public.audit_logs ALTER COLUMN target_id TYPE VARCHAR(100);
ALTER TABLE public.moderation_actions ALTER COLUMN target_id TYPE VARCHAR(100);
