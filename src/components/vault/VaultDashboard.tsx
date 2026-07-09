'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  Plus, Search, Star, Key, FileText, MapPin, CreditCard,
  Sun, Moon, Share2, Shield, FolderOpen, ArrowLeft,
  Users, Settings2, Pencil, Trash2, SortAsc
} from 'lucide-react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { EntryCard } from './EntryCard'
import { EntryDetail } from './EntryDetail'
import { EntryForm } from './EntryForm'
import { ShareModal } from './ShareModal'
import { ProjectCard, PROJECT_COLORS } from './ProjectCard'
import { ProjectForm } from './ProjectForm'
import { ProjectMembersModal } from './ProjectMembersModal'
import { createClient } from '@/lib/supabase/client'
import { type VaultEntry, type VaultEntryForm, type Category, type Project } from '@/types'

interface Props { userId: string; userEmail: string }

const NAV_ITEMS = [
  { id: 'all',    label: 'Todos',          icon: Key,        category: null },
  { id: 'web',    label: 'Web',            icon: Key,        category: 'web' },
  { id: 'app',    label: 'Aplicaciones',   icon: CreditCard, category: 'app' },
  { id: 'email',  label: 'Email',          icon: FileText,   category: 'email' },
  { id: 'social', label: 'Redes sociales', icon: Star,       category: 'social' },
  { id: 'server', label: 'Servidores',     icon: Shield,     category: 'server' },
  { id: 'other',  label: 'Otros',          icon: MapPin,     category: 'other' },
]

type ViewMode = 'projects' | 'vault'

export function VaultDashboard({ userId, userEmail }: Props) {
  // View state
  const [view, setView] = useState<ViewMode>('projects')
  const [activeProject, setActiveProject] = useState<Project | null>(null) // null = personal

  // Projects state
  const [projects, setProjects] = useState<Project[]>([])
  const [projectFormOpen, setProjectFormOpen] = useState(false)
  const [editProject, setEditProject] = useState<Project | null>(null)
  const [membersProject, setMembersProject] = useState<Project | null>(null)
  const [projectMenuId, setProjectMenuId] = useState<string | null>(null)

  // Vault state
  const [entries, setEntries] = useState<VaultEntry[]>([])
  const [sharedEntries, setSharedEntries] = useState<VaultEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')
  const [activeTab, setActiveTab] = useState('all')
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editEntry, setEditEntry] = useState<VaultEntry | null>(null)
  const [detailEntry, setDetailEntry] = useState<VaultEntry | null>(null)
  const [shareEntry, setShareEntry] = useState<VaultEntry | null>(null)

  // UI state
  const [dark, setDark] = useState(true)

  const supabase = useMemo(() => createClient(), [])
  const t = dark ? themes.dark : themes.light
  const initials = userEmail.slice(0, 2).toUpperCase()

  // ── Fetch projects ──
  const fetchProjects = useCallback(async () => {
    const { data: projectsData, error } = await supabase.from('projects').select('*').order('created_at')
    if (error) { console.error('fetchProjects error:', error); return }
    if (!projectsData) return

    const withCounts = await Promise.all(projectsData.map(async (p: Project) => {
      const [{ count: entryCount }, { count: memberCount }] = await Promise.all([
        supabase.from('vault_entries').select('id', { count: 'exact', head: true }).eq('project_id', p.id),
        supabase.from('project_members').select('id', { count: 'exact', head: true }).eq('project_id', p.id),
      ])
      return { ...p, entry_count: entryCount ?? 0, member_count: memberCount ?? 0 }
    }))
    setProjects(withCounts)
  }, [supabase])

  // ── Fetch entries (scoped to project or personal) ──
  const fetchEntries = useCallback(async () => {
    let q = supabase.from('vault_entries_dec').select('*').order('favorite', { ascending: false }).order('title')
    if (activeProject) {
      q = q.eq('project_id', activeProject.id)
    } else {
      q = q.is('project_id', null)
    }
    const { data, error } = await q
    if (error) console.error('fetchEntries error:', error)
    setEntries(data ?? [])
  }, [supabase, activeProject])

  // ── Fetch shared entries (only for personal view) ──
  const fetchShared = useCallback(async () => {
    if (activeProject) { setSharedEntries([]); return }
    const { data, error } = await supabase.rpc('get_shared_entries')
    if (error) console.error('fetchShared error:', error)
    setSharedEntries((data ?? []) as VaultEntry[])
  }, [supabase, activeProject])

  useEffect(() => { fetchProjects() }, [fetchProjects])
  useEffect(() => {
    if (view === 'vault') { fetchEntries(); fetchShared() }
  }, [view, fetchEntries, fetchShared])

  // ── Enter a project ──
  function openProject(project: Project | null) {
    setActiveProject(project)
    setView('vault')
    setSearch('')
    setActiveTab('all')
  }

  function goHome() {
    setView('projects')
    setActiveProject(null)
    setEntries([])
    setSharedEntries([])
  }

  // ── Project CRUD ──
  async function handleCreateProject(data: { name: string; description: string; color: string }) {
    const { data: p, error } = await supabase.from('projects').insert({
      name: data.name,
      description: data.description || null,
      color: data.color,
      owner_id: userId,
    }).select().single()
    if (error) { console.error('handleCreateProject error:', error); throw error }
    if (p) { await fetchProjects(); setProjectFormOpen(false) }
  }

  async function handleEditProject(data: { name: string; description: string; color: string }) {
    if (!editProject) return
    await supabase.from('projects').update({
      name: data.name,
      description: data.description || null,
      color: data.color,
      updated_at: new Date().toISOString(),
    }).eq('id', editProject.id)
    await fetchProjects()
    setEditProject(null)
  }

  async function handleDeleteProject(project: Project) {
    if (!confirm(`¿Eliminar el proyecto "${project.name}"? Se eliminarán todas sus contraseñas.`)) return
    await supabase.from('projects').delete().eq('id', project.id)
    await fetchProjects()
    setProjectMenuId(null)
  }

  // ── Entry CRUD ──
  async function handleSave(form: VaultEntryForm) {
    setLoading(true)
    if (editEntry) {
      await supabase.from('vault_entries_dec').update({
        title: form.title, username: form.username, encrypted_password: form.password,
        url: form.url || null, category: form.category, notes: form.notes || null,
        favorite: form.favorite, updated_at: new Date().toISOString(),
      }).eq('id', editEntry.id)
    } else {
      await supabase.from('vault_entries_dec').insert({
        user_id: userId,
        project_id: activeProject?.id ?? null,
        title: form.title, username: form.username, encrypted_password: form.password,
        url: form.url || null, category: form.category as Category,
        notes: form.notes || null, favorite: form.favorite,
      })
    }
    await fetchEntries()
    setDialogOpen(false); setEditEntry(null); setLoading(false)
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta entrada?')) return
    await supabase.from('vault_entries_dec').delete().eq('id', id)
    setEntries(e => e.filter(x => x.id !== id))
  }

  function openEdit(entry: VaultEntry) {
    setDetailEntry(null); setEditEntry(entry); setDialogOpen(true)
  }

  // ── Derived ──
  const filtered = entries.filter(e => {
    const matchSearch = search === '' || e.title.toLowerCase().includes(search.toLowerCase()) || e.username.toLowerCase().includes(search.toLowerCase())
    const matchTab = activeTab === 'all' ? true : activeTab === 'favorites' ? e.favorite : e.category === activeTab
    return matchSearch && matchTab
  })

  const color = activeProject ? (PROJECT_COLORS[activeProject.color] ?? PROJECT_COLORS.red) : null

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-300 ${t.bg}`}>

      {/* ── MODALS ── */}
      {shareEntry && <ShareModal entry={shareEntry} currentUserId={userId} onClose={() => setShareEntry(null)} dark={dark} />}
      {projectFormOpen && <ProjectForm onSubmit={handleCreateProject} onClose={() => setProjectFormOpen(false)} dark={dark} />}
      {editProject && <ProjectForm initial={editProject} onSubmit={handleEditProject} onClose={() => setEditProject(null)} dark={dark} />}
      {membersProject && <ProjectMembersModal project={membersProject} currentUserId={userId} onClose={() => setMembersProject(null)} dark={dark} />}

      {detailEntry && (
        <EntryDetail
          entry={detailEntry}
          onClose={() => setDetailEntry(null)}
          onEdit={openEdit}
          onDelete={handleDelete}
          onShare={detailEntry.user_id === userId ? () => { setDetailEntry(null); setShareEntry(detailEntry) } : undefined}
          isOwner={detailEntry.user_id === userId}
          dark={dark}
        />
      )}

      {/* ── SIDEBAR ── */}
      <aside className={`w-60 flex-shrink-0 flex flex-col ${t.sidebar} border-r ${t.border}`}>
        {/* Logo */}
        <div className={`px-4 py-4 border-b ${t.border}`}>
          <div className="flex items-center justify-between">
            <button onClick={goHome} className="flex items-center gap-2 hover:opacity-80 transition-opacity">
              <div className="w-8 h-8 rounded-xl bg-red-600 flex items-center justify-center shadow-lg shadow-red-600/30">
                <Key className="w-4 h-4 text-white" />
              </div>
              <span className={`font-bold text-lg tracking-tight ${t.text}`}>
                Xulpass<span className="text-red-500">···|</span>
              </span>
            </button>
            <button onClick={() => setDark(d => !d)} className={`w-7 h-7 rounded-lg flex items-center justify-center ${t.iconBtn}`}>
              {dark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-2 py-3 overflow-y-auto space-y-0.5">

          {/* Projects section */}
          <div className="px-2 pb-1 pt-0.5">
            <p className={`text-[10px] font-bold uppercase tracking-widest ${t.muted}`}>Proyectos</p>
          </div>

          {/* Personal */}
          <button
            onClick={() => openProject(null)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              view === 'vault' && !activeProject ? 'bg-red-600/15 text-red-500' : t.navItem
            }`}
          >
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center flex-shrink-0">
              <Key className="w-2.5 h-2.5 text-white" />
            </div>
            <span className="flex-1 text-left truncate">Personal</span>
          </button>

          {/* User projects */}
          {projects.map(p => {
            const col = PROJECT_COLORS[p.color] ?? PROJECT_COLORS.red
            const isActive = view === 'vault' && activeProject?.id === p.id
            const isMenuOpen = projectMenuId === p.id
            return (
              <div key={p.id} className="relative group/item">
                <button
                  onClick={() => openProject(p)}
                  className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                    isActive ? 'bg-red-600/15 text-red-500' : t.navItem
                  }`}
                >
                  <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${col.from} ${col.to} flex items-center justify-center flex-shrink-0`}>
                    <FolderOpen className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span className="flex-1 text-left truncate">{p.name}</span>
                  <span className={`text-xs ${isActive ? 'text-red-400' : t.muted}`}>{p.entry_count}</span>
                </button>
                {/* Context menu button */}
                {p.owner_id === userId && (
                  <button
                    onClick={e => { e.stopPropagation(); setProjectMenuId(isMenuOpen ? null : p.id) }}
                    className={`absolute right-1 top-1/2 -translate-y-1/2 w-6 h-6 rounded-md flex items-center justify-center opacity-0 group-hover/item:opacity-100 transition-opacity ${t.iconBtn}`}
                  >
                    <Settings2 className="w-3 h-3" />
                  </button>
                )}
                {isMenuOpen && (
                  <div
                    className={`absolute right-0 top-full mt-1 w-44 rounded-xl shadow-2xl border z-30 py-1 ${dark ? 'bg-[#1a1d27] border-white/10' : 'bg-white border-gray-200'}`}
                    onClick={e => e.stopPropagation()}
                  >
                    <button onClick={() => { setMembersProject(p); setProjectMenuId(null) }} className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${t.navItem}`}>
                      <Users className="w-3.5 h-3.5" /> Miembros
                    </button>
                    <button onClick={() => { setEditProject(p); setProjectMenuId(null) }} className={`w-full flex items-center gap-2 px-3 py-2 text-sm ${t.navItem}`}>
                      <Pencil className="w-3.5 h-3.5" /> Editar
                    </button>
                    <button onClick={() => handleDeleteProject(p)} className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-400 hover:bg-red-500/10">
                      <Trash2 className="w-3.5 h-3.5" /> Eliminar
                    </button>
                  </div>
                )}
              </div>
            )
          })}

          {/* New project button */}
          <button
            onClick={() => setProjectFormOpen(true)}
            className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${t.navItem} border border-dashed ${t.border}`}
          >
            <Plus className="w-4 h-4" />
            Nuevo proyecto
          </button>

          {/* Category filters (when in vault) */}
          {view === 'vault' && (
            <>
              <div className={`px-2 pb-1 pt-3`}>
                <p className={`text-[10px] font-bold uppercase tracking-widest ${t.muted}`}>Categorías</p>
              </div>
              {NAV_ITEMS.map(item => {
                const Icon = item.icon
                const active = activeTab === item.id
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
                      active ? 'bg-red-600/15 text-red-500' : t.navItem
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
            </>
          )}
        </nav>

        {/* User footer */}
        <div className={`px-2 pb-3 border-t ${t.border} pt-3 space-y-0.5`}>
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${t.card} mb-1`}>
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {initials}
            </div>
            <span className={`text-xs truncate flex-1 ${t.muted}`}>{userEmail}</span>
          </div>
        </div>
      </aside>

      {/* ── MAIN ── */}
      <div className="flex-1 flex flex-col overflow-hidden" onClick={() => setProjectMenuId(null)}>

        {/* ─── PROJECTS HOME ─── */}
        {view === 'projects' && (
          <>
            <header className={`flex-shrink-0 flex items-center gap-3 px-6 py-4 border-b ${t.border} ${t.bg}`}>
              <div>
                <h1 className={`text-xl font-bold ${t.text}`}>Mis proyectos</h1>
                <p className={`text-xs ${t.muted}`}>Organiza tus contraseñas por proyecto</p>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => setProjectFormOpen(true)}
                  className="flex items-center gap-2 h-9 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors shadow-lg shadow-red-600/20"
                >
                  <Plus className="w-4 h-4" />
                  Nuevo proyecto
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto px-6 py-6">
              {/* Personal card */}
              <div className="mb-8">
                <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${t.muted}`}>Espacio personal</p>
                <div className="max-w-xs">
                  <div className={`group flex flex-col rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-0.5 ${dark ? 'bg-[#16181f] border-white/8' : 'bg-white border-gray-200'}`}>
                    {/* Header */}
                    <button onClick={() => openProject(null)} className="relative flex flex-col items-center justify-center gap-3 h-32 bg-gradient-to-br from-slate-500 to-slate-700 cursor-pointer">
                      <div className="w-14 h-14 rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm flex items-center justify-center shadow-lg">
                        <Key className="w-7 h-7 text-white drop-shadow" />
                      </div>
                      <span className="absolute top-3 right-3 flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full bg-black/20 text-white/90 backdrop-blur-sm">
                        Solo tú
                      </span>
                    </button>
                    {/* Body */}
                    <button onClick={() => openProject(null)} className={`flex-1 text-left px-4 pt-4 pb-3 ${dark ? 'bg-[#1c1f2b]' : 'bg-gray-50'}`}>
                      <h3 className={`text-sm font-bold truncate mb-0.5 ${t.text}`}>Personal</h3>
                      <p className={`text-xs ${t.muted}`}>Tus contraseñas privadas</p>
                      <div className="flex items-center gap-3 mt-3">
                        <div className={`flex items-center gap-1.5 text-xs ${t.muted}`}>
                          <div className="w-1.5 h-1.5 rounded-full bg-gradient-to-r from-slate-400 to-slate-600" />
                          Solo accesible por ti
                        </div>
                      </div>
                    </button>
                    {/* Footer */}
                    <div className={`flex items-center px-3 py-2.5 border-t ${dark ? 'border-white/6 bg-[#13151c]' : 'border-gray-100 bg-gray-50'}`}>
                      <button onClick={() => openProject(null)} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${dark ? 'text-slate-400 hover:text-white hover:bg-white/8 border border-white/8' : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'}`}>
                        <Key className="w-3 h-3" />
                        Abrir
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              {/* Projects grid */}
              {projects.length > 0 && (
                <div>
                  <p className={`text-xs font-bold uppercase tracking-wider mb-3 ${t.muted}`}>
                    Proyectos ({projects.length})
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                    {projects.map(p => (
                      <ProjectCard
                        key={p.id}
                        project={p}
                        isOwner={p.owner_id === userId}
                        onClick={() => openProject(p)}
                        onShare={() => setMembersProject(p)}
                        onEdit={() => setEditProject(p)}
                        onDelete={() => handleDeleteProject(p)}
                        dark={dark}
                      />
                    ))}
                    {/* Add new card */}
                    <button
                      onClick={() => setProjectFormOpen(true)}
                      className={`rounded-2xl border-2 border-dashed flex flex-col items-center justify-center p-8 gap-2 transition-colors min-h-[160px] ${dark ? 'border-white/10 text-slate-600 hover:border-white/20 hover:text-slate-400' : 'border-gray-200 text-gray-400 hover:border-gray-300 hover:text-gray-600'}`}
                    >
                      <Plus className="w-6 h-6" />
                      <span className="text-sm font-medium">Nuevo proyecto</span>
                    </button>
                  </div>
                </div>
              )}

              {projects.length === 0 && (
                <div className={`flex flex-col items-center justify-center py-20 ${t.muted}`}>
                  <FolderOpen className="w-16 h-16 mb-4 opacity-20" />
                  <p className="text-base font-semibold mb-1">Sin proyectos todavía</p>
                  <p className="text-sm opacity-70 mb-4">Crea un proyecto para organizar contraseñas por equipo o cliente</p>
                  <button onClick={() => setProjectFormOpen(true)} className="flex items-center gap-2 h-9 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors">
                    <Plus className="w-4 h-4" /> Crear primer proyecto
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* ─── VAULT VIEW ─── */}
        {view === 'vault' && (
          <>
            {/* Header */}
            <header className={`flex-shrink-0 flex items-center gap-3 px-6 py-4 border-b ${t.border} ${t.bg}`}>
              <button
                onClick={goHome}
                className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${t.muted} hover:${t.text.replace('text-', 'text-')}`}
              >
                <ArrowLeft className="w-4 h-4" />
                Proyectos
              </button>
              <span className={`${t.muted} opacity-40`}>/</span>
              <div className="flex items-center gap-2">
                {activeProject && color && (
                  <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${color.from} ${color.to} flex items-center justify-center`}>
                    <FolderOpen className="w-3 h-3 text-white" />
                  </div>
                )}
                {!activeProject && (
                  <div className="w-5 h-5 rounded-md bg-gradient-to-br from-slate-500 to-slate-700 flex items-center justify-center">
                    <Key className="w-3 h-3 text-white" />
                  </div>
                )}
                <span className={`text-sm font-semibold ${t.text}`}>
                  {activeProject?.name ?? 'Personal'}
                </span>
                {activeProject && activeProject.owner_id === userId && (
                  <button onClick={() => setMembersProject(activeProject)} className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-colors ${dark ? 'bg-white/5 text-slate-400 hover:bg-white/10' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
                    <Users className="w-3 h-3" />
                    {(activeProject.member_count ?? 0) + 1}
                  </button>
                )}
              </div>

              <div className="relative flex-1 max-w-md ml-auto">
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
                  <button className="flex items-center gap-2 h-10 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors shadow-lg shadow-red-600/20 flex-shrink-0">
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
                      title: editEntry.title, username: editEntry.username,
                      password: editEntry.encrypted_password, url: editEntry.url ?? '',
                      category: editEntry.category, notes: editEntry.notes ?? '', favorite: editEntry.favorite,
                    } : undefined}
                    onSubmit={handleSave}
                    onCancel={() => { setDialogOpen(false); setEditEntry(null) }}
                    loading={loading}
                    dark={dark}
                  />
                </DialogContent>
              </Dialog>

              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 to-rose-700 flex items-center justify-center text-white font-bold text-sm shadow-lg flex-shrink-0 select-none">
                {initials}
              </div>
            </header>

            {/* Filter tabs */}
            <div className={`flex-shrink-0 flex items-center gap-2 px-6 py-2.5 border-b ${t.border} overflow-x-auto`}>
              {NAV_ITEMS.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    activeTab === tab.id ? 'bg-red-600 text-white' : t.tabInactive
                  }`}
                >
                  {tab.label}
                  {tab.category && entries.filter(e => e.category === tab.category).length > 0 && (
                    <span className={`ml-1.5 ${activeTab === tab.id ? 'opacity-80' : t.muted}`}>
                      {entries.filter(e => e.category === tab.category).length}
                    </span>
                  )}
                </button>
              ))}
              <div className={`ml-auto flex-shrink-0 flex items-center gap-1 text-xs cursor-pointer ${t.muted}`}>
                <SortAsc className="w-3.5 h-3.5" /> Ordenar
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-8">
              {filtered.length === 0 ? (
                <div className={`flex flex-col items-center justify-center h-64 ${t.muted}`}>
                  <Key className="w-12 h-12 mb-3 opacity-20" />
                  <p className="text-sm font-medium">{entries.length === 0 ? '¡Agrega la primera contraseña!' : 'Sin resultados'}</p>
                  {entries.length === 0 && (
                    <button onClick={() => setDialogOpen(true)} className="mt-3 flex items-center gap-1.5 text-xs text-red-500 hover:text-red-400 transition-colors">
                      <Plus className="w-3.5 h-3.5" /> Agregar contraseña
                    </button>
                  )}
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

              {/* Compartidas conmigo (solo en personal) */}
              {!activeProject && sharedEntries.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-3">
                    <Share2 className="w-4 h-4 text-red-500" />
                    <h3 className={`text-sm font-semibold ${t.text}`}>Compartidas conmigo</h3>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${t.badge}`}>{sharedEntries.length}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                    {sharedEntries.map(entry => (
                      <EntryCard key={entry.id} entry={entry} onEdit={() => {}} onDelete={() => {}} onView={() => setDetailEntry(entry)} dark={dark} />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ── Theme tokens ──
const themes = {
  dark: {
    bg:          'bg-[#0f1117] text-white',
    sidebar:     'bg-[#13151c]',
    card:        'bg-[#1a1d27]',
    border:      'border-white/5',
    text:        'text-white',
    muted:       'text-slate-500',
    input:       'bg-[#1a1d27] border border-white/5 text-white placeholder:text-slate-600',
    iconBtn:     'bg-[#1a1d27] border border-white/5 text-slate-400 hover:text-white',
    navItem:     'text-slate-400 hover:bg-white/5 hover:text-white',
    badge:       'bg-slate-700 text-slate-200',
    tabInactive: 'bg-[#1a1d27] text-slate-400 hover:text-white border border-white/5',
  },
  light: {
    bg:          'bg-gray-50 text-gray-900',
    sidebar:     'bg-white',
    card:        'bg-white',
    border:      'border-gray-200',
    text:        'text-gray-900',
    muted:       'text-gray-400',
    input:       'bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400',
    iconBtn:     'bg-gray-100 border border-gray-200 text-gray-500 hover:text-gray-900',
    navItem:     'text-gray-500 hover:bg-gray-100 hover:text-gray-900',
    badge:       'bg-gray-100 text-gray-600',
    tabInactive: 'bg-white text-gray-500 hover:text-gray-900 border border-gray-200',
  },
}
