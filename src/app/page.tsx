import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { VaultDashboard } from '@/components/vault/VaultDashboard'

export default async function HomePage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) redirect('/login')

  return <VaultDashboard userId={user.id} userEmail={user.email!} />
}
