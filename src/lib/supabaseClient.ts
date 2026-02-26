import { createClient } from '@supabase/supabase-js'
// import type { Database } from '../types/supabase' // This will be your auto-generated types

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase Environment Variables')
}

// Initializing the client with TypeScript support
export const supabase = createClient(supabaseUrl, supabaseAnonKey)