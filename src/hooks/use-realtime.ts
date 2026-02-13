"use client"

import { useEffect, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface UseRealtimeOptions {
  table: string
  filter?: string
  event?: "INSERT" | "UPDATE" | "DELETE" | "*"
  onEvent: (payload: Record<string, unknown>) => void
  enabled?: boolean
}

export function useRealtime({ table, filter, event = "*", onEvent, enabled = true }: UseRealtimeOptions) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    if (!enabled) return

    const supabase = createClient()
    const channelName = `realtime-${table}-${filter || "all"}-${event}`

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes" as never,
        {
          event,
          schema: "public",
          table,
          ...(filter ? { filter } : {}),
        },
        (payload: Record<string, unknown>) => {
          onEvent(payload)
        }
      )
      .subscribe()

    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
    }
  }, [table, filter, event, enabled]) // eslint-disable-line react-hooks/exhaustive-deps

  return channelRef
}

export function useRealtimeNotifications(userId: string | undefined, onNewNotification: () => void) {
  return useRealtime({
    table: "notifications",
    filter: userId ? `user_id=eq.${userId}` : undefined,
    event: "INSERT",
    onEvent: onNewNotification,
    enabled: !!userId,
  })
}
