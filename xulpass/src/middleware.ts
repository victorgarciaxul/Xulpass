import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

function isConfigured() {
  return supabaseUrl?.startsWith('http') && supabaseKey && supabaseKey !== 'your_supabase_anon_key'
}

export async function middleware(request: NextRequest) {
  // Without valid Supabase credentials, let all requests pass to show the UI
  if (!isConfigured()) {
    return NextResponse.next({ request })
  }

  let supabaseResponse = NextResponse.next({ request })

  const supabase = createServerClient(
    supabaseUrl!,
    supabaseKey!,
    {
      cookies: {
        getAll() { return request.cookies.getAll() },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const isAuthPage = request.nextUrl.pathname.startsWith('/login')
  const isSsoRoute = request.nextUrl.pathname.startsWith('/api/sso')

  // SSO desde AppCenter: si llega ?sso_token= y no hay sesión, canjearlo en /api/sso
  const ssoToken = request.nextUrl.searchParams.get('sso_token')
  if (!user && ssoToken && !isSsoRoute) {
    const ssoUrl = new URL('/api/sso', request.url)
    ssoUrl.searchParams.set('sso_token', ssoToken)
    return NextResponse.redirect(ssoUrl)
  }

  if (!user && !isAuthPage && !isSsoRoute) {
    // Sin sesión: todo pasa por AppCenter (mismo patrón que MyTrack).
    // /login queda accesible solo como acceso de emergencia directo.
    const returnTo = encodeURIComponent('https://xulpass.xul.es')
    return NextResponse.redirect(`https://appcenter.xul.es?return_to=${returnTo}`)
  }

  if (user && isAuthPage) {
    return NextResponse.redirect(new URL('/', request.url))
  }

  return supabaseResponse
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
