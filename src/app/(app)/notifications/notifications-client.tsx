"use client"

import { useTransition } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Bell, Check, CheckCheck } from "lucide-react"
import { markNotificationRead, markAllNotificationsRead } from "@/lib/actions/notifications"
import { formatRelativeTime } from "@/lib/utils"
import { cn } from "@/lib/utils"
import type { Notification } from "@/lib/types"

interface NotificationsClientProps {
  notifications: (Notification & { report?: { id: string; title: string } | null })[]
}

export function NotificationsClient({ notifications }: NotificationsClientProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const unreadCount = notifications.filter((n) => !n.read_at).length

  const handleMarkAllRead = () => {
    startTransition(async () => {
      await markAllNotificationsRead()
      router.refresh()
    })
  }

  const handleMarkRead = (id: string) => {
    startTransition(async () => {
      await markNotificationRead(id)
      router.refresh()
    })
  }

  return (
    <div>
      {unreadCount > 0 && (
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">{unreadCount} unread</p>
          <Button variant="ghost" size="sm" onClick={handleMarkAllRead} disabled={isPending}>
            <CheckCheck className="h-4 w-4 mr-1" />
            Mark all read
          </Button>
        </div>
      )}

      {notifications.length === 0 ? (
        <div className="text-center py-16">
          <Bell className="h-10 w-10 mx-auto text-muted-foreground mb-3" />
          <p className="text-muted-foreground">No notifications yet.</p>
          <p className="text-sm text-muted-foreground mt-1">Follow reports to receive updates.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <Card
              key={n.id}
              className={cn(
                "transition-colors",
                !n.read_at && "border-primary/30 bg-primary/5"
              )}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      {!n.read_at && (
                        <span className="h-2 w-2 rounded-full bg-primary shrink-0" aria-label="Unread" />
                      )}
                      <p className="text-sm font-medium">{n.title}</p>
                    </div>
                    {n.body && (
                      <p className="text-xs text-muted-foreground line-clamp-2">{n.body}</p>
                    )}
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-xs text-muted-foreground">
                        {formatRelativeTime(n.created_at)}
                      </span>
                      {n.report && (
                        <Link
                          href={`/r/${n.report.id}`}
                          className="text-xs text-primary hover:underline truncate"
                        >
                          {n.report.title}
                        </Link>
                      )}
                    </div>
                  </div>
                  {!n.read_at && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0 h-8 w-8"
                      onClick={() => handleMarkRead(n.id)}
                      aria-label="Mark as read"
                    >
                      <Check className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
