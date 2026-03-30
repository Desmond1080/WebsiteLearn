import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://totowvmreerdaslcskyk.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRvdG93dm1yZWVyZGFzbGNza3lrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzQ4NDg4MDYsImV4cCI6MjA5MDQyNDgwNn0.yxRF1JABH4bEr_bvstd_jNHJ8EBZEGgJ2u1XhfVnsF0'

if (!supabaseUrl || !supabaseKey) {
	throw new Error('Missing Supabase env vars: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY')
}

export const supabase = createClient(supabaseUrl, supabaseKey)