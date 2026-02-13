"use client"

import Link from "next/link"
import Image from "next/image"
import { MapPin, MessageSquare, Users, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "./status-badge"
import { formatRelativeTime, getStorageUrl } from "@/lib/utils"
import type { Report, Profile } from "@/lib/types"
import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"

interface ReportCardProps {
  report: Report & {
    creator?: Profile
    updates_count?: number
    follows_count?: number
  }
}

// Stable variant objects — defined once at module level
const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
}

const VIEWPORT = { once: true, margin: "-50px" }

// Tiny 4x3 transparent-ish placeholder to avoid CLS while images load
const BLUR_PLACEHOLDER =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAADCAIAAAA7ljmRAAAADklEQVQIW2P4z8BQDwAEgAF/QualzQAAAABJRU5ErkJggg==" as const

export function ReportCard({ report }: ReportCardProps) {
  const prefersReducedMotion = useReducedMotion()
  const photoUrl = getStorageUrl(report.photo_path)

  const inner = (
    <Link href={`/r/${report.id}`} className="block group">
      <Card className="overflow-hidden transition-shadow hover:shadow-md">
        <div className="flex flex-col sm:flex-row min-h-[120px]">
          {photoUrl && (
            <div className="relative w-full sm:w-40 aspect-square sm:aspect-auto sm:h-auto shrink-0 bg-muted">
              <Image
                src={photoUrl}
                alt={`Photo of issue: ${report.title}`}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 160px"
                loading="lazy"
                placeholder="blur"
                blurDataURL={BLUR_PLACEHOLDER}
              />
            </div>
          )}
          <CardContent className="flex-1 p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <h3 className="font-semibold text-base line-clamp-2 group-hover:text-primary transition-colors">
                {report.title}
              </h3>
              <StatusBadge
                status={report.status}
                closureConfirmed={report.closure_confirmed}
                className="shrink-0"
              />
            </div>

            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
              {report.description}
            </p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
              <Badge variant="secondary" className="text-xs">
                {report.category}
              </Badge>

              {report.location_label && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {report.location_label}
                  {!report.location_is_exact && (
                    <Badge variant="outline" className="text-[10px] px-1 py-0 ml-1">
                      Approx
                    </Badge>
                  )}
                </span>
              )}

              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                {formatRelativeTime(report.created_at)}
              </span>

              {typeof report.updates_count === "number" && (
                <span className="flex items-center gap-1">
                  <MessageSquare className="h-3 w-3" />
                  {report.updates_count}
                </span>
              )}

              {typeof report.follows_count === "number" && (
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {report.follows_count}
                </span>
              )}
            </div>

            {report.duplicate_of && (
              <Badge variant="warning" className="mt-2 text-xs">
                Duplicate
              </Badge>
            )}
          </CardContent>
        </div>
      </Card>
    </Link>
  )

  if (prefersReducedMotion) return <div>{inner}</div>

  return (
    <motion.div
      variants={CARD_VARIANTS}
      initial="hidden"
      whileInView="visible"
      viewport={VIEWPORT}
    >
      {inner}
    </motion.div>
  )
}
