import React from "react"
import { redirect } from "next/navigation"
import { getServerSession } from "@/lib/session"
import DashboardShellV2 from "@/components/v2/layout/DashboardShellV2"

interface Props {
  children: React.ReactNode
}

export default async function V2DashboardLayout({ children }: Props) {
  const session = await getServerSession()

  if (!session) {
    redirect("/v2/login")
  }

  return <DashboardShellV2>{children}</DashboardShellV2>
}
