import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://ckkuyhpdrqwthqgifpnk.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'sb_publishable_elBMw2lLUBxrjDo5lN9pUA_6bmtA_PO';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export const SUPABASE_CONNECTED_URL = supabaseUrl;
