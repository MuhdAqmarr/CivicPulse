"use client"

import { useState, useRef, useCallback, useEffect } from "react"
import Image from "next/image"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface BeforeAfterRevealProps {
  beforeUrl: string
  afterUrl: string
  title: string
}

export function BeforeAfterReveal({ beforeUrl, afterUrl, title }: BeforeAfterRevealProps) {
  const [sliderPos, setSliderPos] = useState(50)
  const containerRef = useRef<HTMLDivElement>(null)
  const clipRef = useRef<HTMLDivElement>(null)
  const lineRef = useRef<HTMLDivElement>(null)
  const beforeLabelRef = useRef<HTMLDivElement>(null)
  const afterLabelRef = useRef<HTMLDivElement>(null)
  const isDragging = useRef(false)
  const rafId = useRef(0)
  const posRef = useRef(50)

  // Direct DOM update — no React re-render, runs at display refresh rate
  const applyPosition = useCallback((percent: number) => {
    posRef.current = percent
    if (clipRef.current) clipRef.current.style.clipPath = `inset(0 ${100 - percent}% 0 0)`
    if (lineRef.current) lineRef.current.style.left = `${percent}%`
    if (beforeLabelRef.current) beforeLabelRef.current.style.opacity = percent < 15 ? "0" : "1"
    if (afterLabelRef.current) afterLabelRef.current.style.opacity = percent > 85 ? "0" : "1"
  }, [])

  const updatePosition = useCallback((clientX: number) => {
    if (!containerRef.current) return
    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100))
    cancelAnimationFrame(rafId.current)
    rafId.current = requestAnimationFrame(() => applyPosition(percent))
  }, [applyPosition])

  const handlePointerDown = (e: React.PointerEvent) => {
    isDragging.current = true
    ;(e.target as HTMLElement).setPointerCapture(e.pointerId)
    updatePosition(e.clientX)
  }

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return
    updatePosition(e.clientX)
  }

  const handlePointerUp = () => {
    isDragging.current = false
    // Sync React state for accessibility aria-valuenow
    setSliderPos(Math.round(posRef.current))
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    let next = posRef.current
    if (e.key === "ArrowLeft") next = Math.max(0, next - 2)
    else if (e.key === "ArrowRight") next = Math.min(100, next + 2)
    else return
    applyPosition(next)
    setSliderPos(Math.round(next))
  }

  // Cleanup RAF on unmount
  useEffect(() => () => cancelAnimationFrame(rafId.current), [])

  return (
    <Card className="mb-6 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Fix Proof: Before &amp; After</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <div
          ref={containerRef}
          className="relative aspect-video cursor-col-resize select-none overflow-hidden"
          style={{ touchAction: "none" }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          role="slider"
          aria-label="Before and after image comparison slider"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(sliderPos)}
          tabIndex={0}
          onKeyDown={handleKeyDown}
        >
          {/* After image (full) */}
          <Image
            src={afterUrl}
            alt={`After fix: ${title}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 700px"
          />

          {/* Before image (clipped) */}
          <div
            ref={clipRef}
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}
          >
            <Image
              src={beforeUrl}
              alt={`Before fix: ${title}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 700px"
            />
          </div>

          {/* Slider handle */}
          <div
            ref={lineRef}
            className="absolute top-0 bottom-0 w-0.5 bg-white shadow-lg"
            style={{ left: `${sliderPos}%` }}
            aria-hidden="true"
          >
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white shadow-lg flex items-center justify-center">
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M7 4L3 10L7 16" stroke="#666" strokeWidth="2" strokeLinecap="round" />
                <path d="M13 4L17 10L13 16" stroke="#666" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
          </div>

          {/* Labels */}
          <div ref={beforeLabelRef} className={cn("absolute top-3 left-3 rounded-md bg-black/70 px-2 py-1 text-xs text-white transition-opacity", sliderPos < 15 && "opacity-0")}>
            Before
          </div>
          <div ref={afterLabelRef} className={cn("absolute top-3 right-3 rounded-md bg-black/70 px-2 py-1 text-xs text-white transition-opacity", sliderPos > 85 && "opacity-0")}>
            After
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
