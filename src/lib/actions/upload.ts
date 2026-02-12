"use server"

import { createClient } from "@/lib/supabase/server"

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"]
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB

export async function uploadPhoto(
  formData: FormData,
  bucket: string = "report-photos"
): Promise<{ path: string } | { error: string }> {
  try {
    const supabase = await createClient()

    // Auth check
    const {
      data: { user },
    } = await supabase.auth.getUser()
    if (!user) {
      return { error: "You must be signed in to upload photos." }
    }

    // Extract file from formData
    const file = formData.get("file") as File | null
    if (!file) {
      return { error: "No file provided." }
    }

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return {
        error:
          "Invalid file type. Only JPEG, PNG, and WebP images are allowed.",
      }
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return { error: "File size exceeds the 5MB limit." }
    }

    // Generate unique path: userId/timestamp-randomstring.ext
    const extension = file.name.split(".").pop()?.toLowerCase() || "jpg"
    const timestamp = Date.now()
    const randomSuffix = Math.random().toString(36).substring(2, 10)
    const filePath = `${user.id}/${timestamp}-${randomSuffix}.${extension}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      return { error: uploadError.message }
    }

    return { path: filePath }
  } catch (error: unknown) {
    return {
      error:
        error instanceof Error
          ? error.message
          : "An unexpected error occurred during upload.",
    }
  }
}
