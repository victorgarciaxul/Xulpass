'use client'

import { useState } from 'react'
import { RefreshCw, Eye, EyeOff } from 'lucide-react'
import { generatePassword } from '@/lib/crypto'
import { type VaultEntryForm, type Category } from '@/types'

const CATEGORIES: Category[] = ['web', 'app', 'email', 'social', 'banking', 'server', 'other']

interface Props {
  initial?: Partial<VaultEntryForm>
  onSubmit: (data: VaultEntryForm) => Promise<void>
  onCancel: () => void
  loading?: boolean
  dark?: boolean
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">{label}</label>
      {children}
    </div>
  )
}

const inputClsDark  = "w-full h-10 px-3 rounded-xl bg-[#1a1d27] border border-white/5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/40 transition-colors"
const inputClsLight = "w-full h-10 px-3 rounded-xl bg-gray-50 border border-gray-200 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500/40 transition-colors"

export function EntryForm({ initial, onSubmit, onCancel, loading, dark = true }: Props) {
  const [form, setForm] = useState<VaultEntryForm>({
    title: initial?.title ?? '',
    username: initial?.username ?? '',
    password: initial?.password ?? '',
    url: initial?.url ?? '',
    category: initial?.category ?? 'web',
    notes: initial?.notes ?? '',
    favorite: initial?.favorite ?? false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const inputCls = dark ? inputClsDark : inputClsLight

  function set(field: keyof VaultEntryForm, value: string | boolean) {
    setForm(f => ({ ...f, [field]: value }))
  }

  function handleGenerate() {
    set('password', generatePassword(20))
    setShowPassword(true)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    await onSubmit(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2">
          <Field label="Título *">
            <input required className={inputCls} value={form.title} onChange={e => set('title', e.target.value)} placeholder="ej. Gmail Agencia" />
          </Field>
        </div>

        <Field label="Usuario / Email *">
          <input required className={inputCls} value={form.username} onChange={e => set('username', e.target.value)} placeholder="usuario@ejemplo.com" />
        </Field>

        <Field label="Categoría">
          <select
            value={form.category}
            onChange={e => set('category', e.target.value)}
            className={inputCls}
          >
            {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </Field>

        <div className="col-span-2">
          <Field label="Contraseña *">
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  value={form.password}
                  onChange={e => set('password', e.target.value)}
                  placeholder="••••••••"
                  className={inputCls + ' pr-10'}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(s => !s)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                title="Generar contraseña segura"
                className="h-10 w-10 flex items-center justify-center rounded-xl bg-[#1a1d27] border border-white/5 text-slate-400 hover:text-white hover:border-red-500/30 transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </Field>
        </div>

        <div className="col-span-2">
          <Field label="URL">
            <input className={inputCls} value={form.url} onChange={e => set('url', e.target.value)} placeholder="https://ejemplo.com" />
          </Field>
        </div>

        <div className="col-span-2">
          <Field label="Notas">
            <textarea
              value={form.notes}
              onChange={e => set('notes', e.target.value)}
              rows={3}
              placeholder="Notas adicionales..."
              className={`w-full px-3 py-2.5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-500/40 resize-none ${dark ? 'bg-[#1a1d27] border border-white/5 text-white placeholder:text-slate-600' : 'bg-gray-50 border border-gray-200 text-gray-900 placeholder:text-gray-400'}`}
            />
          </Field>
        </div>

        <div className="col-span-2 flex items-center gap-2">
          <input
            type="checkbox"
            id="favorite"
            checked={form.favorite}
            onChange={e => set('favorite', e.target.checked)}
            className="w-4 h-4 rounded accent-red-600"
          />
          <label htmlFor="favorite" className="text-sm text-slate-400">Marcar como favorito</label>
        </div>
      </div>

      <div className="flex gap-2 justify-end pt-2 border-t border-white/5">
        <button
          type="button"
          onClick={onCancel}
          className={`h-10 px-5 rounded-xl text-sm transition-colors ${dark ? 'bg-[#1a1d27] border border-white/5 text-slate-400 hover:text-white' : 'bg-gray-100 border border-gray-200 text-gray-500 hover:text-gray-900'}`}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={loading}
          className="h-10 px-5 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-60"
        >
          {loading ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}
