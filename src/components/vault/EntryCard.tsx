'use client'

import { useState } from 'react'
import { Copy, Eye, EyeOff, Star, Pencil, Trash2, Lock } from 'lucide-react'
import { type VaultEntry } from '@/types'

interface Props {
  entry: VaultEntry
  onEdit: (entry: VaultEntry) => void
  onDelete: (id: string) => void
  onView: () => void
  dark?: boolean
}

function FaviconIcon({ url, title }: { url: string | null; title: string }) {
  const [imgError, setImgError] = useState(false)

  if (url && !imgError) {
    try {
      const domain = new URL(url).hostname
      return (
        <img
          src={`https://www.google.com/s2/favicons?domain=${domain}&sz=64`}
          alt={title}
          className="w-10 h-10 object-contain"
          onError={() => setImgError(true)}
        />
      )
    } catch {}
  }

  const colors = ['bg-red-500','bg-blue-500','bg-green-500','bg-purple-500','bg-orange-500','bg-pink-500','bg-teal-500','bg-indigo-500']
  const color = colors[title.charCodeAt(0) % colors.length]
  return (
    <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center text-white font-bold text-lg`}>
      {title.charAt(0).toUpperCase()}
    </div>
  )
}

export function EntryCard({ entry, onEdit, onDelete, onView, dark = true }: Props) {
  const [revealed, setRevealed] = useState(false)
  const [copiedPwd, setCopiedPwd] = useState(false)
  const [copiedUser, setCopiedUser] = useState(false)
  const [hovered, setHovered] = useState(false)

  async function handleCopyPassword(e: React.MouseEvent) {
    e.stopPropagation()
    await navigator.clipboard.writeText(entry.encrypted_password)
    setCopiedPwd(true)
    setTimeout(() => setCopiedPwd(false), 1500)
  }

  async function handleCopyUsername(e: React.MouseEvent) {
    e.stopPropagation()
    await navigator.clipboard.writeText(entry.username)
    setCopiedUser(true)
    setTimeout(() => setCopiedUser(false), 1500)
  }

  const cardBg     = dark ? 'bg-[#1a1d27] border-white/5 hover:bg-[#1e2133]'        : 'bg-white border-gray-200 hover:bg-gray-50 shadow-sm'
  const titleCls   = dark ? 'text-white'    : 'text-gray-900'
  const mutedCls   = dark ? 'text-slate-500' : 'text-gray-400'
  const actionsBg  = dark ? 'from-[#1e2133]' : 'from-gray-100'
  const btnCls     = dark ? 'bg-white/5 hover:bg-red-600/20 text-slate-400 hover:text-red-400' : 'bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-500'
  const iconBtnCls = dark ? 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white'     : 'bg-gray-100 hover:bg-gray-200 text-gray-400 hover:text-gray-700'

  return (
    <div
      className={`flex flex-col group rounded-2xl p-4 cursor-pointer border hover:border-red-500/30 transition-all duration-200 ${cardBg}`}
      onClick={onView}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* Favicon */}
      <div className="relative flex items-center justify-center mb-3 mt-1">
        <FaviconIcon url={entry.url} title={entry.title} />
        {entry.favorite && (
          <Star className="absolute -top-1 -right-1 w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
        )}
      </div>

      {/* Title */}
      <p className={`text-sm font-semibold text-center truncate mb-0.5 ${titleCls}`}>{entry.title}</p>

      {/* Username */}
      <div className="flex items-center justify-center gap-1">
        <p className={`text-xs truncate max-w-[120px] ${mutedCls}`}>{entry.username}</p>
        <button onClick={handleCopyUsername} className={`opacity-0 group-hover:opacity-100 transition-opacity ${mutedCls}`}>
          <Copy className={`w-2.5 h-2.5 ${copiedUser ? 'text-green-400' : ''}`} />
        </button>
      </div>

      {/* Password row */}
      <div className="flex items-center justify-center gap-1.5 mt-1.5">
        <span className={`text-xs font-mono ${mutedCls}`}>
          {revealed ? entry.encrypted_password.slice(0, 12) : '•••••••••'}
        </span>
        <button onClick={e => { e.stopPropagation(); setRevealed(r => !r) }}
          className={`opacity-0 group-hover:opacity-100 transition-opacity ${mutedCls}`}>
          {revealed ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
        </button>
      </div>

      {/* Actions — always in flow, visible on hover */}
      <div className={`mt-3 flex items-center justify-center gap-1 transition-opacity duration-150 ${hovered ? 'opacity-100' : 'opacity-0'}`}>
        <button onClick={handleCopyPassword} className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs transition-colors ${btnCls}`}>
          <Copy className={`w-3 h-3 ${copiedPwd ? 'text-green-400' : ''}`} />
          {copiedPwd ? '¡Copiado!' : 'Copiar'}
        </button>
        <button onClick={e => { e.stopPropagation(); onEdit(entry) }} className={`p-1.5 rounded-lg transition-colors ${iconBtnCls}`}>
          <Pencil className="w-3 h-3" />
        </button>
        <button onClick={e => { e.stopPropagation(); onDelete(entry.id) }} className={`p-1.5 rounded-lg transition-colors ${iconBtnCls} hover:!text-red-500`}>
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  )
}
