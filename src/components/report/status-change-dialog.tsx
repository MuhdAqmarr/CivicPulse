"use client"

import { useState, useRef, useTransition } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ArrowRightCircle, Loader2, Camera } from "lucide-react"
import { changeStatus, closeReport } from "@/lib/actions/reports"
import { uploadPhoto } from "@/lib/actions/upload"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import type { ReportStatus } from "@/lib/types"

interface StatusChangeDialogProps {
  reportId: string
  currentStatus: ReportStatus
}

const STATUS_TRANSITIONS: Record<ReportStatus, ReportStatus[]> = {
  OPEN: ["ACKNOWLEDGED", "IN_PROGRESS", "CLOSED"],
  ACKNOWLEDGED: ["IN_PROGRESS", "CLOSED"],
  IN_PROGRESS: ["CLOSED"],
  CLOSED: [],
}

const STATUS_LABELS: Record<ReportStatus, string> = {
  OPEN: "Open",
  ACKNOWLEDGED: "Acknowledged",
  IN_PROGRESS: "In Progress",
  CLOSED: "Closed",
}

export function StatusChangeDialog({ reportId, currentStatus }: StatusChangeDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [newStatus, setNewStatus] = useState<ReportStatus | "">("")
  const [closureNote, setClosureNote] = useState("")
  const [closurePhoto, setClosurePhoto] = useState<File | null>(null)
  const [isPending, startTransition] = useTransition()
  const fileRef = useRef<HTMLInputElement>(null)

  const nextStatuses = STATUS_TRANSITIONS[currentStatus]
  const isClosing = newStatus === "CLOSED"

  const handleSubmit = () => {
    if (!newStatus) return

    startTransition(async () => {
      if (isClosing) {
        let photoPath: string | undefined
        if (closurePhoto) {
          const fd = new FormData()
          fd.append("file", closurePhoto)
          const result = await uploadPhoto(fd, "report-photos")
          if ("error" in result) {
            toast.error(result.error)
            return
          }
          photoPath = result.path
        }
        const result = await closeReport(reportId, closureNote, photoPath)
        if (result?.error) {
          toast.error(result.error)
          return
        }
      } else {
        const result = await changeStatus(reportId, newStatus)
        if (result?.error) {
          toast.error(result.error)
          return
        }
      }
      toast.success(`Status changed to ${STATUS_LABELS[newStatus]}`)
      setOpen(false)
      router.refresh()
    })
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <ArrowRightCircle className="h-4 w-4 mr-1" />
          Change Status
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Change Report Status</DialogTitle>
          <DialogDescription>
            Update the status of this report. Current: {STATUS_LABELS[currentStatus]}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label>New Status</Label>
            <Select value={newStatus} onValueChange={(v) => setNewStatus(v as ReportStatus)}>
              <SelectTrigger>
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {nextStatuses.map((s) => (
                  <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {isClosing && (
            <>
              <div className="space-y-2">
                <Label htmlFor="closure-note">Closure Note</Label>
                <Textarea
                  id="closure-note"
                  placeholder="Describe how the issue was resolved..."
                  value={closureNote}
                  onChange={(e) => setClosureNote(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>After Photo (optional, recommended)</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => fileRef.current?.click()}
                  className="gap-2"
                >
                  <Camera className="h-4 w-4" />
                  {closurePhoto ? closurePhoto.name : "Upload Photo"}
                </Button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0]
                    if (f) setClosurePhoto(f)
                  }}
                />
                <p className="text-xs text-muted-foreground">
                  Adding a photo helps the community verify the fix.
                </p>
              </div>
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={handleSubmit} disabled={!newStatus || isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
