'use client'

import { useEffect, useState } from 'react'
import { X, Shield, ShieldCheck, ShieldOff, Copy } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'

interface Props {
  onClose: () => void
  dark?: boolean
}

type Step = 'status' | 'enroll' | 'verify' | 'disable'

export function TwoFactorSetup({ onClose, dark = true }: Props) {
  const [step, setStep] = useState<Step>('status')
  const [enabled, setEnabled] = useState(false)
  const [factorId, setFactorId] = useState('')
  const [qrUri, setQrUri] = useState('')
  const [secret, setSecret] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const supabase = createClient()

  const bg    = dark ? 'bg-[#13151c] border-white/5' : 'bg-white border-gray-200'
  const txt   = dark ? 'text-white' : 'text-gray-900'
  const muted = dark ? 'text-slate-400' : 'text-gray-500'
  const inputC= dark ? 'bg-[#1a1d27] border-white/5 text-white placeholder:text-slate-600' : 'bg-gray-50 border-gray-200 text-gray-900'
  const div   = dark ? 'border-white/5' : 'border-gray-100'

  useEffect(() => {
    async function checkStatus() {
      const { data } = await supabase.auth.mfa.listFactors()
      const verified = data?.totp?.find(f => f.status === 'verified')
      if (verified) { setEnabled(true); setFactorId(verified.id) }
    }
    checkStatus()
  }, [])

  async function startEnroll() {
    setLoading(true); setError('')
    const { data, error } = await supabase.auth.mfa.enroll({ factorType: 'totp', issuer: 'Xulpass', friendlyName: 'Xulpass 2FA' })
    setLoading(false)
    if (error || !data) { setError('Error al generar el código QR'); return }
    setFactorId(data.id)
    setQrUri(data.totp.qr_code)
    setSecret(data.totp.secret)
    setStep('enroll')
  }

  async function verifyEnroll() {
    if (code.length !== 6) { setError('El código debe tener 6 dígitos'); return }
    setLoading(true); setError('')
    const { data: challenge } = await supabase.auth.mfa.challenge({ factorId })
    if (!challenge) { setError('Error al crear el desafío'); setLoading(false); return }
    const { error } = await supabase.auth.mfa.verify({ factorId, challengeId: challenge.id, code })
    setLoading(false)
    if (error) { setError('Código incorrecto. Inténtalo de nuevo.'); return }
    setEnabled(true); setDone(true)
    setTimeout(() => onClose(), 2000)
  }

  async function disable() {
    setLoading(true); setError('')
    const { error } = await supabase.auth.mfa.unenroll({ factorId })
    setLoading(false)
    if (error) { setError('Error al desactivar 2FA'); return }
    setEnabled(false); setDone(true)
    setTimeout(() => onClose(), 1500)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4" onClick={onClose}>
      <div className={`w-full max-w-md rounded-2xl shadow-2xl border ${bg}`} onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${div}`}>
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-red-500" />
            <h2 className={`text-base font-semibold ${txt}`}>Verificación en dos pasos</h2>
          </div>
          <button onClick={onClose} className={`w-8 h-8 rounded-lg flex items-center justify-center ${dark ? 'bg-white/5 hover:bg-white/10 text-slate-400' : 'bg-gray-100 text-gray-500'}`}>
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="px-6 py-5">

          {done && (
            <div className="text-center py-4">
              <ShieldCheck className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <p className={`font-semibold ${txt}`}>{enabled ? '2FA activado correctamente' : '2FA desactivado'}</p>
            </div>
          )}

          {!done && step === 'status' && (
            <div className="space-y-4">
              <div className={`flex items-center gap-3 p-4 rounded-xl ${dark ? 'bg-white/5' : 'bg-gray-50'}`}>
                {enabled
                  ? <ShieldCheck className="w-8 h-8 text-emerald-400 flex-shrink-0" />
                  : <Shield className="w-8 h-8 text-slate-500 flex-shrink-0" />
                }
                <div>
                  <p className={`text-sm font-semibold ${txt}`}>{enabled ? 'Activo' : 'No activado'}</p>
                  <p className={`text-xs ${muted}`}>{enabled ? 'Tu cuenta está protegida con 2FA' : 'Añade una capa extra de seguridad'}</p>
                </div>
              </div>
              <p className={`text-sm ${muted}`}>
                Con la verificación en dos pasos, además de tu contraseña necesitarás un código de tu aplicación autenticadora (Google Authenticator, Authy, etc.).
              </p>
              {enabled ? (
                <button onClick={() => setStep('disable')} className="w-full h-10 rounded-xl border border-red-500/30 text-red-400 hover:bg-red-500/10 text-sm font-medium transition-colors flex items-center justify-center gap-2">
                  <ShieldOff className="w-4 h-4" /> Desactivar 2FA
                </button>
              ) : (
                <button onClick={startEnroll} disabled={loading} className="w-full h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-60">
                  {loading ? 'Generando...' : 'Activar 2FA'}
                </button>
              )}
            </div>
          )}

          {!done && step === 'enroll' && (
            <div className="space-y-4">
              <p className={`text-sm ${muted}`}>Escanea este código QR con tu app autenticadora:</p>
              <div className="flex justify-center">
                <div className="bg-white p-3 rounded-xl">
                  <img src={qrUri} alt="QR 2FA" className="w-44 h-44" />
                </div>
              </div>
              <div className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl text-xs font-mono ${dark ? 'bg-white/5' : 'bg-gray-50'} ${muted}`}>
                <span className="truncate">{secret}</span>
                <button onClick={() => navigator.clipboard.writeText(secret)} className="flex-shrink-0 hover:text-white transition-colors">
                  <Copy className="w-3.5 h-3.5" />
                </button>
              </div>
              <div className="space-y-1.5">
                <label className={`text-xs font-semibold uppercase tracking-wider ${muted}`}>Código de verificación</label>
                <input
                  type="text" inputMode="numeric" maxLength={6} placeholder="000000"
                  value={code} onChange={e => setCode(e.target.value.replace(/\D/g, ''))}
                  className={`w-full h-11 px-4 rounded-xl text-sm border text-center tracking-[0.5em] font-mono focus:outline-none focus:ring-2 focus:ring-red-500/40 ${inputC}`}
                />
              </div>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <button onClick={verifyEnroll} disabled={loading || code.length !== 6} className="w-full h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-60">
                {loading ? 'Verificando...' : 'Confirmar y activar'}
              </button>
            </div>
          )}

          {!done && step === 'disable' && (
            <div className="space-y-4 text-center">
              <ShieldOff className="w-12 h-12 text-red-400 mx-auto" />
              <p className={`text-sm ${muted}`}>¿Estás seguro de que quieres desactivar la verificación en dos pasos? Tu cuenta será menos segura.</p>
              {error && <p className="text-red-400 text-xs">{error}</p>}
              <div className="flex gap-3">
                <button onClick={() => setStep('status')} className={`flex-1 h-10 rounded-xl border text-sm font-medium ${div} ${txt}`}>Cancelar</button>
                <button onClick={disable} disabled={loading} className="flex-1 h-10 rounded-xl bg-red-600 hover:bg-red-700 text-white text-sm font-semibold transition-colors disabled:opacity-60">
                  {loading ? 'Desactivando...' : 'Desactivar'}
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  )
}
