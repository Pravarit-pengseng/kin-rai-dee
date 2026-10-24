INSERT INTO public.admins (user_id, email, name, role, is_active)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'super_admin', 'admin'), 
    'super_admin', -- สามารถเลือกเป็น 'super_admin', 'admin', หรือ 'moderator'
    TRUE
FROM auth.users
WHERE email = 'admin@gmail.com'  -- ระบุอีเมลของ User ที่ต้องการ
ON CONFLICT (user_id) DO UPDATE 
SET is_active = TRUE, role = 'super_admin';
