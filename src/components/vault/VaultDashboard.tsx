'use client'

import { useCallback, useEffect, useState } from 'react'
import { Plus, Search, Star, Key, FileText, MapPin, CreditCard, Settings, HelpCircle, SortAsc, Sun, Moon, LogOut, Share2 } from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { EntryCard } from './EntryCard'
import { EntryDetail } from './EntryDetail'
import { EntryForm } from './EntryForm'
import { ShareModal } from './ShareModal'
import { createClient } from '@/lib/supabase/client'
import { type VaultEntry, type VaultEntryForm, type Category } from '@/types'

interface Props {
  userId: string
  userEmail: string
}

// Nav items map to category filters (null = show all)
const NAV_ITEMS = [
  { id: 'all',      label: 'Todos los elementos', icon: Key,      category: null },
  { id: 'web',      label: 'Contraseñas Web',     icon: Key,      category: 'web' },
  { id: 'app',      label: 'Aplicaciones',        icon: CreditCard, category: 'app' },
  { id: 'email',    label: 'Email',               icon: FileText, category: 'email' },
  { id: 'social',   label: 'Redes Sociales',      icon: Star,     category: 'social' },
  { id: 'server',   label: 'Servidores',          icon: Settings, category: 'server' },
  { id: 'other',    label: 'Otros',               icon: MapPin,   category: 'other' },
]

const FILTER_TABS = ['Todos', 'Favoritos', 'web', 'app', 'email', 'social', 'server', 'other']

export function VaultDashboard({ userId, userEmail }: Props) {
  const [entries, setEntries] = useState<VaultEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('Todos')
  const [navItem, setNavItem] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<VaultEntry | null>(null)
  const [detailEntry, setDetailEntry] = useState<VaultEntry | null>(null)
  const [dark, setDark] = useState(true)
  const [sharedEntries, setSharedEntries] = useState<VaultEntry[]>([])
  const [shareEntry, setShareEntry] = useState<VaultEntry | null>(null)
  const [changePwdOpen, setChangePwdOpen] = useState(false)
  const [changePwdForm, setChangePwdForm] = useState({ current: '', next: '', confirm: '' })
  const [changePwdError, setChangePwdError] = useState('')
  const [changePwdOk, setChangePwdOk] = useState(false)
  const [changePwdLoading, setChangePwdLoading] = useState(false)
  const supabase = createClient()

  const t = dark ? themes.dark : themes.light

  const fetchEntries = useCallback(async () => {
    const { data } = await supabase
      .from('vault_entries')
      .select('*')
      .order('favorite', { ascending: false })
      .order('title')
    setEntries(data ?? [])
  }, [supabase])

  const fetchShared = useCallback(async () => {
    const { data } = await supabase
      .from('vault_shares')
      .select('entry_id, vault_entries(*)')
      .eq('shared_with', userId)
    const entries = (data ?? []).map((r: { vault_entries: VaultEntry }) => r.vault_entries).filter(Boolean)
    setSharedEntries(entries)
  }, [supabase, userId])

  useEffect(() => { fetchEntries(); fetchShared() }, [fetchEntries, fetchShared])

  function handleNavClick(item: typeof NAV_ITEMS[0]) {
    setNavItem(item.id)
    setActiveTab(item.category ? item.category : 'Todos')
  }

  async function handleSave(form: VaultEntryForm) {
    setLoading(true)
    if (editEntry) {
      await supabase.from('vault_entries').update({
        title: form.title,
        username: form.username,
        encrypted_password: form.password,
        url: form.url || null,
        category: form.category,
        notes: form.notes || null,
        favorite: form.favorite,
        updated_at: new Date().toISOString(),
      }).eq('id', editEntry.id)
    } else {
      await supabase.from('vault_entries').insert({
        user_id: userId,
        title: form.title,
        username: form.username,
        encrypted_password: form.password,
        url: form.url || null,
        category: form.category as Category,
        notes: form.notes || null,
        favorite: form.favorite,
      })
    }
    await fetchEntries()
    setDialogOpen(false)
    setEditEntry(null)
    setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta entrada?')) return
    await supabase.from('vault_entries').delete().eq('id', id)
    setEntries(e => e.filter(x => x.id !== id))
  }

  function openEdit(entry: VaultEntry) {
    setDetailEntry(null)
    setEditEntry(entry)
    setDialogOpen(true)
  }

  async function handleSignOut() {
    await supabase.auth.signOut()
    window.location.href = '/login'
  }

  async function handleChangePassword() {
    setChangePwdError('')
    setChangePwdOk(false)
    if (changePwdForm.next !== changePwdForm.confirm) {
      setChangePwdError('Las contraseñas nuevas no coinciden')
      return
    }
    if (changePwdForm.next.length < 6) {
      setChangePwdError('La contraseña debe tener al menos 6 caracteres')
      return
    }
    setChangePwdLoading(true)
    // Re-authenticate first
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: userEmail,
      password: changePwdForm.current,
    })
    if (signInError) {
      setChangePwdError('Contraseña actual incorrecta')
      setChangePwdLoading(false)
      return
    }
    const { error } = await supabase.auth.updateUser({ password: changePwdForm.next })
    setChangePwdLoading(false)
    if (error) {
      setChangePwdError('Error al cambiar la contraseña. Inténtalo de nuevo.')
      return
    }
    setChangePwdOk(true)
    setChangePwdForm({ current: '', next: '', confirm: '' })
    setTimeout(() => { setChangePwdOpen(false); setChangePwdOk(false) }, 2000)
  }

  const filtered = entries.filter(e => {
    const matchSearch = search === '' ||
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.username.toLowerCase().includes(search.toLowerCase())
    const matchTab =
      activeTab === 'Todos' ? true :
      activeTab === 'Favoritos' ? e.favorite :
      e.category === activeTab
    return matchSearch && matchTab
  })

  const favoriteCount = entries.filter(e => e.favorite).length
  const securityScore = entries.length === 0 ? 100 : Math.min(100, 50 + Math.round((favoriteCount / Math.max(entries.length, 1)) * 50))
  const circumference = 2 * Math.PI * 40
  const dashOffset = circumference - (securityScore / 100) * circumference
  const initials = userEmail.slice(0, 2).toUpperCase()

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${t.bg}`}>
      {/* ── CHANGE PASSWORD MODAL ── */}
      {changePwdOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className={`w-full max-w-md mx-4 rounded-2xl p-6 shadow-2xl border ${t.border} ${dark ? 'bg-[#1a1d27]' : 'bg-white'}`}>
            <h2 className={`text-lg font-bold mb-5 ${t.text}`}>Cambiar contraseña</h2>
            <div className="space-y-3">
              {(['current','next','confirm'] as const).map((field, i) => (
                <div key={field}>
                  <label className={`block text-xs font-medium mb-1 ${t.muted}`}>
                    {field === 'current' ? 'Contraseña actual' : field === 'next' ? 'Nueva contraseña' : 'Confirmar nueva contraseña'}
                  </label>
                  <input
                    type="password"
                    value={changePwdForm[field]}
                    onChange={e => setChangePwdForm(f => ({ ...f, [field]: e.target.value }))}
                    className={`w-full h-10 px-3 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 ${t.input}`}
                    placeholder={field === 'current' ? '••••••••' : field === 'next' ? 'Mínimo 6 caracteres' : '••••••••'}
                  />
                </div>
              ))}
              {changePwdError && <p className="text-red-500 text-xs">{changePwdError}</p>}
              {changePwdOk && <p className="text-emerald-500 text-xs font-medium">✓ Contraseña cambiada correctamente</p>}
            </div>
            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setChangePwdOpen(false)}
                className={`flex-1 h-10 rounded-xl text-sm font-medium border ${t.border} ${t.text} hover:opacity-70 transition-opacity`}
              >
                Cancelar
              </button>
              <button
                onClick={handleChangePassword}
                disabled={changePwdLoading}
                className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-50"
              >
                {changePwdLoading ? 'Guardando...' : 'Guardar'}
              </button>
            </div>
          </div>
        </div>
      )}

      {shareEntry && (
        <ShareModal
          entry={shareEntry}
          currentUserId={userId}
          onClose={() => setShareEntry(null)}
          dark={dark}
        />
      )}

      {detailEntry && (
        <EntryDetail
          entry={detailEntry}
          onClose={() => setDetailEntry(null)}
          onEdit={openEdit}
          onDelete={handleDelete}
          onShare={() => { setDetailEntry(null); setShareEntry(detailEntry) }}
          isOwner={detailEntry.user_id === userId}
          dark={dark}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`w-64 flex-shrink-0 flex flex-col ${t.sidebar} border-r ${t.border}`}>
        {/* Logo */}
        <div className={`px-5 py-5 border-b ${t.border}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30">
                <Key className="w-5 h-5 text-white" />
              </div>
              <span className={`font-bold text-xl tracking-tight ${t.text}`}>
                Xulpass<span className="text-red-500">···|</span>
              </span>
            </div>
            {/* Theme toggle */}
            <button
              onClick={() => setDark(d => !d)}
              className={`w-8 h-8 rounded-lg flex items-center justify-center ${t.iconBtn} transition-colors`}
              title={dark ? 'Modo claro' : 'Modo oscuro'}
            >
              {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-0.5">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const active = navItem === item.id
            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${
                  active ? 'bg-red-600/15 text-red-500' : `${t.navItem}`
                }`}
              >
                <Icon className="w-4 h-4 flex-shrink-0" />
                {item.label}
                {item.category && (
                  <span className={`ml-auto text-xs ${active ? 'text-red-400' : t.muted}`}>
                    {entries.filter(e => e.category === item.category).length}
                  </span>
                )}
              </button>
            )
          })}
        </nav>


        {/* Security Score */}
        <div className={`mx-3 mb-4 ${t.card} rounded-2xl p-4 border ${t.border}`}>
          <p className={`text-sm font-semibold mb-3 ${t.text}`}>Score de seguridad</p>
          <div className="flex items-center justify-center mb-3">
            <div className="relative w-24 h-24">
              <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke={dark ? '#1e2130' : '#e5e7eb'} strokeWidth="10" />
                <circle
                  cx="50" cy="50" r="40" fill="none"
                  stroke={securityScore >= 70 ? '#10b981' : securityScore >= 50 ? '#f59e0b' : '#ef4444'}
                  strokeWidth="10" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={dashOffset}
                  className="transition-all duration-700"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className={`text-xl font-bold ${t.text}`}>{securityScore}%</span>
                <span className={`text-xs ${t.muted}`}>Seguridad</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className={t.muted}>Total entradas</span>
              <span className={`px-2 py-0.5 rounded-full font-medium ${t.badge}`}>{entries.length}</span>
            </div>
            <div className="flex items-center justify-between text-xs">
              <span className={t.muted}>Favoritos</span>
              <span className="bg-emerald-500/20 text-emerald-500 px-2 py-0.5 rounded-full font-medium">{favoriteCount}</span>
            </div>
          </div>
        </div>

        {/* User footer */}
        <div className={`px-3 pb-4 border-t ${t.border} pt-3 space-y-1`}>
          <div className={`flex items-center gap-2.5 px-3 py-2 rounded-xl ${t.card}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {initials}
            </div>
            <span className={`text-xs truncate flex-1 ${t.muted}`}>{userEmail}</span>
          </div>
          <button
            onClick={() => { setChangePwdOpen(true); setChangePwdError(''); setChangePwdOk(false) }}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${t.navItem}`}
          >
            <Key className="w-4 h-4 flex-shrink-0" />
            Cambiar contraseña
          </button>
          <button
            onClick={handleSignOut}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors hover:text-red-500 ${t.navItem}`}
          >
            <LogOut className="w-4 h-4 flex-shrink-0" />
            Cerrar sesión
          </button>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col overflow-hidden">

        {/* Header */}
        <header className={`flex-shrink-0 flex items-center gap-3 px-6 py-4 border-b ${t.border} ${t.bg}`}>
          <div className="relative flex-1 max-w-xl">
            <Search className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${t.muted}`} />
            <input
              type="text"
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className={`w-full h-10 pl-10 pr-4 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 transition-colors ${t.input}`}
            />
          </div>

          <Dialog open={dialogOpen} onOpenChange={open => { setDialogOpen(open); if (!open) setEditEntry(null) }}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 h-10 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors shadow-lg shadow-red-600/20 flex-shrink-0">
                <Plus className="w-4 h-4" />
                Agregar
              </button>
            </DialogTrigger>
            <DialogContent className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className={t.text}>{editEntry ? 'Editar entrada' : 'Nueva entrada'}</DialogTitle>
              </DialogHeader>
              <EntryForm
                initial={editEntry ? {
                  title: editEntry.title,
                  username: editEntry.username,
                  password: editEntry.encrypted_password,
                  url: editEntry.url ?? '',
                  category: editEntry.category,
                  notes: editEntry.notes ?? '',
                  favorite: editEntry.favorite,
                } : undefined}
                onSubmit={handleSave}
                onCancel={() => { setDialogOpen(false); setEditEntry(null) }}
                loading={loading}
                dark={dark}
              />
            </DialogContent>
          </Dialog>

          <button className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${t.iconBtn}`}>
            <HelpCircle className="w-4 h-4" />
          </button>
          <button
            onClick={() => { setChangePwdOpen(true); setChangePwdError(''); setChangePwdOk(false) }}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${t.iconBtn}`}
            title="Cambiar contraseña"
          >
            <Settings className="w-4 h-4" />
          </button>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center text-white font-bold text-sm shadow-lg flex-shrink-0 select-none">
            {initials}
          </div>
          <button
            onClick={handleSignOut}
            className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors flex-shrink-0 ${t.iconBtn} hover:!text-red-500`}
            title="Cerrar sesión"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </header>

        {/* Filter tabs */}
        <div className={`flex-shrink-0 flex items-center gap-2 px-6 py-3 border-b ${t.border} overflow-x-auto`}>
          {FILTER_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setNavItem('all') }}
              className={`flex-shrink-0 px-4 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                activeTab === tab
                  ? 'bg-red-600 text-white'
                  : `${t.tabInactive}`
              }`}
            >
              {tab}
            </button>
          ))}
          <div className={`ml-auto flex-shrink-0 flex items-center gap-1 text-xs cursor-pointer ${t.muted}`}>
            <SortAsc className="w-3.5 h-3.5" />
            Ordenar
          </div>
        </div>

        {/* Grid */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
          {/* Mis entradas */}
          {filtered.length === 0 ? (
            <div className={`flex flex-col items-center justify-center h-64 ${t.muted}`}>
              <Key className="w-12 h-12 mb-3 opacity-20" />
              <p className="text-sm">{entries.length === 0 ? '¡Agrega tu primera contraseña!' : 'Sin resultados'}</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
              {filtered.map(entry => (
                <EntryCard
                  key={entry.id}
                  entry={entry}
                  onEdit={openEdit}
                  onDelete={handleDelete}
                  onView={() => setDetailEntry(entry)}
                  dark={dark}
                />
              ))}
            </div>
          )}

          {/* Compartidas conmigo */}
          {sharedEntries.length > 0 && (
            <div>
              <div className={`flex items-center gap-2 mb-3`}>
                <Share2 className={`w-4 h-4 text-red-500`} />
                <h3 className={`text-sm font-semibold ${t.text}`}>Compartidas conmigo</h3>
                <span className={`text-xs px-2 py-0.5 rounded-full ${t.badge}`}>{sharedEntries.length}</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                {sharedEntries.map(entry => (
                  <EntryCard
                    key={entry.id}
                    entry={entry}
                    onEdit={() => {}}
                    onDelete={() => {}}
                    onView={() => setDetailEntry(entry)}
                    dark={dark}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

// ── Theme tokens ──
const themes = {
  dark: {
    bg:        'bg-[#0f1117] text-white',
    sidebar:   'bg-[#13151c]',
    card:      'bg-[#1a1d27]',
    border:    'border-white/5',
    text:      'text-white',
    muted:     'text-slate-500',
    input:     'bg-[#1a1d27] border border-white/5 text-white placeholder:text-slate-600',
    iconBtn:   'bg-[#1a1d27] border border-white/5 text-slate-400 hover:text-white',
    navItem:   'text-slate-400 hover:bg-white/5 hover:text-white',
    badge:     'bg-slate-700 text-slate-200',
    tabInactive: 'bg-[#1a1d27] text-slate-400 hover:text-white border border-white/5',
  },
  light: {
    bg:        'bg-gray-50 text-gray-900',
    sidebar:   'bg-white',
    card:      'bg-white',
    border:    'border-gray-200',
    text:      'text-gray-900',
    muted:     'text-gray-400',
    input:     'bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400',
    iconBtn:   'bg-gray-100 border border-gray-200 text-gray-500 hover:text-gray-900',
    navItem:   'text-gray-500 hover:bg-gray-100 hover:text-gray-900',
    badge:     'bg-gray-100 text-gray-600',
    tabInactive: 'bg-white text-gray-500 hover:text-gray-900 border border-gray-200',
  },
}
