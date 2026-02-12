import { Skeleton } from "@/components/ui/skeleton"

export default function ReportDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-6 max-w-3xl">
      {/* Back link */}
      <Skeleton className="h-4 w-24 mb-4" />

      {/* Title + status */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-6 w-24 shrink-0" />
      </div>

      {/* Meta row */}
      <div className="flex flex-wrap gap-3 mb-6">
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-5 w-32" />
      </div>

      {/* Photo placeholder */}
      <Skeleton className="w-full h-64 rounded-xl mb-6" />

      {/* Description */}
      <div className="space-y-2 mb-8">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-5/6" />
        <Skeleton className="h-4 w-2/3" />
      </div>

      {/* Action buttons */}
      <div className="flex gap-3 mb-8">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-24" />
        <Skeleton className="h-9 w-20" />
      </div>

      {/* Timeline */}
      <Skeleton className="h-6 w-32 mb-4" />
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="flex gap-3">
            <Skeleton className="h-8 w-8 rounded-full shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
