import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn('Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY. Add them to .env to enable Supabase.')
}

// Storage that works in private/incognito: use localStorage when possible,
// fall back to sessionStorage so the session persists for the tab when localStorage is blocked.
function getAuthStorage () {
  const tryStorage = (s) => {
    try {
      const k = '__supabase_test__'
      s.setItem(k, '1')
      s.removeItem(k)
      return s
    } catch (_) {
      return null
    }
  }
  const local = typeof localStorage !== 'undefined' ? tryStorage(localStorage) : null
  const session = typeof sessionStorage !== 'undefined' ? tryStorage(sessionStorage) : null
  const storage = local || session || null
  if (!storage) return undefined
  return {
    getItem: (key) => storage.getItem(key),
    setItem: (key, value) => { try { storage.setItem(key, value) } catch (_) {} },
    removeItem: (key) => { try { storage.removeItem(key) } catch (_) {} }
  }
}

const authOptions = {
  persistSession: true,
  autoRefreshToken: true,
  detectSessionInUrl: true
}
const storage = getAuthStorage()
if (storage) authOptions.storage = storage

export const supabase = (supabaseUrl && supabaseAnonKey)
  ? createClient(supabaseUrl, supabaseAnonKey, { auth: authOptions })
  : null
