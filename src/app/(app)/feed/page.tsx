import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { FeedClient } from "./feed-client"

export const metadata: Metadata = {
  title: "Feed",
  description: "Browse community reports of local issues. Filter by category, status, or search by keyword.",
}

interface FeedPageProps {
  searchParams: Promise<{
    q?: string
    category?: string
    status?: string
    sort?: string
  }>
}

export default async function FeedPage({ searchParams }: FeedPageProps) {
  const params = await searchParams
  const supabase = await createClient()

  let query = supabase
    .from("reports")
    .select(`
      *,
      creator:profiles!reports_creator_id_fkey(id, display_name, avatar_url),
      updates_count:report_updates(count),
      follows_count:report_follows(count)
    `)
    .eq("is_hidden", false)
    .is("duplicate_of", null)

  if (params.q) {
    query = query.ilike("title", `%${params.q}%`)
  }

  if (params.category && params.category !== "all") {
    query = query.eq("category", params.category)
  }

  if (params.status && params.status !== "all") {
    query = query.eq("status", params.status)
  }

  const sortField = params.sort === "updated" ? "updated_at" : "created_at"
  query = query.order(sortField, { ascending: false }).limit(50)

  const { data: reports } = await query

  const formattedReports = (reports || []).map((r) => ({
    ...r,
    updates_count: Array.isArray(r.updates_count) ? (r.updates_count[0] as { count: number })?.count ?? 0 : 0,
    follows_count: Array.isArray(r.follows_count) ? (r.follows_count[0] as { count: number })?.count ?? 0 : 0,
  }))

  return (
    <div className="container mx-auto px-4 py-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold tracking-tight">Community Feed</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Browse and track local issues reported by your community.
        </p>
      </div>
      <FeedClient
        initialReports={formattedReports}
        currentFilters={params}
      />
    </div>
  )
}
