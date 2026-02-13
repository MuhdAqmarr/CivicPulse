"use client"

import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { STATUS_LABELS, STATUS_COLORS, type ReportStatus } from "@/lib/types"
import { m, AnimatePresence } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

interface StatusBadgeProps {
  status: ReportStatus
  closureConfirmed?: boolean
  className?: string
}

// Stable variant object — defined once at module level
const BADGE_ANIM = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.9 },
  transition: { duration: 0.2 },
}

export function StatusBadge({ status, closureConfirmed, className }: StatusBadgeProps) {
  const prefersReducedMotion = useReducedMotion()

  const label =
    status === "CLOSED"
      ? closureConfirmed
        ? "Verified Fixed"
        : "Closed (Awaiting Verification)"
      : STATUS_LABELS[status]

  const badgeContent = (
    <Badge
      className={cn(
        STATUS_COLORS[status],
        status === "CLOSED" && closureConfirmed && "bg-green-200 dark:bg-green-900/50",
        className
      )}
    >
      {label}
    </Badge>
  )

  return (
    <AnimatePresence mode="wait">
      {prefersReducedMotion ? (
        <div key={status + String(closureConfirmed)}>{badgeContent}</div>
      ) : (
        <m.div key={status + String(closureConfirmed)} {...BADGE_ANIM}>
          {badgeContent}
        </m.div>
      )}
    </AnimatePresence>
  )
}
