import React from "react"

// Public layout — no auth check. Used by /v2/(auth)/login and /v2/(auth)/signup.
export default function V2AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
