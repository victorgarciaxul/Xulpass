'use client'

import { useState } from 'react'
import { Key, LogIn, Mail, Shield } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

type Screen = 'login' | 'forgot' | 'forgot-sent' | 'mfa'

export default function LoginPage() {
  const [screen, setScreen] = useState<Screen>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mfaCode, setMfaCode] = useState('')
  const [mfaFactorId, setMfaFactorId] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const supabase = createClient()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) {
      setError('Email o contraseña incorrectos')
      setLoading(false)
      return
    }
    // Check if user has MFA enabled
    const { data } = await supabase.auth.mfa.listFactors()
    const totpFactor = data?.totp?.find(f => f.status === 'verified')
    if (totpFactor) {
      setMfaFactorId(totpFactor.id)
      setLoading(false)
      setScreen('mfa')
      return
    }
    window.location.href = '/'
  }

  async function handleMfa(e: React.FormEvent) {
    e.preventDefault()
    if (mfaCode.length !== 6) { setError('El código debe tener 6 dígitos'); return }
    setLoading(true); setError('')
    const { data: challenge, error: ce } = await supabase.auth.mfa.challenge({ factorId: mfaFactorId })
    if (ce || !challenge) { setError('Error al generar el desafío'); setLoading(false); return }
    const { error } = await supabase.auth.mfa.verify({ factorId: mfaFactorId, challengeId: challenge.id, code: mfaCode })
    setLoading(false)
    if (error) { setError('Código incorrecto'); return }
    window.location.href = '/'
  }

  async function handleForgot(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    })
    setLoading(false)
    if (error) {
      setError('Error al enviar el email. Comprueba la dirección.')
      return
    }
    setScreen('forgot-sent')
  }

  const inputClass = "w-full h-11 px-4 rounded-xl bg-[#1a1d27] border border-white/5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40 transition-colors"

  return (
    <div className="min-h-screen bg-[#0f1117] flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-red-600 mb-5 shadow-2xl shadow-red-600/40">
            <Key className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Xulpass<span className="text-red-500">···|</span>
          </h1>
          <p className="text-slate-500 mt-2 text-sm">TU GESTOR DE CONTRASEÑAS</p>
        </div>

        {/* Card */}
        <div className="bg-[#13151c] border border-white/5 rounded-2xl p-7 shadow-2xl">

          {screen === 'login' && (
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</label>
                <input type="email" required placeholder="tu@xul.es" value={email}
                  onChange={e => setEmail(e.target.value)} autoComplete="email" className={inputClass} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Contraseña</label>
                <input type="password" required placeholder="••••••••" value={password}
                  onChange={e => setPassword(e.target.value)} autoComplete="current-password" className={inputClass} />
              </div>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>
              )}
              <button type="submit" disabled={loading}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors shadow-lg shadow-red-600/20 disabled:opacity-60 mt-2">
                <LogIn className="w-4 h-4" />
                {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
              </button>
              <button type="button" onClick={() => { setScreen('forgot'); setError('') }}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors pt-1">
                ¿No recuerdas tu contraseña?
              </button>
            </form>
          )}

          {screen === 'forgot' && (
            <form onSubmit={handleForgot} className="space-y-4">
              <p className="text-sm text-slate-400">Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.</p>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Email</label>
                <input type="email" required placeholder="tu@xul.es" value={email}
                  onChange={e => setEmail(e.target.value)} autoComplete="email" className={inputClass} />
              </div>
              {error && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>
              )}
              <button type="submit" disabled={loading}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors shadow-lg shadow-red-600/20 disabled:opacity-60">
                <Mail className="w-4 h-4" />
                {loading ? 'Enviando...' : 'Enviar enlace'}
              </button>
              <button type="button" onClick={() => { setScreen('login'); setError('') }}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors pt-1">
                ← Volver al login
              </button>
            </form>
          )}

          {screen === 'mfa' && (
            <form onSubmit={handleMfa} className="space-y-4">
              <div className="flex justify-center mb-2">
                <div className="w-12 h-12 rounded-2xl bg-red-600/10 flex items-center justify-center">
                  <Shield className="w-6 h-6 text-red-500" />
                </div>
              </div>
              <p className="text-sm text-slate-400 text-center">Introduce el código de 6 dígitos de tu aplicación autenticadora.</p>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Código 2FA</label>
                <input
                  type="text" inputMode="numeric" maxLength={6} placeholder="000000"
                  value={mfaCode} onChange={e => setMfaCode(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  className={`${inputClass} text-center tracking-[0.5em] font-mono`}
                />
              </div>
              {error && <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm rounded-xl px-4 py-3">{error}</div>}
              <button type="submit" disabled={loading || mfaCode.length !== 6}
                className="w-full h-11 flex items-center justify-center gap-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors shadow-lg shadow-red-600/20 disabled:opacity-60">
                {loading ? 'Verificando...' : 'Verificar'}
              </button>
              <button type="button" onClick={() => { setScreen('login'); setMfaCode(''); setError('') }}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors pt-1">
                ← Volver al login
              </button>
            </form>
          )}

          {screen === 'forgot-sent' && (
            <div className="text-center space-y-4 py-2">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-emerald-500/10 mb-2">
                <Mail className="w-7 h-7 text-emerald-400" />
              </div>
              <p className="text-white font-semibold">Email enviado</p>
              <p className="text-slate-400 text-sm">Revisa tu bandeja de entrada en <span className="text-white">{email}</span> y haz clic en el enlace para restablecer tu contraseña.</p>
              <button type="button" onClick={() => { setScreen('login'); setError('') }}
                className="w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors pt-2">
                ← Volver al login
              </button>
            </div>
          )}

        </div>

        <p className="text-center text-xs text-slate-700 mt-6">
          Acceso exclusivo para miembros de XUL
        </p>
      </div>
    </div>
  )
}
