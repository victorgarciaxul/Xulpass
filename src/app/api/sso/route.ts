import { createServerClient } from '@supabase/ssr'
import { createClient as createAdminClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'
import { NextResponse, type NextRequest } from 'next/server'

// SSO desde AppCenter.
// AppCenter lanza la app con ?sso_email=...&sso_token=... El token está firmado
// por AppCenter, es de un solo uso y caduca en 60s. Aquí lo verificamos contra
// la Edge Function de AppCenter y, si es válido, creamos la sesión de Supabase
// del usuario en XulPass sin pedirle login.

const APPCENTER_VERIFY_URL =
  'https://qwlebsymypgauydkqxem.supabase.co/functions/v1/sso/verify'
const APPCENTER_ANON =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF3bGVic3lteXBnYXV5ZGtxeGVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA1Njk4ODUsImV4cCI6MjA5NjE0NTg4NX0.tidfgCi6czlYBOAtuLD20Ouxomk_jeMG2FhsjuGmVzo'

export async function GET(request: NextRequest) {
  const ssoToken = request.nextUrl.searchParams.get('sso_token')
  const loginUrl = new URL('/login', request.url)

  if (!ssoToken) return NextResponse.redirect(loginUrl)

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!serviceKey) {
    loginUrl.searchParams.set('error', 'sso_config')
    return NextResponse.redirect(loginUrl)
  }

  try {
    // 1. Verificar el token contra AppCenter (un solo uso, 60s)
    const verifyRes = await fetch(APPCENTER_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${APPCENTER_ANON}`,
      },
      body: JSON.stringify({ sso_token: ssoToken }),
    })
    const { valid, email } = await verifyRes.json()
    if (!valid || !email) {
      loginUrl.searchParams.set('error', 'sso_invalid')
      return NextResponse.redirect(loginUrl)
    }

    // 2. Generar un token de sesión para ese email (verificado criptográficamente)
    const admin = createAdminClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      serviceKey,
      { auth: { autoRefreshToken: false, persistSession: false } }
    )
    const { data: linkData, error: linkErr } = await admin.auth.admin.generateLink({
      type: 'magiclink',
      email,
    })
    const tokenHash = linkData?.properties?.hashed_token
    if (linkErr || !tokenHash) {
      // El usuario no existe en XulPass u otro error
      loginUrl.searchParams.set('error', 'sso_user')
      return NextResponse.redirect(loginUrl)
    }

    // 3. Canjear el token y fijar las cookies de sesión en la respuesta
    const response = NextResponse.redirect(new URL('/', request.url))
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options)
            )
          },
        },
      }
    )
    const { error: otpErr } = await supabase.auth.verifyOtp({
      type: 'email',
      token_hash: tokenHash,
    })
    if (otpErr) {
      loginUrl.searchParams.set('error', 'sso_session')
      return NextResponse.redirect(loginUrl)
    }

    return response
  } catch {
    loginUrl.searchParams.set('error', 'sso_error')
    return NextResponse.redirect(loginUrl)
  }
}
