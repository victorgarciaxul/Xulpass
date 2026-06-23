'use client'

import { useState } from 'react'
import { Lock, ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Props {
  onUnlock: (masterPassword: string) => void
}

export function MasterPasswordGate({ onUnlock }: Props) {
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (password.length < 8) {
      setError('La contraseña maestra debe tener al menos 8 caracteres')
      return
    }
    onUnlock(password)
  }

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-violet-600/20 border border-violet-500/30 mb-4">
            <Lock className="w-8 h-8 text-violet-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Bóveda bloqueada</h1>
          <p className="text-slate-400 mt-1">Ingresa tu contraseña maestra para acceder</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-slate-900 border border-slate-800 rounded-xl p-6">
          <div className="space-y-2">
            <Label htmlFor="master">Contraseña maestra</Label>
            <Input
              id="master"
              type="password"
              placeholder="••••••••••••"
              value={password}
              onChange={e => { setPassword(e.target.value); setError('') }}
              autoFocus
            />
            {error && <p className="text-red-400 text-xs">{error}</p>}
          </div>

          <Button type="submit" className="w-full gap-2">
            <ShieldCheck className="w-4 h-4" />
            Desbloquear bóveda
          </Button>
        </form>

        <p className="text-center text-xs text-slate-600 mt-4">
          Las contraseñas se cifran localmente con AES-256-GCM. El servidor nunca ve tus datos en texto plano.
        </p>
      </div>
    </div>
  )
}
