"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function voteClosure(
  reportId: string,
  vote: boolean
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: "You must be signed in to vote." }
    }

    // Check if user is banned
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_banned")
      .eq("id", user.id)
      .single()

    if (profile?.is_banned) {
      return { error: "Your account has been suspended." }
    }

    // Check that the report is CLOSED and not yet confirmed
    const { data: report } = await supabase
      .from("reports")
      .select("status, closure_confirmed, closed_by")
      .eq("id", reportId)
      .single()

    if (!report) {
      return { error: "Report not found." }
    }

    if (report.status !== "CLOSED") {
      return { error: "You can only vote on closed reports." }
    }

    if (report.closure_confirmed) {
      return { error: "This closure has already been confirmed." }
    }

    // Check that user is not the one who closed the report
    if (report.closed_by === user.id) {
      return { error: "You cannot vote on your own closure." }
    }

    // Check if user has already voted
    const { data: existingVote } = await supabase
      .from("closure_votes")
      .select("voter_id")
      .eq("report_id", reportId)
      .eq("voter_id", user.id)
      .single()

    if (existingVote) {
      return { error: "You have already voted on this closure." }
    }

    // Insert the vote
    const { error: insertError } = await supabase
      .from("closure_votes")
      .insert({
        report_id: reportId,
        voter_id: user.id,
        vote,
      })

    if (insertError) {
      return { error: insertError.message }
    }

    revalidatePath(`/r/${reportId}`)
    return {}
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred.",
    }
  }
}
