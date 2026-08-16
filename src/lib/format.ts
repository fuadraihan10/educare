export function formatDate(d: Date): string {
  return d.toISOString().slice(0, 10)
}

export function fullName(s: {
  firstName: string
  middleName?: string | null
  lastName: string
}): string {
  return [s.firstName, s.middleName, s.lastName].filter(Boolean).join(' ')
}

export function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}
