import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { BadgeDisplay } from "@/components/profile/badge-display"
import { StatusBadge } from "@/components/report/status-badge"
import { Star, Calendar } from "lucide-react"
import Link from "next/link"
import type { ReportStatus } from "@/lib/types"

interface UserProfilePageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: UserProfilePageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data } = await supabase.from("profiles").select("display_name").eq("id", id).single()
  return { title: data?.display_name || "User Profile" }
}

export default async function UserProfilePage({ params }: UserProfilePageProps) {
  const { id } = await params
  const supabase = await createClient()

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", id).single()
  if (!profile) notFound()

  const { data: reports } = await supabase
    .from("reports")
    .select("id, title, status, category, created_at, closure_confirmed")
    .eq("creator_id", id)
    .eq("is_hidden", false)
    .order("created_at", { ascending: false })
    .limit(20)

  const joinDate = new Date(profile.created_at).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  })

  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      <Card className="mb-6">
        <CardContent className="p-6 text-center">
          <Avatar className="h-20 w-20 mx-auto mb-4">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-2xl">
              {(profile.display_name || "U")[0].toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <h1 className="text-xl font-bold">{profile.display_name || "Community Member"}</h1>
          <div className="flex items-center justify-center gap-4 mt-2 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Star className="h-4 w-4 text-yellow-500" />
              {profile.points} points
            </span>
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Joined {joinDate}
            </span>
          </div>
          <div className="mt-3 flex justify-center">
            <BadgeDisplay
              firstReport={profile.badge_first_report}
              helper={profile.badge_helper}
              resolver={profile.badge_resolver}
            />
          </div>
        </CardContent>
      </Card>

      <h2 className="text-lg font-semibold mb-4">Reports ({reports?.length || 0})</h2>
      {(!reports || reports.length === 0) ? (
        <p className="text-center text-muted-foreground py-8 text-sm">No reports yet.</p>
      ) : (
        <div className="space-y-2">
          {reports.map((r) => (
            <Link
              key={r.id}
              href={`/r/${r.id}`}
              className="flex items-center justify-between rounded-lg border p-3 hover:bg-accent transition-colors"
            >
              <div className="flex-1 min-w-0 mr-3">
                <p className="text-sm font-medium truncate">{r.title}</p>
                <Badge variant="secondary" className="text-xs mt-1">{r.category}</Badge>
              </div>
              <StatusBadge status={r.status as ReportStatus} closureConfirmed={r.closure_confirmed} className="shrink-0" />
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}
