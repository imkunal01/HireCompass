"use client"

import React, { useState, useEffect } from "react"
import { X, Share, Plus, Smartphone, Download } from "lucide-react"
import { cn } from "@/lib/utils"
import Image from "next/image"

type Platform = "ios" | "android" | "none"

function detectPlatform(): Platform {
  if (typeof window === "undefined") return "none"
  const ua = navigator.userAgent
  const isIOS = /iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream
  const isAndroid = /Android/.test(ua)
  if (isIOS) return "ios"
  if (isAndroid) return "android"
  return "none"
}

function isStandalone(): boolean {
  if (typeof window === "undefined") return false
  return (
    (window.navigator as any).standalone === true ||
    window.matchMedia("(display-mode: standalone)").matches
  )
}

export default function InstallPrompt() {
  const [platform, setPlatform] = useState<Platform>("none")
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [showIOSSteps, setShowIOSSteps] = useState(false)

  useEffect(() => {
    // Don't show if already installed or already dismissed
    if (isStandalone()) return
    const alreadyDismissed = sessionStorage.getItem("hc-install-dismissed")
    if (alreadyDismissed) return

    const p = detectPlatform()
    setPlatform(p)

    // Android: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
    }
    window.addEventListener("beforeinstallprompt", handler as any)

    // Show prompt after 3 seconds
    const timer = setTimeout(() => {
      if (p !== "none") {
        setVisible(true)
      }
    }, 3000)

    // For Android without the event (already installed or not supported), check after load
    const afterLoad = setTimeout(() => {
      if (p === "android" && !deferredPrompt) {
        // still show manual instructions
        setVisible(true)
      }
    }, 4000)

    return () => {
      window.removeEventListener("beforeinstallprompt", handler as any)
      clearTimeout(timer)
      clearTimeout(afterLoad)
    }
  }, [])

  const handleDismiss = () => {
    setVisible(false)
    setDismissed(true)
    sessionStorage.setItem("hc-install-dismissed", "1")
  }

  const handleAndroidInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      setDeferredPrompt(null)
      if (outcome === "accepted") {
        handleDismiss()
      }
    } else {
      // Show manual browser menu instructions
      setShowIOSSteps(true)
    }
  }

  if (!visible || dismissed || platform === "none") return null

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={handleDismiss}
      />

      {/* Bottom Sheet */}
      <div className={cn(
        "fixed bottom-0 left-0 right-0 z-[201] animate-in slide-in-from-bottom duration-400",
        "bg-white rounded-t-3xl shadow-2xl border-t border-slate-200/80 px-6 pt-6 pb-8",
        "max-w-lg mx-auto"
      )}>
        {/* Handle bar */}
        <div className="w-10 h-1 bg-slate-200 rounded-full mx-auto mb-5" />

        {/* Dismiss */}
        <button
          onClick={handleDismiss}
          className="absolute top-5 right-5 p-2 rounded-full bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-600 transition-all"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Logo + Title */}
        <div className="flex items-center gap-4 mb-5">
          <div className="h-14 w-14 rounded-2xl bg-slate-900 flex items-center justify-center shadow-lg overflow-hidden flex-shrink-0">
            <Image src="/logo.png" alt="HireCompass" width={56} height={56} className="object-cover" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900 leading-tight">Add to Home Screen</h2>
            <p className="text-sm text-slate-500 mt-0.5">Access HireCompass like a native app</p>
          </div>
        </div>

        {/* Feature pills */}
        <div className="flex flex-wrap gap-2 mb-6">
          {["One-tap access", "No browser bar", "Feels native", "Works offline"].map((f) => (
            <span key={f} className="bg-indigo-50 text-indigo-600 text-xs font-semibold rounded-full px-3 py-1 border border-indigo-100">
              ✓ {f}
            </span>
          ))}
        </div>

        {platform === "ios" && !showIOSSteps && (
          <>
            <div className="bg-slate-50 rounded-2xl border border-slate-200 p-4 mb-5 space-y-3">
              <p className="text-sm font-semibold text-slate-700 mb-3">How to add:</p>
              {[
                { icon: <Share className="h-4 w-4 text-blue-500 flex-shrink-0" />, text: "Tap the Share icon at the bottom of Safari" },
                { icon: <Plus className="h-4 w-4 text-blue-500 flex-shrink-0" />, text: 'Scroll and tap "Add to Home Screen"' },
                { icon: <Smartphone className="h-4 w-4 text-indigo-500 flex-shrink-0" />, text: 'Tap "Add" — it will appear on your home screen!' },
              ].map((step, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-50 text-xs font-bold text-blue-600 flex-shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  {step.icon}
                  <p className="text-sm text-slate-600">{step.text}</p>
                </div>
              ))}
            </div>
            <button
              onClick={handleDismiss}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:opacity-90 transition-all"
            >
              Got it!
            </button>
          </>
        )}

        {platform === "android" && !showIOSSteps && (
          <button
            onClick={handleAndroidInstall}
            className="w-full flex items-center justify-center gap-2.5 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-indigo-500/25 hover:opacity-90 transition-all"
          >
            <Download className="h-4 w-4" />
            Add to Home Screen
          </button>
        )}

        {showIOSSteps && (
          <>
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-5">
              <p className="text-sm text-amber-800 font-medium">
                In your browser menu, look for <strong>"Add to Home Screen"</strong> or <strong>"Install App"</strong> option.
              </p>
            </div>
            <button
              onClick={handleDismiss}
              className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-semibold text-sm"
            >
              OK, Got it
            </button>
          </>
        )}

        <p className="text-center text-xs text-slate-400 mt-4">
          Tap outside to dismiss
        </p>
      </div>
    </>
  )
}
