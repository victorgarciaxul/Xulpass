'use client'

import { Users, Lock, Crown, Pencil, Trash2 } from 'lucide-react'
import { type Project } from '@/types'

interface Props {
  project: Project
  isOwner: boolean
  onClick: () => void
  onShare: () => void
  onEdit?: () => void
  onDelete?: () => void
  dark?: boolean
}

export const PROJECT_COLORS: Record<string, { from: string; to: string; text: string; bg: string; ring: string }> = {
  red:    { from: 'from-red-500',    to: 'to-rose-600',    text: 'text-red-400',    bg: 'bg-red-500/15',    ring: 'ring-red-500/30' },
  orange: { from: 'from-orange-500', to: 'to-amber-500',   text: 'text-orange-400', bg: 'bg-orange-500/15', ring: 'ring-orange-500/30' },
  yellow: { from: 'from-yellow-400', to: 'to-amber-500',   text: 'text-yellow-400', bg: 'bg-yellow-500/15', ring: 'ring-yellow-500/30' },
  green:  { from: 'from-emerald-500',to: 'to-teal-500',    text: 'text-emerald-400',bg: 'bg-emerald-500/15',ring: 'ring-emerald-500/30' },
  teal:   { from: 'from-teal-400',   to: 'to-cyan-500',    text: 'text-teal-400',   bg: 'bg-teal-500/15',   ring: 'ring-teal-500/30' },
  blue:   { from: 'from-blue-500',   to: 'to-indigo-500',  text: 'text-blue-400',   bg: 'bg-blue-500/15',   ring: 'ring-blue-500/30' },
  indigo: { from: 'from-indigo-500', to: 'to-violet-500',  text: 'text-indigo-400', bg: 'bg-indigo-500/15', ring: 'ring-indigo-500/30' },
  purple: { from: 'from-purple-500', to: 'to-fuchsia-500', text: 'text-purple-400', bg: 'bg-purple-500/15', ring: 'ring-purple-500/30' },
  pink:   { from: 'from-pink-500',   to: 'to-rose-500',    text: 'text-pink-400',   bg: 'bg-pink-500/15',   ring: 'ring-pink-500/30' },
}

export function ProjectCard({ project, isOwner, onClick, onShare, onEdit, onDelete, dark = true }: Props) {
  const color  = PROJECT_COLORS[project.color] ?? PROJECT_COLORS.blue
  const border = dark ? 'border-white/8' : 'border-gray-200'
  const card   = dark ? 'bg-[#16181f]' : 'bg-white'
  const body   = dark ? 'bg-[#1c1f2b]' : 'bg-gray-50'
  const txt    = dark ? 'text-white' : 'text-gray-900'
  const muted  = dark ? 'text-slate-400' : 'text-gray-500'
  const foot   = dark ? 'border-white/6 bg-[#13151c]' : 'border-gray-100 bg-gray-50'
  const btnCls = dark
    ? 'text-slate-400 hover:text-white hover:bg-white/8 border border-white/8'
    : 'text-gray-500 hover:text-gray-900 hover:bg-gray-100 border border-gray-200'

  return (
    <div className={`group flex flex-col rounded-2xl border overflow-hidden transition-all duration-200 hover:shadow-xl hover:shadow-black/20 hover:-translate-y-0.5 ${card} ${border}`}>

      {/* ── Coloured header ── */}
      <button
        onClick={onClick}
        className={`relative flex flex-col items-center justify-center gap-3 h-32 bg-gradient-to-br ${color.from} ${color.to} cursor-pointer`}
      >
        {/* Glassmorphism icon */}
        <div className="w-14 h-14 rounded-2xl bg-white/20 ring-1 ring-white/30 backdrop-blur-sm flex items-center justify-center shadow-lg">
          <Lock className="w-7 h-7 text-white drop-shadow" />
        </div>

        {/* Owner/member badge */}
        <span className={`absolute top-3 right-3 flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded-full backdrop-blur-sm ${
          isOwner ? 'bg-black/20 text-white/90' : 'bg-black/15 text-white/80'
        }`}>
          {isOwner ? <Crown className="w-2.5 h-2.5" /> : <Users className="w-2.5 h-2.5" />}
          {isOwner ? 'Tuyo' : 'Miembro'}
        </span>
      </button>

      {/* ── Body ── */}
      <button onClick={onClick} className={`flex-1 text-left px-4 pt-4 pb-3 ${body}`}>
        <h3 className={`text-sm font-bold truncate mb-0.5 ${txt}`}>{project.name}</h3>
        <p className={`text-xs truncate ${muted}`}>
          {project.description || 'Sin descripción'}
        </p>

        {/* Stats */}
        <div className="flex items-center gap-3 mt-3">
          <div className={`flex items-center gap-1.5 text-xs ${muted}`}>
            <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${color.from} ${color.to}`} />
            {project.entry_count ?? 0} {project.entry_count === 1 ? 'contraseña' : 'contraseñas'}
          </div>
          <div className={`flex items-center gap-1.5 text-xs ${muted}`}>
            <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-r ${color.from} ${color.to}`} />
            {(project.member_count ?? 0) + 1} {(project.member_count ?? 0) + 1 === 1 ? 'miembro' : 'miembros'}
          </div>
        </div>
      </button>

      {/* ── Footer actions ── */}
      <div className={`flex items-center gap-1.5 px-3 py-2.5 border-t ${foot}`}>
        <button
          onClick={e => { e.stopPropagation(); onShare() }}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${btnCls}`}
        >
          <Users className="w-3 h-3" />
          Compartir
        </button>

        {isOwner && onEdit && (
          <button
            onClick={e => { e.stopPropagation(); onEdit() }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${btnCls}`}
          >
            <Pencil className="w-3 h-3" />
            Editar
          </button>
        )}

        {isOwner && onDelete && (
          <button
            onClick={e => { e.stopPropagation(); onDelete() }}
            className="ml-auto p-1.5 rounded-lg text-slate-600 hover:text-red-400 hover:bg-red-500/10 transition-all"
            title="Eliminar proyecto"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </div>
  )
}
