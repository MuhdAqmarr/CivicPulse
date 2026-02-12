"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { AlertTriangle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { StatusBadge } from "./status-badge"
import { searchDuplicates } from "@/lib/actions/reports"
import type { ReportStatus } from "@/lib/types"

type DuplicateResult = {
  id: string
  title: string
  status: string
  category: string
  location_label: string | null
  closure_confirmed: boolean
}

interface DuplicateGuardProps {
  title: string
  lat?: number | null
  lng?: number | null
}

export function DuplicateGuard({ title, lat, lng }: DuplicateGuardProps) {
  const [duplicates, setDuplicates] = useState<DuplicateResult[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (title.length < 5) {
      setDuplicates([])
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const results = await searchDuplicates(title, lat ?? undefined, lng ?? undefined)
        setDuplicates(results || [])
      } catch {
        setDuplicates([])
      }
      setLoading(false)
    }, 500)

    return () => clearTimeout(timer)
  }, [title, lat, lng])

  if (loading || duplicates.length === 0) return null

  return (
    <Card className="border-warning/50 bg-warning/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2 text-warning">
          <AlertTriangle className="h-4 w-4" />
          Possible duplicates near you
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-xs text-muted-foreground mb-3">
          These existing reports may be about the same issue. Check before submitting.
        </p>
        <div className="space-y-2">
          {duplicates.map((d) => (
            <Link
              key={d.id}
              href={`/r/${d.id}`}
              target="_blank"
              className="flex items-center justify-between rounded-lg border bg-background p-3 hover:bg-accent transition-colors"
            >
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{d.title}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant="secondary" className="text-xs">{d.category}</Badge>
                  {d.location_label && (
                    <span className="text-xs text-muted-foreground truncate">{d.location_label}</span>
                  )}
                </div>
              </div>
              <StatusBadge status={d.status as ReportStatus} closureConfirmed={d.closure_confirmed} className="ml-2 shrink-0" />
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}
