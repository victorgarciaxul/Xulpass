'use client'

import { useEffect, useState } from 'react'
import { X, Share2, Check, Search } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { type VaultEntry } from '@/types'

interface Props {
  entry: VaultEntry
  currentUserId: string
  onClose: () => void
  dark?: boolean
}

interface PublicUser { id: string; email: string }

export function ShareModal({ entry, currentUserId, onClose, dark = true }: Props) {
  const [users, setUsers] = useState<PublicUser[]>([])
  const [sharedWith, setSharedWith] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const supabase = createClient()

  const bg     = dark ? 'bg-[#1a1d27] border-white/5' : 'bg-white border-gray-200'
  const modal  = dark ? 'bg-[#13151c] border-white/5' : 'bg-white border-gray-200'
  const txt    = dark ? 'text-white' : 'text-gray-900'
  const muted  = dark ? 'text-slate-400' : 'text-gray-500'
  const inputC = dark ? 'bg-[#1a1d27] border-white/5 text-white placeholder:text-slate-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'
  const row    = dark ? 'hover:bg-white/5' : 'hover:bg-gray-50'

  useEffect(() => {
    async function load() {
      const [{ data: usersData }, { data: sharesData }] = await Promise.all([
        supabase.from('public_users').select('id, email'),
        supabase.from('vault_shares').select('shared_with').eq('entry_id', entry.id),
      ])
      setUsers((usersData ?? []).filter((u: PublicUser) => u.id !== currentUserId))
      setSharedWith((sharesData ?? []).map((s: { shared_with: string }) => s.shared_with))
    }
    load()
  }, [entry.id, currentUserId])

  async function toggleUser(userId: string) {
    setSaving(true)
    if (sharedWith.includes(userId)) {
      await supabase.from('vault_shares').delete()
        .eq('entry_id', entry.id).eq('shared_with', userId)
      setSharedWith(s => s.filter(id => id !== userId))
    } else {
      await supabase.from('vault_shares').insert({
        entry_id: entry.id,
        owner_id: currentUserId,
        shared_with: userId,
      })
      setSharedWith(s => [...s, userId])
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const filtered = users.filter(u => u.email.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className={`w-full max-w-md rounded-2xl shadow-2xl border ${modal}`} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${dark ? 'border-white/5' : 'border-gray-100'}`}>
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-red-500" />
            <h2 className={`text-base font-semibold ${txt}`}>Compartir "{entry.title}"</h2>
          </div>
          <button onClick={onClose} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${dark ? 'bg-white/5 hover:bg-white/10 text-slate-400' : 'bg-gray-100 hover:bg-gray-200 text-gray-500'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search */}
        <div className="px-6 pt-4 pb-2">
          <div className="relative">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 ${muted}`} />
            <input
              type="text"
              placeholder="Buscar usuario..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`w-full h-9 pl-9 pr-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-red-500/40 ${inputC}`}
            />
          </div>
        </div>

        {/* User list */}
        <div className="px-3 pb-2 max-h-72 overflow-y-auto">
          {filtered.length === 0 && (
            <p className={`text-center text-sm py-6 ${muted}`}>Sin resultados</p>
          )}
          {filtered.map(u => {
            const checked = sharedWith.includes(u.id)
            return (
              <button
                key={u.id}
                onClick={() => toggleUser(u.id)}
                disabled={saving}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${row}`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                  {u.email.slice(0, 2).toUpperCase()}
                </div>
                <span className={`text-sm flex-1 text-left truncate ${txt}`}>{u.email}</span>
                <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                  checked ? 'bg-red-600 border-red-600' : dark ? 'border-white/20' : 'border-gray-300'
                }`}>
                  {checked && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            )
          })}
        </div>

        {/* Footer */}
        <div className={`px-6 py-4 border-t ${dark ? 'border-white/5' : 'border-gray-100'} flex items-center justify-between`}>
          <span className={`text-xs ${muted}`}>
            {sharedWith.length > 0 ? `Compartida con ${sharedWith.length} usuario${sharedWith.length > 1 ? 's' : ''}` : 'Sin compartir'}
          </span>
          {saved && <span className="text-xs text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" /> Guardado</span>}
          <button onClick={onClose} className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors">
            Listo
          </button>
        </div>
      </div>
    </div>
  )
}
