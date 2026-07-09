'use client'

import { useState } from 'react'
import { Copy, Eye, EyeOff, Star, Pencil, Trash2, ExternalLink, X, Share2 } from 'lucide-react'
import { type VaultEntry } from '@/types'

interface Props {
  entry: VaultEntry
  onClose: () => void
  onEdit: (entry: VaultEntry) => void
  onDelete: (id: string) => void
  onShare?: () => void
  isOwner?: boolean
  dark?: boolean
}

export function EntryDetail({ entry, onClose, onEdit, onDelete, onShare, isOwner = true, dark = true }: Props) {
  const [revealed, setRevealed] = useState(false)
  const [copiedPwd, setCopiedPwd] = useState(false)
  const [copiedUser, setCopiedUser] = useState(false)

  async function copyPassword() {
    await navigator.clipboard.writeText(entry.encrypted_password)
    setCopiedPwd(true)
    setTimeout(() => setCopiedPwd(false), 1500)
  }

  async function copyUsername() {
    await navigator.clipboard.writeText(entry.username)
    setCopiedUser(true)
    setTimeout(() => setCopiedUser(false), 1500)
  }

  function handleDelete() {
    onDelete(entry.id)
    onClose()
  }

  const overlay  = 'fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4'
  const modal    = dark ? 'bg-[#13151c] border border-white/5' : 'bg-white border border-gray-200'
  const titleCls = dark ? 'text-white' : 'text-gray-900'
  const mutedCls = dark ? 'text-slate-400' : 'text-gray-500'
  const fieldBg  = dark ? 'bg-[#1a1d27] border-white/5' : 'bg-gray-50 border-gray-200'
  const fieldTxt = dark ? 'text-white' : 'text-gray-900'
  const divider  = dark ? 'border-white/5' : 'border-gray-100'
  const iconBtn  = dark ? 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white' : 'bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-900'

  return (
    <div className={overlay} onClick={onClose}>
      <div
        className={`w-full max-w-md rounded-2xl shadow-2xl ${modal}`}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${divider}`}>
          <div>
            <div className="flex items-center gap-3">
              {entry.favorite && <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />}
              <h2 className={`text-lg font-semibold ${titleCls}`}>{entry.title}</h2>
              <span className={`text-xs px-2 py-0.5 rounded-full border ${dark ? 'bg-white/5 border-white/10 text-slate-400' : 'bg-gray-100 border-gray-200 text-gray-500'}`}>
                {entry.category}
              </span>
            </div>
            {entry.shared_by_email && (
              <p className={`text-xs mt-1 ${mutedCls}`}>Compartida por {entry.shared_by_email}</p>
            )}
          </div>
          <button onClick={onClose} className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${iconBtn}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-4">

          {/* Usuario */}
          <div className="space-y-1.5">
            <p className={`text-xs font-semibold uppercase tracking-wider ${mutedCls}`}>Usuario / Email</p>
            <div className={`flex items-center justify-between px-3 h-11 rounded-xl border ${fieldBg}`}>
              <span className={`text-sm ${fieldTxt}`}>{entry.username}</span>
              <button onClick={copyUsername} className={`text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${iconBtn}`}>
                <Copy className={`w-3 h-3 ${copiedUser ? 'text-green-400' : ''}`} />
                {copiedUser ? '¡Copiado!' : 'Copiar'}
              </button>
            </div>
          </div>

          {/* Contraseña */}
          <div className="space-y-1.5">
            <p className={`text-xs font-semibold uppercase tracking-wider ${mutedCls}`}>Contraseña</p>
            <div className={`flex items-center justify-between px-3 h-11 rounded-xl border ${fieldBg}`}>
              <span className={`text-sm font-mono ${fieldTxt}`}>
                {revealed ? entry.encrypted_password : '••••••••••••'}
              </span>
              <div className="flex items-center gap-1">
                <button onClick={() => setRevealed(r => !r)} className={`p-1.5 rounded-lg transition-colors ${iconBtn}`}>
                  {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                </button>
                <button onClick={copyPassword} className={`text-xs flex items-center gap-1 px-2 py-1 rounded-lg transition-colors ${iconBtn}`}>
                  <Copy className={`w-3 h-3 ${copiedPwd ? 'text-green-400' : ''}`} />
                  {copiedPwd ? '¡Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>
          </div>

          {/* URL */}
          {entry.url && (
            <div className="space-y-1.5">
              <p className={`text-xs font-semibold uppercase tracking-wider ${mutedCls}`}>Sitio web</p>
              <a
                href={entry.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex items-center justify-between px-3 h-11 rounded-xl border ${fieldBg} group`}
              >
                <span className={`text-sm truncate ${fieldTxt}`}>{entry.url}</span>
                <ExternalLink className="w-3.5 h-3.5 text-red-400 flex-shrink-0 ml-2" />
              </a>
            </div>
          )}

          {/* Notas */}
          {entry.notes && (
            <div className="space-y-1.5">
              <p className={`text-xs font-semibold uppercase tracking-wider ${mutedCls}`}>Notas</p>
              <div className={`px-3 py-3 rounded-xl border text-sm ${fieldBg} ${fieldTxt}`}>
                {entry.notes}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`flex items-center justify-between px-6 py-4 border-t ${divider}`}>
          <div className="flex items-center gap-2">
            {isOwner && (
              <button onClick={handleDelete} className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-400 hover:bg-red-500/10 transition-colors">
                <Trash2 className="w-4 h-4" />
                Eliminar
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            {isOwner && onShare && (
              <button onClick={onShare} className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${iconBtn}`}>
                <Share2 className="w-4 h-4" />
                Compartir
              </button>
            )}
            {isOwner && (
              <button onClick={() => { onEdit(entry); onClose() }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors">
                <Pencil className="w-4 h-4" />
                Editar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
