"use client"

import { motion } from "framer-motion"
import { useReducedMotion } from "@/hooks/use-reduced-motion"
import {
  Camera,
  Bell,
  Shield,
  CheckCircle2,
  Users,
  Trophy,
} from "lucide-react"

const features = [
  {
    icon: Camera,
    title: "Photo Evidence",
    description: "Capture and upload photos of issues. Compare before and after with our Fix Proof closure system.",
  },
  {
    icon: Bell,
    title: "Live Pulse Tracking",
    description: "Follow reports that matter to you. Get real-time updates when status changes or new comments appear.",
  },
  {
    icon: Shield,
    title: "Community Verification",
    description: "Closures are verified by the community. Vote on whether fixes are confirmed, ensuring accountability.",
  },
  {
    icon: CheckCircle2,
    title: "Transparent Status Flow",
    description: "Track every report through Open, Acknowledged, In Progress, and Closed stages with full timeline.",
  },
  {
    icon: Users,
    title: "Duplicate Guard",
    description: "Smart duplicate detection prevents repeated reports. See similar issues nearby before creating new ones.",
  },
  {
    icon: Trophy,
    title: "Gamification & Badges",
    description: "Earn points and badges for contributing. Unlock First Report, Helper, and Resolver achievements.",
  },
]

export function LandingFeatures() {
  const prefersReducedMotion = useReducedMotion()

  return (
    <section className="py-20 md:py-28 bg-muted/30" aria-labelledby="features-heading">
      <div className="container mx-auto px-4">
        <div className="text-center mb-14">
          <h2 id="features-heading" className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Built for communities
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to report, track, and resolve local issues collaboratively.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              className="rounded-xl border bg-card p-6 hover:shadow-md transition-shadow"
              {...(prefersReducedMotion
                ? {}
                : {
                    initial: { opacity: 0, y: 20 },
                    whileInView: { opacity: 1, y: 0 },
                    viewport: { once: true, margin: "-50px" },
                    transition: { duration: 0.4, delay: i * 0.08 },
                  })}
            >
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
