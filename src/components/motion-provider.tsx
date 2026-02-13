"use client"

import { LazyMotion } from "framer-motion"

// Dynamic import defers feature loading to client-side, avoiding the SSR
// module evaluation issue that causes "Cannot read properties of undefined"
// when `domAnimation` is statically imported in Next.js.
const loadFeatures = () =>
  import("framer-motion").then((mod) => mod.domAnimation)

export function MotionProvider({ children }: { children: React.ReactNode }) {
  return <LazyMotion features={loadFeatures}>{children}</LazyMotion>
}
