import { redirect } from 'next/navigation'

export default async function ResetPasswordPage() {
  redirect('/verify-pin?type=forgot')
}
