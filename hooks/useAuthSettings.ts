"use client"

import { useQuery } from "@tanstack/react-query"

export interface AuthSettingsResponse {
  enablePasswordAuth: boolean
  googleAuthEnabled: boolean
}

export function useAuthSettings() {
  return useQuery<AuthSettingsResponse>({
    queryKey: ["auth-settings"],
    queryFn: async () => {
      const res = await fetch("/api/auth/settings")
      if (!res.ok) {
        return { enablePasswordAuth: false, googleAuthEnabled: true }
      }
      return res.json()
    },
    staleTime: 30000, // 30 seconds
    retry: 1,
  })
}
