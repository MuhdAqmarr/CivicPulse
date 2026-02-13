import dynamic from "next/dynamic"

export const ReportMap = dynamic(
  () => import("./report-map").then((mod) => mod.ReportMap),
  {
    ssr: false,
    loading: () => (
      <div
        className="flex items-center justify-center rounded-lg border bg-muted/30 animate-pulse"
        style={{ height: "500px" }}
      >
        <span className="text-sm text-muted-foreground">Loading map...</span>
      </div>
    ),
  }
)
