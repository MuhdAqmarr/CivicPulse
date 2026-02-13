import type { Metadata } from "next"
import dynamic from "next/dynamic"
import { LandingHero } from "@/components/landing/hero"

// Below-fold components — lazy-loaded to keep initial JS bundle small
const LandingFeatures = dynamic(() => import("@/components/landing/features").then(m => ({ default: m.LandingFeatures })))
const LandingCTA = dynamic(() => import("@/components/landing/cta").then(m => ({ default: m.LandingCTA })))

export const metadata: Metadata = {
  title: "CivicPulse - Local Community Problem Reporter",
  description: "Report local issues, track progress, and help verify fixes in your community. Join the civic movement.",
}

export default function LandingPage() {
  return (
    <article>
      <LandingHero />
      <LandingFeatures />
      <LandingCTA />
    </article>
  )
}
