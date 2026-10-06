"use client"

import React, { useState } from "react"
import { Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"

interface GoogleSignInButtonProps {
  label?: string
  returnUrl?: string
  className?: string
  size?: "default" | "large" | "sm"
  disabled?: boolean
}

export function GoogleIcon({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  )
}

export function GoogleSignInButton({
  label = "Continue with Google",
  returnUrl = "/dashboard",
  className,
  size = "default",
  disabled = false,
}: GoogleSignInButtonProps) {
  const [loading, setLoading] = useState(false)

  const handleClick = (e: React.MouseEvent) => {
    if (disabled || loading) {
      e.preventDefault()
      return
    }
    setLoading(true)
    const targetUrl = `/api/auth/google?returnUrl=${encodeURIComponent(returnUrl)}`
    window.location.href = targetUrl
  }

  const sizeClasses = {
    sm: "h-9 px-3 text-xs gap-2",
    default: "h-11 px-4 text-sm gap-3",
    large: "h-12 px-6 text-sm sm:text-base gap-3.5",
  }[size]

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={disabled || loading}
      className={cn(
        "w-full flex items-center justify-center font-bold rounded-xl transition-all duration-200 select-none",
        "bg-white hover:bg-slate-50/90 text-slate-700 hover:text-slate-900",
        "border border-slate-200/90 hover:border-slate-300",
        "shadow-xs hover:shadow-md hover:-translate-y-0.5 active:translate-y-0",
        "disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-xs",
        sizeClasses,
        className
      )}
    >
      {loading ? (
        <>
          <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
          <span className="font-semibold text-slate-600">Connecting to Google...</span>
        </>
      ) : (
        <>
          <GoogleIcon className={size === "large" ? "h-5 w-5 shrink-0" : "h-4 w-4 shrink-0"} />
          <span>{label}</span>
        </>
      )}
    </button>
  )
}

export default GoogleSignInButton
