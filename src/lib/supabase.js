import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

export function getUserId() {
  let id = localStorage.getItem('moustique_user_id')
  if (!id) {
    id = crypto.randomUUID()
    localStorage.setItem('moustique_user_id', id)
  }
  return id
}
