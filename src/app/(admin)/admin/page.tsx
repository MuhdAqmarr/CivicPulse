import type { Metadata } from "next"
import { createClient } from "@/lib/supabase/server"
import { AdminDashboard } from "./admin-dashboard"

export const metadata: Metadata = {
  title: "Admin Dashboard",
}

export default async function AdminPage() {
  const supabase = await createClient()

  // Flagged reports
  const { data: rawFlaggedReports } = await supabase
    .from("flags")
    .select(`id, target_type, target_id, reason, created_at, reporter_id`)
    .eq("target_type", "report")
    .order("created_at", { ascending: false })
    .limit(50)

  const flaggedReports = (rawFlaggedReports || []).map((f) => ({
    ...f,
    reporter: { display_name: null as string | null },
  }))

  // Flagged updates
  const { data: rawFlaggedUpdates } = await supabase
    .from("flags")
    .select(`id, target_type, target_id, reason, created_at, reporter_id`)
    .eq("target_type", "update")
    .order("created_at", { ascending: false })
    .limit(50)

  const flaggedUpdates = (rawFlaggedUpdates || []).map((f) => ({
    ...f,
    reporter: { display_name: null as string | null },
  }))

  // Hidden reports
  const { data: hiddenReports } = await supabase
    .from("reports")
    .select("id, title, status, category, creator_id, is_hidden, comments_locked")
    .eq("is_hidden", true)
    .order("updated_at", { ascending: false })
    .limit(20)

  // Recent reports for moderation
  const { data: recentReports } = await supabase
    .from("reports")
    .select("id, title, status, category, creator_id, is_hidden, comments_locked, duplicate_of, created_at")
    .order("created_at", { ascending: false })
    .limit(30)

  // Banned users
  const { data: bannedUsers } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, is_banned, role")
    .eq("is_banned", true)
    .limit(20)

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold tracking-tight mb-6">Admin Dashboard</h1>
      <AdminDashboard
        flaggedReports={flaggedReports || []}
        flaggedUpdates={flaggedUpdates || []}
        hiddenReports={hiddenReports || []}
        recentReports={recentReports || []}
        bannedUsers={bannedUsers || []}
      />
    </div>
  )
}
