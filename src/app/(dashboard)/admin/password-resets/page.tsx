import type { Metadata } from 'next'
import { requirePage } from '@/lib/permissions'
import { PageHeader } from '@/components/page-header'
import { PasswordResetsManager } from './password-resets-manager'

export const metadata: Metadata = { title: 'Password Reset Requests' }

export default async function PasswordResetsPage() {
  await requirePage('SUPER_ADMIN', 'ADMIN')

  return (
    <div className="space-y-6 animate-fade-in">
      <PageHeader
        title="Password Reset Requests"
        subtitle="Review and generate verification PINs for password resets."
      />
      <PasswordResetsManager />
    </div>
  )
}
