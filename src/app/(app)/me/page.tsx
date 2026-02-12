import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { createClient, getProfile } from "@/lib/supabase/server"
import { MeClient } from "./me-client"

export const metadata: Metadata = {
  title: "My Profile",
}

export default async function MePage() {
  const profile = await getProfile()
  if (!profile) redirect("/signin?redirect=/me")

  const supabase = await createClient()

  // Get user's reports
  const { data: reports } = await supabase
    .from("reports")
    .select("id, title, status, category, created_at, closure_confirmed")
    .eq("creator_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(20)

  // Get followed report IDs
  const { data: follows } = await supabase
    .from("report_follows")
    .select("report_id")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false })
    .limit(20)

  const followedIds = (follows || []).map((f) => f.report_id)

  let followedReports: Array<{ id: string; title: string; status: string; category: string; updated_at: string; closure_confirmed: boolean }> = []
  if (followedIds.length > 0) {
    const { data } = await supabase
      .from("reports")
      .select("id, title, status, category, updated_at, closure_confirmed")
      .in("id", followedIds)
      .eq("is_hidden", false)
    followedReports = (data || []) as typeof followedReports
  }

  return (
    <MeClient
      profile={profile}
      reports={reports || []}
      followedReports={followedReports}
    />
  )
}
