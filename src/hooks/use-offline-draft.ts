"use client"

import { useState, useEffect, useCallback } from "react"

interface DraftData {
  title: string
  description: string
  category: string
  location_lat?: number | null
  location_lng?: number | null
  location_is_exact?: boolean
  location_label?: string
  savedAt: number
}

const DRAFT_KEY = "report-draft"

export function useOfflineDraft() {
  const [draft, setDraft] = useState<DraftData | null>(null)
  const [isOffline, setIsOffline] = useState(false)
  const [hasDraft, setHasDraft] = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(DRAFT_KEY)
    if (saved) {
      try {
        const parsed = JSON.parse(saved) as DraftData
        // Only restore drafts less than 24 hours old
        if (Date.now() - parsed.savedAt < 24 * 60 * 60 * 1000) {
          setDraft(parsed)
          setHasDraft(true)
        } else {
          localStorage.removeItem(DRAFT_KEY)
        }
      } catch {
        localStorage.removeItem(DRAFT_KEY)
      }
    }

    const handleOnline = () => setIsOffline(false)
    const handleOffline = () => setIsOffline(true)

    setIsOffline(!navigator.onLine)
    window.addEventListener("online", handleOnline)
    window.addEventListener("offline", handleOffline)

    return () => {
      window.removeEventListener("online", handleOnline)
      window.removeEventListener("offline", handleOffline)
    }
  }, [])

  const saveDraft = useCallback((data: Omit<DraftData, "savedAt">) => {
    const draftData = { ...data, savedAt: Date.now() }
    localStorage.setItem(DRAFT_KEY, JSON.stringify(draftData))
    setDraft(draftData)
    setHasDraft(true)
  }, [])

  const clearDraft = useCallback(() => {
    localStorage.removeItem(DRAFT_KEY)
    setDraft(null)
    setHasDraft(false)
  }, [])

  return { draft, hasDraft, isOffline, saveDraft, clearDraft }
}
