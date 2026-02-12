"use client"

import { useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { CheckCircle2, XCircle, Loader2 } from "lucide-react"
import { voteClosure } from "@/lib/actions/votes"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

interface ClosureWidgetProps {
  reportId: string
  closedBy: string | null
  trueVotes: number
  falseVotes: number
  userVote: boolean | null
  currentUserId: string | undefined
}

export function ClosureWidget({
  reportId,
  closedBy,
  trueVotes,
  falseVotes,
  userVote,
  currentUserId,
}: ClosureWidgetProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  const totalVotes = trueVotes + falseVotes
  const truePercent = totalVotes > 0 ? (trueVotes / totalVotes) * 100 : 50

  const canVote = currentUserId && currentUserId !== closedBy && userVote === null

  const handleVote = (vote: boolean) => {
    if (!currentUserId) return
    startTransition(async () => {
      const result = await voteClosure(reportId, vote)
      if (result?.error) {
        toast.error(result.error)
      } else {
        toast.success(vote ? "Voted: Fixed!" : "Voted: Not Fixed")
        router.refresh()
      }
    })
  }

  return (
    <Card className="border-warning/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-base flex items-center gap-2">
          <span className="text-lg" aria-hidden="true">&#x1F50D;</span>
          Community Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          This report has been closed. Help verify whether the issue is actually fixed.
        </p>

        {/* Vote progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-success flex items-center gap-1">
              <CheckCircle2 className="h-3.5 w-3.5" />
              Fixed ({trueVotes})
            </span>
            <span className="text-destructive flex items-center gap-1">
              Not Fixed ({falseVotes})
              <XCircle className="h-3.5 w-3.5" />
            </span>
          </div>
          <Progress value={truePercent} className="h-2" />
          <p className="text-xs text-muted-foreground text-center">
            {totalVotes} vote{totalVotes !== 1 ? "s" : ""} so far
            {totalVotes < 2 && " — needs at least 2 votes"}
          </p>
        </div>

        {/* Vote buttons */}
        {canVote ? (
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 border-success/50 hover:bg-success/10"
              onClick={() => handleVote(true)}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4 mr-1 text-success" />}
              Yes, Fixed
            </Button>
            <Button
              variant="outline"
              className="flex-1 border-destructive/50 hover:bg-destructive/10"
              onClick={() => handleVote(false)}
              disabled={isPending}
            >
              {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4 mr-1 text-destructive" />}
              Not Fixed
            </Button>
          </div>
        ) : userVote !== null ? (
          <p className="text-sm text-muted-foreground text-center">
            You voted: <strong>{userVote ? "Fixed" : "Not Fixed"}</strong>
          </p>
        ) : currentUserId === closedBy ? (
          <p className="text-xs text-muted-foreground text-center">
            As the closer, you cannot vote on verification.
          </p>
        ) : !currentUserId ? (
          <p className="text-sm text-muted-foreground text-center">
            Sign in to vote on verification.
          </p>
        ) : null}
      </CardContent>
    </Card>
  )
}
