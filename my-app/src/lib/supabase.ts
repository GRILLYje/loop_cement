import { createClient } from '@supabase/supabase-js'

// Supabase configuration
const SUPABASE_URL = 'https://hdmzjytalrkjmkeyuwku.supabase.co'
const SUPABASE_KEY = 'sb_publishable_ij-BFLEB0bxeEDtl4raz5A_r80RCfN0'

// Create Supabase client
export const supabase = createClient(SUPABASE_URL, SUPABASE_KEY)

// Database table structure should be:
// CREATE TABLE timers (
//   id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
//   name TEXT NOT NULL,
//   initial_seconds INTEGER NOT NULL,
//   remaining_seconds INTEGER NOT NULL,
//   status TEXT NOT NULL CHECK (status IN ('idle', 'running', 'paused', 'finished')),
//   created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
//   updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
// );
