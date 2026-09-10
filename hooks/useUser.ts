"use client"

import { useQuery } from "@tanstack/react-query"

export interface User {
  id: string
  name: string
  email: string
  role?: "admin" | "user" | string
}

interface UseUserResult {
  user: User | null
  isLoading: boolean
  isAuthenticated: boolean
}

export function useUser(): UseUserResult {
  const { data, isLoading } = useQuery<User | null>({
    queryKey: ["auth-me"],
    queryFn: async () => {
      const res = await fetch("/api/auth/me")
      if (!res.ok) return null
      const { user } = await res.json()
      return user
    },
    staleTime: 5 * 60 * 1000, // cache for 5 min
    retry: false,
  })

  return {
    user: data ?? null,
    isLoading,
    isAuthenticated: !!data,
  }
}
