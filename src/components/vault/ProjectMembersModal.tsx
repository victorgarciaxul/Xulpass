'use client'

import { useEffect, useState } from 'react'
import { X, Users, Check, Search, Crown, Trash2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { type Project, type ProjectMember } from '@/types'

interface Props {
  project: Project
  currentUserId: string
  onClose: () => void
  dark?: boolean
}

interface User { id: string; email: string }

export function ProjectMembersModal({ project, currentUserId, onClose, dark = true }: Props) {
  const [members, setMembers] = useState<ProjectMember[]>([])
  const [allUsers, setAllUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const supabase = createClient()

  const isOwner = project.owner_id === currentUserId
  const bg    = dark ? 'bg-[#13151c] border-white/5' : 'bg-white border-gray-200'
  const txt   = dark ? 'text-white' : 'text-gray-900'
  const muted = dark ? 'text-slate-400' : 'text-gray-500'
  const input = dark ? 'bg-[#1a1d27] border-white/5 text-white placeholder:text-slate-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'
  const div   = dark ? 'border-white/5' : 'border-gray-100'
  const row   = dark ? 'hover:bg-white/5' : 'hover:bg-gray-50'

  useEffect(() => {
    async function load() {
      const [{ data: membersData }, { data: usersData }] = await Promise.all([
        supabase.rpc('get_project_members', { p_project_id: project.id }),
        supabase.rpc('get_users'),
      ])
      setMembers(membersData ?? [])
      setAllUsers((usersData ?? []).filter((u: User) => u.id !== currentUserId && u.id !== project.owner_id))
    }
    load()
  }, [project.id])

  async function toggleMember(userId: string) {
    if (!isOwner) return
    setSaving(true)
    const existing = members.find(m => m.user_id === userId)
    if (existing) {
      await supabase.from('project_members').delete().eq('id', existing.id)
      setMembers(m => m.filter(x => x.id !== existing.id))
    } else {
      const { data } = await supabase.from('project_members').insert({
        project_id: project.id,
        user_id: userId,
        role: 'member',
      }).select().single()
      if (data) setMembers(m => [...m, data])
    }
    setSaving(false)
  }

  const memberIds = new Set(members.map(m => m.user_id))
  const filtered = allUsers.filter(u => u.email.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className={`w-full max-w-md rounded-2xl shadow-2xl border ${bg}`} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${div}`}>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-red-500" />
            <h2 className={`text-base font-semibold ${txt}`}>Miembros — {project.name}</h2>
          </div>
          <button onClick={onClose} className={`w-8 h-8 rounded-lg flex items-center justify-center ${dark ? 'bg-white/5 hover:bg-white/10 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 pt-4 pb-2">
          {/* Current members */}
          <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${muted}`}>Miembros actuales</p>
          <div className={`rounded-xl border ${div} mb-4 overflow-hidden`}>
            {/* Owner */}
            <div className={`flex items-center gap-3 px-3 py-2.5 ${dark ? 'bg-white/3' : 'bg-gray-50'}`}>
              <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                {(project as { owner_email?: string }).owner_email?.slice(0, 2).toUpperCase() ?? 'TÚ'}
              </div>
              <span className={`text-sm flex-1 truncate ${txt}`}>
                {currentUserId === project.owner_id ? 'Tú (propietario)' : 'Propietario'}
              </span>
              <Crown className="w-3.5 h-3.5 text-yellow-400 flex-shrink-0" />
            </div>
            {members.length === 0 && (
              <p className={`text-xs text-center py-3 ${muted}`}>Sin miembros adicionales</p>
            )}
            {members.map(m => {
              const user = allUsers.find(u => u.id === m.user_id)
              const email = user?.email ?? m.user_id.slice(0, 8) + '...'
              return (
                <div key={m.id} className={`flex items-center gap-3 px-3 py-2.5 border-t ${div}`}>
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {email.slice(0, 2).toUpperCase()}
                  </div>
                  <span className={`text-sm flex-1 truncate ${muted}`}>{email}</span>
                  {isOwner && (
                    <button
                      onClick={() => toggleMember(m.user_id)}
                      disabled={saving}
                      className="w-6 h-6 rounded-md flex items-center justify-center text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  )}
                </div>
              )
            })}
          </div>

          {/* Add members (only owner) */}
          {isOwner && (
            <>
              <p className={`text-xs font-semibold uppercase tracking-wider mb-2 ${muted}`}>Añadir miembros</p>
              <div className="relative mb-2">
                <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${muted}`} />
                <input
                  type="text"
                  placeholder="Buscar usuario..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className={`w-full h-9 pl-9 pr-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-red-500/40 ${input}`}
                />
              </div>
            </>
          )}
        </div>

        {isOwner && (
          <div className="px-3 pb-4 max-h-52 overflow-y-auto">
            {filtered.length === 0 && (
              <p className={`text-center text-sm py-4 ${muted}`}>Sin resultados</p>
            )}
            {filtered.map(u => {
              const isMember = memberIds.has(u.id)
              return (
                <button
                  key={u.id}
                  onClick={() => toggleMember(u.id)}
                  disabled={saving}
                  className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${row}`}
                >
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                    {u.email.slice(0, 2).toUpperCase()}
                  </div>
                  <span className={`text-sm flex-1 text-left truncate ${txt}`}>{u.email}</span>
                  <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                    isMember ? 'bg-red-600 border-red-600' : dark ? 'border-white/20' : 'border-gray-300'
                  }`}>
                    {isMember && <Check className="w-3 h-3 text-white" />}
                  </div>
                </button>
              )
            })}
          </div>
        )}

        <div className={`px-6 py-4 border-t ${div} flex justify-between items-center`}>
          <span className={`text-xs ${muted}`}>{members.length + 1} miembro{members.length !== 0 ? 's' : ''} en total</span>
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors">
            Listo
          </button>
        </div>
      </div>
    </div>
  )
}
