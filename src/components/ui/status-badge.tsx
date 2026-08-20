import { Badge } from "@/components/ui/badge"

interface StatusBadgeProps {
  status: string
  variantMap?: Record<string, string>
}

const defaultVariantMap: Record<string, string> = {
  active: "default",
  inactive: "secondary",
  pending: "outline",
  error: "destructive",
}

function StatusBadge({ status, variantMap }: StatusBadgeProps) {
  const map = variantMap ?? defaultVariantMap
  const variant = (map[status.toLowerCase()] ?? "secondary") as
    | "default"
    | "secondary"
    | "destructive"
    | "outline"

  return <Badge variant={variant}>{status}</Badge>
}

export { StatusBadge }
