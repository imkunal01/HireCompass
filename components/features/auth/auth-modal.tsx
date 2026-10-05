"use client"

import React, { createContext, useContext, useState, useEffect } from "react"
import { createPortal } from "react-dom"
import { useRouter } from "next/navigation"
import {
  X,
  Mail,
  Lock,
  User,
  ArrowRight,
  Loader2,
  Eye,
  EyeOff,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  AlertCircle,
} from "lucide-react"
import { useQueryClient } from "@tanstack/react-query"
import { cn } from "@/lib/utils"

export type AuthMode = "login" | "signup"

export interface AuthModalOptions {
  mode?: AuthMode
  reason?: string
  onSuccess?: () => void
}

interface AuthModalContextType {
  isOpen: boolean
  mode: AuthMode
  reason?: string
  openAuthModal: (options?: AuthModalOptions) => void
  closeAuthModal: () => void
}

const AuthModalContext = createContext<AuthModalContextType | undefined>(undefined)

export function useAuthModal() {
  const context = useContext(AuthModalContext)
  if (!context) {
    throw new Error("useAuthModal must be used within an AuthModalProvider")
  }
  return context
}

export function AuthModalProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [mode, setMode] = useState<AuthMode>("signup")
  const [reason, setReason] = useState<string | undefined>(undefined)
  const [successCallback, setSuccessCallback] = useState<(() => void) | undefined>(undefined)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  // Listen to custom window event so non-React or deep components can open it easily
  useEffect(() => {
    const handleOpenEvent = (e: Event) => {
      const customEvent = e as CustomEvent<AuthModalOptions>
      const detail = customEvent.detail || {}
      setMode(detail.mode || "signup")
      setReason(detail.reason)
      setSuccessCallback(() => detail.onSuccess)
      setIsOpen(true)
    }

    window.addEventListener("open-auth-modal", handleOpenEvent)
    return () => window.removeEventListener("open-auth-modal", handleOpenEvent)
  }, [])

  const openAuthModal = (options?: AuthModalOptions) => {
    setMode(options?.mode || "signup")
    setReason(options?.reason)
    setSuccessCallback(() => options?.onSuccess)
    setIsOpen(true)
  }

  const closeAuthModal = () => {
    setIsOpen(false)
  }

  const handleSuccess = () => {
    if (successCallback) {
      try {
        successCallback()
      } catch (err) {
        console.error("Auth success callback error:", err)
      }
    }
    closeAuthModal()
  }

  return (
    <AuthModalContext.Provider
      value={{
        isOpen,
        mode,
        reason,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
      {mounted && isOpen && (
        <AuthModalCard
          initialMode={mode}
          reason={reason}
          onClose={closeAuthModal}
          onSuccess={handleSuccess}
        />
      )}
    </AuthModalContext.Provider>
  )
}

interface AuthModalCardProps {
  initialMode: AuthMode
  reason?: string
  onClose: () => void
  onSuccess: () => void
}

function AuthModalCard({
  initialMode,
  reason,
  onClose,
  onSuccess,
}: AuthModalCardProps) {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [tab, setTab] = useState<AuthMode>(initialMode)

  // Form states
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [onClose])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (tab === "signup") {
      if (name.trim().length < 2) {
        setError("Name must be at least 2 characters.")
        setLoading(false)
        return
      }
      if (password.length < 8) {
        setError("Password must be at least 8 characters.")
        setLoading(false)
        return
      }

      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: name.trim(), email: email.trim(), password }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "Signup failed. Please try again.")
          return
        }

        // Invalidate queries so the app detects the newly authenticated user
        await queryClient.invalidateQueries({ queryKey: ["auth-me"] })
        await queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
        await queryClient.invalidateQueries({ queryKey: ["opportunities"] })
        router.refresh()
        onSuccess()
      } catch {
        setError("Network error. Please try again.")
      } finally {
        setLoading(false)
      }
    } else {
      // Login
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email: email.trim(), password }),
        })
        const data = await res.json()
        if (!res.ok) {
          setError(data.error || "Invalid email or password.")
          return
        }

        await queryClient.invalidateQueries({ queryKey: ["auth-me"] })
        await queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] })
        await queryClient.invalidateQueries({ queryKey: ["opportunities"] })
        router.refresh()
        onSuccess()
      } catch {
        setError("Network error. Please try again.")
      } finally {
        setLoading(false)
      }
    }
  }

  const modalContent = (
    <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-200">
      {/* Backdrop click listener */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Modal Popup Card */}
      <div className="relative z-10 w-full max-w-md rounded-3xl border border-slate-200/90 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl p-6 sm:p-8 space-y-5 overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* Subtle Ambient Radial Glow */}
        <div className="absolute -top-24 -right-24 w-60 h-60 rounded-full bg-gradient-to-br from-indigo-500/20 via-violet-500/15 to-transparent blur-3xl pointer-events-none" />

        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white shadow-md shadow-indigo-500/25 shrink-0">
              <svg
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="12" r="10" />
                <polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76" fill="currentColor" fillOpacity="0.3" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight leading-tight">
                {tab === "signup" ? "Create Free Account" : "Welcome Back"}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {tab === "signup" ? "Save your progress permanently" : "Sign in to access your workspace"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            aria-label="Close authentication modal"
          >
            <X size={18} />
          </button>
        </div>

        {/* Context-Aware Reason Badge (If triggered by a specific feature) */}
        {reason && (
          <div className="p-3 rounded-2xl bg-indigo-50/80 dark:bg-indigo-950/50 border border-indigo-100 dark:border-indigo-900/60 flex items-start gap-2.5 text-xs text-indigo-800 dark:text-indigo-200 font-medium">
            <Sparkles size={15} className="text-indigo-600 dark:text-indigo-400 shrink-0 mt-0.5" />
            <span className="leading-snug">{reason}</span>
          </div>
        )}

        {/* Tab Switcher */}
        <div className="flex rounded-2xl bg-slate-100/80 dark:bg-slate-800/80 p-1 border border-slate-200/50 dark:border-slate-700/50">
          <button
            type="button"
            onClick={() => {
              setTab("signup")
              setError(null)
            }}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200",
              tab === "signup"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("login")
              setError(null)
            }}
            className={cn(
              "flex-1 py-2 rounded-xl text-xs font-bold transition-all duration-200",
              tab === "login"
                ? "bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 shadow-sm"
                : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
            )}
          >
            Sign In
          </button>
        </div>

        {/* Error Alert */}
        {error && (
          <div className="p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-900/60 flex items-center gap-2 text-xs text-rose-700 dark:text-rose-300 font-semibold animate-in fade-in">
            <AlertCircle size={15} className="shrink-0 text-rose-500" />
            <span>{error}</span>
          </div>
        )}

        {/* Authentication Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {tab === "signup" && (
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
                Full Name
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Kunal Sharma"
                  required
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all placeholder:text-slate-400"
                />
              </div>
            </div>
          )}

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Email Address
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-600 dark:text-slate-300 uppercase tracking-wider">
              Password
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={tab === "signup" ? "At least 8 characters" : "••••••••"}
                required
                className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50/50 dark:bg-slate-800 text-xs font-medium text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 transition-all placeholder:text-slate-400"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors p-1"
                aria-label="Toggle password visibility"
              >
                {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
              </button>
            </div>
          </div>

          {/* Submit Action Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/25 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                <span>Processing...</span>
              </>
            ) : (
              <>
                <span>{tab === "signup" ? "Create Free Account" : "Sign In to Continue"}</span>
                <ArrowRight size={15} />
              </>
            )}
          </button>
        </form>

        {/* Footer Note */}
        <div className="pt-2 text-center border-t border-slate-100 dark:border-slate-800/80">
          <p className="text-[11px] text-slate-400 dark:text-slate-500">
            No credit card required. Closing this window keeps you on the page in guest mode.
          </p>
        </div>

      </div>
    </div>
  )

  if (typeof document === "undefined") return null
  return createPortal(modalContent, document.body)
}

export default AuthModalCard
