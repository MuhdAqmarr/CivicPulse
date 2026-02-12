"use client"

import { useState, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Send } from "lucide-react"
import { addUpdate } from "@/lib/actions/updates"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface AddCommentFormProps {
  reportId: string
}

export function AddCommentForm({ reportId }: AddCommentFormProps) {
  const router = useRouter()
  const [content, setContent] = useState("")
  const [isPending, startTransition] = useTransition()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!content.trim()) return

    startTransition(async () => {
      const result = await addUpdate(reportId, content.trim())
      if (result?.error) {
        toast.error(result.error)
      } else {
        setContent("")
        router.refresh()
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <Textarea
        placeholder="Add a comment or update..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={2}
        className="flex-1 resize-none"
        aria-label="Add a comment"
      />
      <Button
        type="submit"
        size="icon"
        disabled={!content.trim() || isPending}
        className="shrink-0 self-end"
        aria-label="Submit comment"
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Send className="h-4 w-4" />
        )}
      </Button>
    </form>
  )
}
