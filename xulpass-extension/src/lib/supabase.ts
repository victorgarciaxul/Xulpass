import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'https://kyaaqlumpsuwukfxltht.supabase.co'
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imt5YWFxbHVtcHN1d3VrZnhsdGh0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIxNTgzOTEsImV4cCI6MjA5NzczNDM5MX0.vjXH9N7oEXiJq1s_L1xQtGKhBxr6qrrjhiEvVwx7OcM'

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: {
      getItem: (key) => new Promise(resolve => chrome.storage.local.get(key, r => resolve(r[key] ?? null))),
      setItem: (key, value) => new Promise(resolve => chrome.storage.local.set({ [key]: value }, resolve)),
      removeItem: (key) => new Promise(resolve => chrome.storage.local.remove(key, resolve)),
    },
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  }
})
