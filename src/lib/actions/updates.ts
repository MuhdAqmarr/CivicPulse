"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function addUpdate(
  reportId: string,
  content: string,
  type: "COMMENT" | "UPDATE" = "COMMENT"
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: "You must be signed in to add a comment." }
    }

    // Check if user is banned
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, is_banned")
      .eq("id", user.id)
      .single()

    if (profile?.is_banned) {
      return { error: "Your account has been suspended." }
    }

    // Rate limit: 1 comment per 20 seconds
    const twentySecondsAgo = new Date(
      Date.now() - 20 * 1000
    ).toISOString()
    const { data: recentUpdates } = await supabase
      .from("report_updates")
      .select("id")
      .eq("author_id", user.id)
      .gte("created_at", twentySecondsAgo)
      .limit(1)

    if (recentUpdates && recentUpdates.length > 0) {
      return {
        error:
          "You are posting too quickly. Please wait 20 seconds between comments.",
      }
    }

    // Check if comments are locked (unless user is admin)
    const { data: report } = await supabase
      .from("reports")
      .select("comments_locked")
      .eq("id", reportId)
      .single()

    if (!report) {
      return { error: "Report not found." }
    }

    if (report.comments_locked && profile?.role !== "admin") {
      return { error: "Comments are locked on this report." }
    }

    // Validate content
    const trimmedContent = content.trim()
    if (!trimmedContent) {
      return { error: "Comment content cannot be empty." }
    }

    // Insert the update
    const { error: insertError } = await supabase
      .from("report_updates")
      .insert({
        report_id: reportId,
        author_id: user.id,
        type,
        content: trimmedContent,
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
