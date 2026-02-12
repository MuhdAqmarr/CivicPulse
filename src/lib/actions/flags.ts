"use server"

import { createClient } from "@/lib/supabase/server"
import { revalidatePath } from "next/cache"

export async function flagItem(
  targetType: "report" | "update" | "profile",
  targetId: string,
  reason?: string
): Promise<{ error?: string }> {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: "You must be signed in to flag content." }
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

    // Check for existing flag (unique constraint: reporter_id + target_type + target_id)
    const { data: existingFlag } = await supabase
      .from("flags")
      .select("id")
      .eq("reporter_id", user.id)
      .eq("target_type", targetType)
      .eq("target_id", targetId)
      .single()

    if (existingFlag) {
      return { error: "You have already flagged this item." }
    }

    // Insert the flag
    const { error: insertError } = await supabase.from("flags").insert({
      target_type: targetType,
      target_id: targetId,
      reporter_id: user.id,
      reason: reason?.trim() || null,
    })

    if (insertError) {
      return { error: insertError.message }
    }

    // Revalidate relevant paths
    if (targetType === "report") {
      revalidatePath(`/r/${targetId}`)
    }
    revalidatePath("/admin")
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
