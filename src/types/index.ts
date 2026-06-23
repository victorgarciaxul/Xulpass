export type Category = 'web' | 'app' | 'email' | 'social' | 'banking' | 'server' | 'other'

export interface VaultEntry {
  id: string
  user_id: string
  title: string
  username: string
  encrypted_password: string
  url: string | null
  category: Category
  notes: string | null
  favorite: boolean
  created_at: string
  updated_at: string
}

export interface VaultEntryForm {
  title: string
  username: string
  password: string
  url: string
  category: Category
  notes: string
  favorite: boolean
}
