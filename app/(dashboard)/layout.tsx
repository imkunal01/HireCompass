import React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/session"
import DashboardShell from "@/components/layout/dashboard-shell"

interface DashboardLayoutProps {
  children: React.ReactNode
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const session = await getServerSession()

  if (!session) {
    redirect("/login")
  }

  return <DashboardShell>{children}</DashboardShell>
}
