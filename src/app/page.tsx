import { redirect } from 'next/navigation'

import { getSessionUser } from '@/lib/permissions'
import { roleHome } from '@/lib/permissions'

export default async function Home() {
  const user = await getSessionUser()
  if (user?.role) redirect(roleHome[user.role])
  redirect('/login')
}
