import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { createClient, getProfile } from "@/lib/supabase/server"
import { ReportDetail } from "@/components/report/report-detail"

interface ReportPageProps {
  params: Promise<{ id: string }>
}

export async function generateMetadata({ params }: ReportPageProps): Promise<Metadata> {
  const { id } = await params
  const supabase = await createClient()
  const { data: report } = await supabase
    .from("reports")
    .select("title, description, category")
    .eq("id", id)
    .single()

  if (!report) return { title: "Report Not Found" }

  return {
    title: report.title,
    description: report.description?.slice(0, 160),
    openGraph: {
      title: report.title,
      description: report.description?.slice(0, 160),
    },
  }
}

export default async function ReportPage({ params }: ReportPageProps) {
  const { id } = await params
  const supabase = await createClient()
  const currentProfile = await getProfile()

  const { data: report } = await supabase
    .from("reports")
    .select(`
      *,
      creator:profiles!reports_creator_id_fkey(*)
    `)
    .eq("id", id)
    .single()

  if (!report || (report.is_hidden && currentProfile?.role !== "admin")) {
    notFound()
  }

  const { data: updates } = await supabase
    .from("report_updates")
    .select(`*, author:profiles!report_updates_author_id_fkey(*)`)
    .eq("report_id", id)
    .order("created_at", { ascending: true })

  const { count: followsCount } = await supabase
    .from("report_follows")
    .select("*", { count: "exact", head: true })
    .eq("report_id", id)

  let isFollowing = false
  if (currentProfile) {
    const { data: follow } = await supabase
      .from("report_follows")
      .select("report_id")
      .eq("report_id", id)
      .eq("user_id", currentProfile.id)
      .maybeSingle()
    isFollowing = !!follow
  }

  const { data: closureVotes } = await supabase
    .from("closure_votes")
    .select("vote")
    .eq("report_id", id)

  const trueVotes = closureVotes?.filter((v) => v.vote).length || 0
  const falseVotes = closureVotes?.filter((v) => !v.vote).length || 0

  let userVote: boolean | null = null
  if (currentProfile) {
    const { data: vote } = await supabase
      .from("closure_votes")
      .select("vote")
      .eq("report_id", id)
      .eq("voter_id", currentProfile.id)
      .maybeSingle()
    userVote = vote?.vote ?? null
  }

  const { count: flagsCount } = await supabase
    .from("flags")
    .select("*", { count: "exact", head: true })
    .eq("target_type", "report")
    .eq("target_id", id)

  const reportData = {
    ...report,
    updates: updates || [],
    follows_count: followsCount || 0,
    is_following: isFollowing,
    closure_votes_true: trueVotes,
    closure_votes_false: falseVotes,
    user_vote: userVote,
    flags_count: flagsCount || 0,
  }

  // JSON-LD structured data
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Report",
    name: report.title,
    description: report.description,
    dateCreated: report.created_at,
    dateModified: report.updated_at,
    author: {
      "@type": "Person",
      name: report.creator?.display_name || "Community Member",
    },
  }

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ReportDetail report={reportData} currentProfile={currentProfile} />
    </>
  )
}
