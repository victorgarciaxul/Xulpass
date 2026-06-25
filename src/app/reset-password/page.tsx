'use client'

import { useState } from 'react'
import { Key } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [ok, setOk] = useState(false)
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleReset(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    if (password !== confirm) {
      setError('Las contraseñas no coinciden')
      return
    }
    if (password.length < 6) {
      setError('Mínimo 6 caracteres')
      return
    }
    setLoading(true)
    const { error } = await supabase.auth.updateUser({ password })
    setLoading(false)
    if (error) {
      setError('El enlace ha expirado o no es válido. Solicita uno nuevo.')
      return
    }
    setOk(true)
    setTimeout(() => { window.location.href = '/' }, 2500)
  }

  const inputClass = "w-full h-11 px-4 rounded-xl bg-[#1a1d27] border border-white/5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/40 transition-colors"

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-600 mb-5 shadow-2xl shadow-red-600/40">
            <Key className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Xulpass<span className="text-red-500">···|</span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm">NUEVA CONTRASEÑA</p>
        </div>

        <div className="bg-[#13151c] border border-white/5 rounded-2xl p-7 shadow-2xl">
          {ok ? (
            <div className="text-center py-4 space-y-3">
              <p className="text-2xl">✅</p>
              <p className="text-white font-semibold">Contraseña actualizada</p>
              <p className="text-slate-400 text-sm">Redirigiendo al inicio...</p>
            </div>
          ) : (
            <form onSubmit={handleReset} className="space-y-4">
              <p className="text-sm text-slate-400 mb-2">Introduce tu nueva contraseña.</p>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Nueva contraseña</label>
                <input type="password" required placeholder="Mínimo 6 caracteres" value={password}
                  onChange={e => setPassword(e.target.value)} className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Confirmar contraseña</label>
                <input type="password" required placeholder="••••••••" value={confirm}
                  onChange={e => setConfirm(e.target.value)} className={inputClass} />
              </div>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>
              )}
              <button type="submit" disabled={loading}
                className="w-full h-11 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors shadow-lg shadow-red-600/20 disabled:opacity-60">
                {loading ? 'Guardando...' : 'Guardar nueva contraseña'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}
