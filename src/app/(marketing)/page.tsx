import type { Metadata } from "next"
import { LandingHero } from "@/components/landing/hero"
import { LandingFeatures } from "@/components/landing/features"
import { LandingCTA } from "@/components/landing/cta"

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
