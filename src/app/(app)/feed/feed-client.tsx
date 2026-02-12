"use client"

import { useState, useCallback } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Search, SlidersHorizontal, X } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ReportCard } from "@/components/report/report-card"
import { CATEGORIES } from "@/lib/types"
import type { Report, Profile } from "@/lib/types"

interface FeedClientProps {
  initialReports: (Report & { creator?: Profile; updates_count?: number; follows_count?: number })[]
  currentFilters: {
    q?: string
    category?: string
    status?: string
    sort?: string
  }
}

export function FeedClient({ initialReports, currentFilters }: FeedClientProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(currentFilters.q || "")
  const [showFilters, setShowFilters] = useState(false)

  const updateFilters = useCallback(
    (key: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString())
      if (value && value !== "all") {
        params.set(key, value)
      } else {
        params.delete(key)
      }
      router.push(`/feed?${params.toString()}`)
    },
    [router, searchParams]
  )

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    updateFilters("q", search)
  }

  const clearFilters = () => {
    setSearch("")
    router.push("/feed")
  }

  const hasActiveFilters = currentFilters.q || currentFilters.category || currentFilters.status

  return (
    <div>
      {/* Search and filters */}
      <div className="space-y-3 mb-6">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search reports..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
              aria-label="Search reports"
            />
          </div>
          <Button type="submit" variant="secondary">Search</Button>
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={() => setShowFilters(!showFilters)}
            aria-label="Toggle filters"
            aria-expanded={showFilters}
          >
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </form>

        {showFilters && (
          <div className="flex flex-wrap gap-3 rounded-lg border p-3 bg-muted/30">
            <Select
              value={currentFilters.category || "all"}
              onValueChange={(v) => updateFilters("category", v)}
            >
              <SelectTrigger className="w-[180px]" aria-label="Filter by category">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              value={currentFilters.status || "all"}
              onValueChange={(v) => updateFilters("status", v)}
            >
              <SelectTrigger className="w-[180px]" aria-label="Filter by status">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="OPEN">Open</SelectItem>
                <SelectItem value="ACKNOWLEDGED">Acknowledged</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="CLOSED">Closed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={currentFilters.sort || "created"}
              onValueChange={(v) => updateFilters("sort", v)}
            >
              <SelectTrigger className="w-[180px]" aria-label="Sort by">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created">Newest First</SelectItem>
                <SelectItem value="updated">Recently Updated</SelectItem>
              </SelectContent>
            </Select>

            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1">
                <X className="h-3 w-3" />
                Clear
              </Button>
            )}
          </div>
        )}
      </div>

      {/* Results */}
      {initialReports.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground text-lg">No reports found.</p>
          <p className="text-muted-foreground text-sm mt-1">
            {hasActiveFilters
              ? "Try adjusting your filters."
              : "Be the first to report an issue!"}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {initialReports.map((report, i) => (
            <ReportCard key={report.id} report={report} index={i} />
          ))}
        </div>
      )}
    </div>
  )
}
