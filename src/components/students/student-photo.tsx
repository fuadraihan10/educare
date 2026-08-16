import Image from 'next/image'

import { cn } from '@/lib/utils'

export function StudentPhoto({
  storageKey,
  name,
  className,
  size = 40,
}: {
  storageKey?: string | null
  name: string
  className?: string
  size?: number
}) {
  const initials = name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join('')

  if (!storageKey) {
    return (
      <div
        aria-label={name}
        className={cn(
          'flex items-center justify-center rounded-lg bg-muted text-xs font-semibold text-muted-foreground',
          className
        )}
        style={{ width: size, height: size }}
      >
        {initials}
      </div>
    )
  }

  return (
    <Image
      src={`/api/uploads/${storageKey}`}
      alt={name}
      width={size}
      height={size}
      className={cn('rounded-lg object-cover', className)}
      style={{ width: size, height: size }}
      unoptimized
    />
  )
}
