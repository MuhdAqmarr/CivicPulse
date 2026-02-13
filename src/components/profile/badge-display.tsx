"use client"

import { m } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface BadgeDisplayProps {
  firstReport: boolean
  helper: boolean
  resolver: boolean
  size?: "sm" | "md"
}

const badges = [
  { key: "firstReport" as const, emoji: "\u{1F4CB}", label: "First Report", desc: "Created their first report" },
  { key: "helper" as const, emoji: "\u{1F91D}", label: "Helper", desc: "Posted 5+ updates/comments" },
  { key: "resolver" as const, emoji: "\u{1F3C6}", label: "Resolver", desc: "2+ confirmed closures" },
]

// Stable spring animation — defined at module level
const BADGE_SPRING = {
  initial: { scale: 0 },
  animate: { scale: 1 },
  transition: { type: "spring", stiffness: 300, damping: 15 },
}

export function BadgeDisplay({ firstReport, helper, resolver, size = "md" }: BadgeDisplayProps) {
  const prefersReducedMotion = useReducedMotion()
  const earned = { firstReport, helper, resolver }

  const sizeClass = size === "sm" ? "text-lg" : "text-2xl"
  const containerClass = size === "sm" ? "gap-1" : "gap-2"

  return (
    <TooltipProvider>
      <div className={`flex items-center ${containerClass}`}>
        {badges.map((badge) => {
          const isEarned = earned[badge.key]
          return (
            <Tooltip key={badge.key}>
              <TooltipTrigger asChild>
                <m.span
                  className={`${sizeClass} cursor-default ${isEarned ? "" : "opacity-30 grayscale"}`}
                  {...(prefersReducedMotion || !isEarned ? {} : BADGE_SPRING)}
                  role="img"
                  aria-label={`${badge.label}${isEarned ? " (earned)" : " (locked)"}`}
                >
                  {badge.emoji}
                </m.span>
              </TooltipTrigger>
              <TooltipContent>
                <p className="font-semibold">{badge.label}</p>
                <p className="text-xs">{badge.desc}</p>
                {!isEarned && <p className="text-xs text-muted-foreground">Not yet earned</p>}
              </TooltipContent>
            </Tooltip>
          )
        })}
      </div>
    </TooltipProvider>
  )
}
