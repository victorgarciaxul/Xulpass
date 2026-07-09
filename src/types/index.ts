export type Category = 'web' | 'app' | 'email' | 'social' | 'banking' | 'server' | 'other'

export interface VaultEntry {
  id: string
  user_id: string
  project_id: string | null
  title: string
  username: string
  encrypted_password: string
  url: string | null
  category: Category
  notes: string | null
  favorite: boolean
  created_at: string
  updated_at: string
  shared_by_email?: string
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

export interface Project {
  id: string
  name: string
  description: string | null
  color: string
  owner_id: string
  created_at: string
  updated_at: string
  member_count?: number
  entry_count?: number
}

export interface ProjectMember {
  id: string
  project_id: string
  user_id: string
  role: 'owner' | 'member'
  created_at: string
  email?: string
}
