'use client'

import { useState } from 'react'
import { X, FolderOpen } from 'lucide-react'
import { PROJECT_COLORS } from './ProjectCard'
import { type Project } from '@/types'

interface Props {
  initial?: Partial<Project>
  onSubmit: (data: { name: string; description: string; color: string }) => Promise<void>
  onClose: () => void
  dark?: boolean
}

const COLORS = Object.keys(PROJECT_COLORS)

const COLOR_LABELS: Record<string, string> = {
  red: 'Rojo', orange: 'Naranja', yellow: 'Amarillo', green: 'Verde',
  teal: 'Teal', blue: 'Azul', indigo: 'Índigo', purple: 'Morado', pink: 'Rosa',
}

export function ProjectForm({ initial, onSubmit, onClose, dark = true }: Props) {
  const [name, setName] = useState(initial?.name ?? '')
  const [description, setDescription] = useState(initial?.description ?? '')
  const [color, setColor] = useState(initial?.color ?? 'blue')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const bg    = dark ? 'bg-[#13151c] border-white/5' : 'bg-white border-gray-200'
  const txt   = dark ? 'text-white' : 'text-gray-900'
  const muted = dark ? 'text-slate-400' : 'text-gray-500'
  const input = dark ? 'bg-[#1a1d27] border-white/5 text-white placeholder:text-slate-600' : 'bg-gray-50 border-gray-200 text-gray-900 placeholder:text-gray-400'
  const div   = dark ? 'border-white/5' : 'border-gray-100'

  const c = PROJECT_COLORS[color]

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!name.trim()) { setError('El nombre es obligatorio'); return }
    setLoading(true)
    setError('')
    try {
      await onSubmit({ name: name.trim(), description: description.trim(), color })
      onClose()
    } catch {
      setError('Error al guardar el proyecto')
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className={`w-full max-w-md rounded-2xl shadow-2xl border ${bg}`} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${div}`}>
          <div className="flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-red-500" />
            <h2 className={`text-base font-semibold ${txt}`}>
              {initial?.id ? 'Editar proyecto' : 'Nuevo proyecto'}
            </h2>
          </div>
          <button onClick={onClose} className={`w-8 h-8 rounded-lg flex items-center justify-center ${dark ? 'bg-white/5 hover:bg-white/10 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">

          {/* Preview */}
          <div className={`flex items-center gap-4 p-4 rounded-xl ${dark ? 'bg-white/5' : 'bg-gray-50'}`}>
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${c.from} ${c.to} flex items-center justify-center shadow-lg flex-shrink-0`}>
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <div>
              <p className={`font-semibold ${txt}`}>{name || 'Nombre del proyecto'}</p>
              <p className={`text-xs ${muted}`}>{description || 'Descripción opcional'}</p>
            </div>
          </div>

          {/* Name */}
          <div className="space-y-1.5">
            <label className={`text-xs font-semibold uppercase tracking-wider ${muted}`}>Nombre *</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Ej: Redes Sociales, Clientes, Servidores..."
              className={`w-full h-10 px-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-red-500/40 ${input}`}
              autoFocus
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className={`text-xs font-semibold uppercase tracking-wider ${muted}`}>Descripción</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Para qué sirve este proyecto..."
              className={`w-full h-10 px-3 rounded-xl text-sm border focus:outline-none focus:ring-2 focus:ring-red-500/40 ${input}`}
            />
          </div>

          {/* Color picker */}
          <div className="space-y-2">
            <label className={`text-xs font-semibold uppercase tracking-wider ${muted}`}>Color</label>
            <div className="flex flex-wrap gap-2">
              {COLORS.map(c => {
                const col = PROJECT_COLORS[c]
                return (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setColor(c)}
                    title={COLOR_LABELS[c]}
                    className={`w-8 h-8 rounded-full bg-gradient-to-br ${col.from} ${col.to} transition-all ${
                      color === c ? 'ring-2 ring-offset-2 ring-white/60 scale-110' : 'opacity-60 hover:opacity-100'
                    } ${dark ? 'ring-offset-[#13151c]' : 'ring-offset-white'}`}
                  />
                )
              })}
            </div>
          </div>

          {error && <p className="text-red-400 text-xs">{error}</p>}

          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 h-10 rounded-xl border text-sm font-medium transition-colors ${dark ? `border-white/10 ${txt} hover:bg-white/5` : 'border-gray-200 text-gray-700 hover:bg-gray-50'}`}
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className={`flex-1 h-10 rounded-xl bg-gradient-to-r ${c.from} ${c.to} text-white text-sm font-semibold transition-all shadow-lg disabled:opacity-50`}
            >
              {loading ? 'Guardando...' : initial?.id ? 'Guardar cambios' : 'Crear proyecto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
