"use client"

import * as React from "react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { ReactQueryDevtools } from "@tanstack/react-query-devtools"
import { ThemeProvider } from "next-themes"
import { ToastProvider } from "@/components/ui/toast"
import { AuthModalProvider } from "@/components/features/auth/auth-modal"

import BroadcastBannerModal from "@/components/layout/broadcast-banner-modal"
import FeedbackAutoPrompt from "@/components/features/feedback/feedback-auto-prompt"
import PersonalBroadcastReminder from "@/components/layout/personal-broadcast-reminder"

export default function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = React.useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60 * 1000, // 1 minute
            refetchOnWindowFocus: false,
          },
        },
      })
  )

  return (
    <ThemeProvider attribute="class" defaultTheme="light" forcedTheme="light" enableSystem={false}>
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <AuthModalProvider>
            {children}
            <BroadcastBannerModal />
            <FeedbackAutoPrompt />
            <PersonalBroadcastReminder />
          </AuthModalProvider>
        </ToastProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ThemeProvider>
  )
}
