"use client"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "./status-badge"
import { formatRelativeTime } from "@/lib/utils"
import type { ReportUpdate, Profile } from "@/lib/types"
import Link from "next/link"

interface UpdateTimelineProps {
  updates: (ReportUpdate & { author?: Profile })[]
}

export function UpdateTimeline({ updates }: UpdateTimelineProps) {
  if (updates.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-8">
        No updates yet. Be the first to comment!
      </p>
    )
  }

  return (
    <div className="space-y-0">
      {updates.map((update, i) => (
        <div key={update.id} className="relative flex gap-3 pb-6">
          {/* Timeline line */}
          {i < updates.length - 1 && (
            <div className="absolute left-5 top-10 bottom-0 w-px bg-border" aria-hidden="true" />
          )}

          {/* Avatar */}
          <Link href={`/u/${update.author?.id}`} className="shrink-0">
            <Avatar className="h-10 w-10">
              <AvatarImage src={update.author?.avatar_url || undefined} />
              <AvatarFallback>
                {(update.author?.display_name || "U")[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </Link>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <Link
                href={`/u/${update.author?.id}`}
                className="text-sm font-medium hover:underline"
              >
                {update.author?.display_name || "Community Member"}
              </Link>
              <span className="text-xs text-muted-foreground">
                {formatRelativeTime(update.created_at)}
              </span>
              {update.type === "STATUS_CHANGE" && (
                <Badge variant="info" className="text-xs">Status Change</Badge>
              )}
              {update.type === "CLOSURE_REQUEST" && (
                <Badge variant="warning" className="text-xs">Closure</Badge>
              )}
            </div>

            {update.type === "STATUS_CHANGE" && update.new_status && (
              <div className="mt-1.5">
                <span className="text-sm text-muted-foreground">Status changed to </span>
                <StatusBadge status={update.new_status} />
              </div>
            )}

            {update.content && (
              <p className="text-sm mt-1.5 whitespace-pre-wrap text-muted-foreground">
                {update.content}
              </p>
            )}
          </div>
        </div>
      ))}
    </div>
  )
}
