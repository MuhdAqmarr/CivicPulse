"use client"

import "mapbox-gl/dist/mapbox-gl.css"
import { useState, useMemo, useCallback } from "react"
import Map, {
  Marker,
  Popup,
  NavigationControl,
  type ViewStateChangeEvent,
  type MarkerEvent,
} from "react-map-gl/mapbox"
import Link from "next/link"
import { useTheme } from "next-themes"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { STATUS_LABELS, STATUS_COLORS, type ReportStatus } from "@/lib/types"
import type { Report, Profile } from "@/lib/types"

const MAPBOX_TOKEN = process.env.NEXT_PUBLIC_MAPBOX_TOKEN

const MARKER_COLORS: Record<ReportStatus, string> = {
  OPEN: "#ef4444",
  ACKNOWLEDGED: "#eab308",
  IN_PROGRESS: "#3b82f6",
  CLOSED: "#22c55e",
}

type MapReport = Report & { creator?: Profile }

interface ReportMapProps {
  reports: MapReport[]
  interactive?: boolean
  height?: string
  className?: string
  center?: { lat: number; lng: number }
  zoom?: number
  showPopups?: boolean
}

export function ReportMap({
  reports,
  interactive = true,
  height = "500px",
  className,
  center,
  zoom = 12,
  showPopups = true,
}: ReportMapProps) {
  const { resolvedTheme } = useTheme()
  const [selectedReport, setSelectedReport] = useState<MapReport | null>(null)

  const mappableReports = useMemo(
    () => reports.filter((r) => r.location_lat != null && r.location_lng != null),
    [reports]
  )

  const initialView = useMemo(() => {
    if (center) {
      return { longitude: center.lng, latitude: center.lat, zoom }
    }
    if (mappableReports.length === 0) {
      return { longitude: -98.58, latitude: 39.83, zoom: 4 }
    }
    if (mappableReports.length === 1) {
      return {
        longitude: mappableReports[0].location_lng!,
        latitude: mappableReports[0].location_lat!,
        zoom: 14,
      }
    }
    const lats = mappableReports.map((r) => r.location_lat!)
    const lngs = mappableReports.map((r) => r.location_lng!)
    return {
      longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
      latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
      zoom: 11,
    }
  }, [center, zoom, mappableReports])

  const [viewState, setViewState] = useState(initialView)

  const handleMove = useCallback(
    (evt: ViewStateChangeEvent) => setViewState(evt.viewState),
    []
  )

  const mapStyle =
    resolvedTheme === "dark"
      ? "mapbox://styles/mapbox/dark-v11"
      : "mapbox://styles/mapbox/streets-v12"

  if (!MAPBOX_TOKEN) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border bg-muted/30 text-muted-foreground text-sm",
          className
        )}
        style={{ height }}
      >
        Map unavailable — NEXT_PUBLIC_MAPBOX_TOKEN not configured.
      </div>
    )
  }

  if (mappableReports.length === 0) {
    return (
      <div
        className={cn(
          "flex items-center justify-center rounded-lg border bg-muted/30 text-muted-foreground text-sm",
          className
        )}
        style={{ height }}
      >
        No reports with location data to display on map.
      </div>
    )
  }

  return (
    <div className={cn("rounded-lg overflow-hidden border", className)} style={{ height }}>
      <Map
        {...viewState}
        onMove={handleMove}
        mapboxAccessToken={MAPBOX_TOKEN}
        mapStyle={mapStyle}
        style={{ width: "100%", height: "100%" }}
        attributionControl={true}
        reuseMaps
      >
        {interactive && <NavigationControl position="top-right" />}

        {mappableReports.map((report) => (
          <Marker
            key={report.id}
            longitude={report.location_lng!}
            latitude={report.location_lat!}
            anchor="bottom"
            onClick={(e: MarkerEvent<MouseEvent>) => {
              e.originalEvent.stopPropagation()
              if (showPopups) setSelectedReport(report)
            }}
          >
            <div
              className="w-4 h-4 rounded-full border-2 border-white shadow-md cursor-pointer hover:scale-125 transition-transform"
              style={{ backgroundColor: MARKER_COLORS[report.status] }}
              title={report.title}
            />
          </Marker>
        ))}

        {selectedReport && showPopups && (
          <Popup
            longitude={selectedReport.location_lng!}
            latitude={selectedReport.location_lat!}
            anchor="bottom"
            onClose={() => setSelectedReport(null)}
            closeOnClick={false}
            offset={20}
          >
            <div className="max-w-[220px]">
              <Link
                href={`/r/${selectedReport.id}`}
                className="font-semibold text-sm hover:text-primary line-clamp-2 mb-1.5 block"
              >
                {selectedReport.title}
              </Link>
              <div className="flex flex-wrap gap-1">
                <Badge variant="secondary" className="text-[10px]">
                  {selectedReport.category}
                </Badge>
                <Badge
                  className={cn(
                    "text-[10px]",
                    STATUS_COLORS[selectedReport.status]
                  )}
                >
                  {STATUS_LABELS[selectedReport.status]}
                </Badge>
              </div>
              {selectedReport.location_label && (
                <p className="text-xs text-muted-foreground mt-1.5 truncate">
                  {selectedReport.location_label}
                </p>
              )}
              {!selectedReport.location_is_exact && (
                <p className="text-[10px] text-muted-foreground mt-0.5 italic">
                  Approximate area
                </p>
              )}
            </div>
          </Popup>
        )}
      </Map>
    </div>
  )
}
