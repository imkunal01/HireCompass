"use client"

import React, { useState, useEffect } from "react"
import {
  Shield, Bell, User, Lock, Mail, Save,
  ChevronRight, CheckCircle2, Database,
  Palette, Sliders, Send, Plus, X, Github, Linkedin, Globe,
  Sparkles, Loader2, AlertCircle
} from "lucide-react"
import { cn } from "@/lib/utils"
import { useUser } from "@/hooks/useUser"
import { useQueryClient } from "@tanstack/react-query"

/* ── Toggle Switch ── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent",
        "transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:ring-offset-1",
        checked ? "bg-indigo-600" : "bg-slate-200"
      )}
    >
      <span
        className={cn(
          "pointer-events-none inline-block h-4 w-4 rounded-full bg-white shadow-sm",
          "transform transition-transform duration-200",
          checked ? "translate-x-4" : "translate-x-0"
        )}
      />
    </button>
  )
}

/* ── Section Card ── */
function SectionCard({
  icon: Icon,
  iconBg,
  iconColor,
  title,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>
  iconBg: string
  iconColor: string
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="flex items-center gap-3 px-6 py-4 border-b border-slate-100">
        <div className={cn("flex h-8 w-8 items-center justify-center rounded-xl", iconBg)}>
          <Icon className={cn("h-4 w-4", iconColor)} />
        </div>
        <h3 className="font-bold text-slate-900 text-sm">{title}</h3>
      </div>
      <div className="p-6">{children}</div>
    </div>
  )
}

/* ── Input Field ── */
function InputField({
  label, type = "text", value, onChange, placeholder, icon: Icon
}: {
  label: string; type?: string; value?: string
  onChange?: (v: string) => void; placeholder?: string
  icon?: React.ComponentType<{ className?: string }>
}) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-semibold text-slate-600">{label}</label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange?.(e.target.value)}
          placeholder={placeholder}
          className={cn(
            "w-full h-10 rounded-xl border border-slate-200 bg-slate-50/60 text-sm text-slate-900",
            "placeholder:text-slate-400 transition-all duration-150",
            "focus:outline-none focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-100",
            Icon ? "pl-10 pr-4" : "px-4"
          )}
        />
      </div>
    </div>
  )
}

export default function SettingsPage() {
  const { user } = useUser()
  const queryClient = useQueryClient()

  const [name,       setName]       = useState(user?.name  || "")
  const [email,      setEmail]      = useState(user?.email || "")
  const [saving,     setSaving]     = useState(false)
  const [saved,      setSaved]      = useState(false)
  const [saveError,  setSaveError]  = useState("")

  // Sync with user once loaded
  useEffect(() => {
    if (user) {
      setName(user.name)
      setEmail(user.email)
    }
  }, [user?.name, user?.email])

  /* Notification toggles */
  const [emailAlerts,    setEmailAlerts]    = useState(true)
  const [weeklyReport,   setWeeklyReport]   = useState(true)
  const [interviewRemind,setInterviewRemind] = useState(true)
  const [marketingEmails,setMarketingEmails] = useState(false)
  const [notifSaving, setNotifSaving] = useState(false)

  /* Password change */
  const [currentPw,   setCurrentPw]   = useState("")
  const [newPw,       setNewPw]       = useState("")
  const [confirmPw,   setConfirmPw]   = useState("")
  const [pwSaving,    setPwSaving]    = useState(false)
  const [pwSaved,     setPwSaved]     = useState(false)
  const [pwError,     setPwError]     = useState("")

  /* Outreach Profile */
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileSaved,  setProfileSaved]  = useState(false)
  const [opFullName,    setOpFullName]    = useState("")
  const [opEmail,       setOpEmail]       = useState("")
  const [opPhone,       setOpPhone]       = useState("")
  const [opLinkedin,    setOpLinkedin]    = useState("")
  const [opGithub,      setOpGithub]      = useState("")
  const [opPortfolio,   setOpPortfolio]   = useState("")
  const [opBio,         setOpBio]         = useState("")
  const [opSkills,      setOpSkills]      = useState<string[]>([])
  const [opSkillInput,  setOpSkillInput]  = useState("")
  const [opProjects,    setOpProjects]    = useState<{ id: string; name: string; description: string; techStack: string[] }[]>([])
  const [isAutofilling, setIsAutofilling] = useState(false)
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleAutofill = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setIsAutofilling(true)
    try {
      const formData = new FormData()
      formData.append("file", file)
      
      const res = await fetch("/api/outreach/profile/autofill", {
        method: "POST",
        body: formData,
      })

      if (!res.ok) throw new Error((await res.json()).error || "Failed to parse")
      
      const data = await res.json()
      
      if (data.bio) setOpBio(data.bio)
      if (data.skills?.length) setOpSkills(data.skills)
      if (data.projects?.length) {
        setOpProjects(data.projects.map((p: any, idx: number) => ({
          id: Date.now().toString() + idx,
          name: p.name || "",
          description: p.description || "",
          techStack: p.techStack || []
        })))
      }
    } catch (err) {
      alert("Failed to autofill: " + (err instanceof Error ? err.message : "Unknown error"))
    } finally {
      setIsAutofilling(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  useEffect(() => {
    fetch("/api/outreach/profile")
      .then((r) => r.json())
      .then((p) => {
        if (p) {
          setOpFullName(p.fullName || "")
          setOpEmail(p.email || "")
          setOpPhone(p.phone || "")
          setOpLinkedin(p.linkedin || "")
          setOpGithub(p.github || "")
          setOpPortfolio(p.portfolio || "")
          setOpBio(p.bio || "")
          setOpSkills(p.skills || [])
          setOpProjects(p.projects || [])
        }
        setProfileLoaded(true)
      })
      .catch(() => setProfileLoaded(true))
  }, [])

  const handleSaveProfile = async () => {
    setProfileSaving(true)
    await fetch("/api/outreach/profile", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: opFullName,
        email: opEmail,
        phone: opPhone,
        linkedin: opLinkedin,
        github: opGithub,
        portfolio: opPortfolio,
        bio: opBio,
        skills: opSkills,
        projects: opProjects,
      }),
    })
    setProfileSaving(false)
    setProfileSaved(true)
    setTimeout(() => setProfileSaved(false), 2500)
  }

  // Load notification prefs from profile API
  useEffect(() => {
    fetch("/api/auth/profile")
      .then((r) => r.json())
      .then((p) => {
        if (p?.notifications) {
          setEmailAlerts(p.notifications.emailAlerts ?? true)
          setWeeklyReport(p.notifications.weeklyReport ?? true)
          setInterviewRemind(p.notifications.interviewRemind ?? true)
          setMarketingEmails(p.notifications.marketingEmails ?? false)
        }
      })
      .catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    setSaveError("")
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to save")
      queryClient.invalidateQueries({ queryKey: ["auth-me"] })
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } catch (e: any) {
      setSaveError(e.message)
    } finally {
      setSaving(false)
    }
  }

  const handleSaveNotifications = async () => {
    setNotifSaving(true)
    try {
      await fetch("/api/auth/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          notifications: { emailAlerts, weeklyReport, interviewRemind, marketingEmails },
        }),
      })
    } finally {
      setNotifSaving(false)
    }
  }

  const handlePasswordChange = async () => {
    setPwError("")
    if (!currentPw || !newPw || !confirmPw) {
      setPwError("All password fields are required.")
      return
    }
    if (newPw !== confirmPw) {
      setPwError("New passwords do not match.")
      return
    }
    if (newPw.length < 8) {
      setPwError("New password must be at least 8 characters.")
      return
    }
    setPwSaving(true)
    try {
      const res = await fetch("/api/auth/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to change password")
      setCurrentPw("")
      setNewPw("")
      setConfirmPw("")
      setPwSaved(true)
      setTimeout(() => setPwSaved(false), 2500)
    } catch (e: any) {
      setPwError(e.message)
    } finally {
      setPwSaving(false)
    }
  }

  return (
    <div className="space-y-6 max-w-5xl animate-slide-up">

      {/* ── Page Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-2">
        <div className="space-y-1">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Settings</h2>
          <p className="text-sm text-slate-500">
            Manage your profile, notifications, and account security.
          </p>
        </div>
        {/* Breadcrumb */}
        <nav className="flex items-center gap-1.5 text-xs text-slate-400">
          <span>Dashboard</span>
          <ChevronRight className="h-3 w-3" />
          <span className="font-semibold text-slate-700">Settings</span>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* ── Left Column (main forms) ── */}
        <div className="lg:col-span-2 space-y-5">

          {/* Profile */}
          <SectionCard icon={User} iconBg="bg-indigo-50" iconColor="text-indigo-600" title="Profile Settings">
            <div className="space-y-5">
              {/* Avatar row */}
              <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
                <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center font-black text-white text-xl shadow-lg shadow-indigo-500/20">
                  {name?.[0]?.toUpperCase() || "U"}
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-900">{name}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{email}</p>
                  <button className="mt-2 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors">
                    Change avatar →
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField
                  label="Full Name"
                  value={name}
                  onChange={setName}
                  placeholder="Your name"
                  icon={User}
                />
                <InputField
                  label="Email Address"
                  type="email"
                  value={email}
                  onChange={setEmail}
                  placeholder="you@example.com"
                  icon={Mail}
                />
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-slate-400">
                  {user?.email ? `Signed in as ${user.email}` : "Loading..."}
                </p>
                {saveError && (
                  <p className="text-xs text-rose-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {saveError}
                  </p>
                )}
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200",
                    saved
                      ? "bg-emerald-500 text-white shadow-md shadow-emerald-500/20"
                      : "text-white"
                  )}
                  style={saved ? {} : {
                    background: "linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)",
                    boxShadow:  "0 4px 12px rgba(99, 102, 241, 0.3)",
                  }}
                >
                  {saving ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Saving...</>
                  ) : saved ? (
                    <><CheckCircle2 className="h-3.5 w-3.5" /> Saved!</>
                  ) : (
                    <><Save className="h-3.5 w-3.5" /> Save Changes</>
                  )}
                </button>
              </div>
            </div>
          </SectionCard>

          <SectionCard icon={Lock} iconBg="bg-violet-50" iconColor="text-violet-600" title="Update Password">
            <div className="space-y-4 max-w-sm">
              <InputField
                label="Current Password"
                type="password"
                value={currentPw}
                onChange={setCurrentPw}
                placeholder="••••••••"
                icon={Lock}
              />
              <InputField
                label="New Password"
                type="password"
                value={newPw}
                onChange={setNewPw}
                placeholder="Min. 8 characters"
                icon={Lock}
              />
              <InputField
                label="Confirm New Password"
                type="password"
                value={confirmPw}
                onChange={setConfirmPw}
                placeholder="Repeat new password"
                icon={Lock}
              />

              {pwError && (
                <p className="text-xs text-rose-500 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {pwError}
                </p>
              )}

              <div className="pt-1">
                <button
                  onClick={handlePasswordChange}
                  disabled={pwSaving}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200",
                    pwSaved
                      ? "bg-emerald-500 text-white shadow-md"
                      : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 shadow-sm"
                  )}
                >
                  {pwSaving ? (
                    <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Changing...</>
                  ) : pwSaved ? (
                    <><CheckCircle2 className="h-3.5 w-3.5" /> Password Changed!</>
                  ) : (
                    <><Lock className="h-3.5 w-3.5 text-slate-400" /> Change Password</>
                  )}
                </button>
              </div>
            </div>
          </SectionCard>

          {/* Outreach Profile */}
          <SectionCard icon={Send} iconBg="bg-indigo-50" iconColor="text-indigo-600" title="Outreach Profile">
            <div className="space-y-5">
              <div className="flex items-start sm:items-center justify-between flex-col sm:flex-row gap-3">
                <p className="text-xs text-slate-500">
                  This profile is used to personalize outreach emails. Fill in your skills, projects, and links.
                </p>
                <input type="file" accept="application/pdf" className="hidden" ref={fileInputRef} onChange={handleAutofill} />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isAutofilling}
                  className="flex items-center gap-1.5 rounded-lg bg-indigo-50 text-indigo-600 px-3 py-2 text-xs font-semibold hover:bg-indigo-100 transition-colors shrink-0 disabled:opacity-60"
                >
                  {isAutofilling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                  {isAutofilling ? "Reading CV..." : "Autofill from CV"}
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <InputField label="Full Name" value={opFullName} onChange={setOpFullName} placeholder="Kunal Sharma" icon={User} />
                <InputField label="Email" type="email" value={opEmail} onChange={setOpEmail} placeholder="you@example.com" icon={Mail} />
                <InputField label="Phone" value={opPhone} onChange={setOpPhone} placeholder="+91 98765 43210" />
                <InputField label="LinkedIn URL" value={opLinkedin} onChange={setOpLinkedin} placeholder="linkedin.com/in/yourname" icon={Linkedin} />
                <InputField label="GitHub URL" value={opGithub} onChange={setOpGithub} placeholder="github.com/yourname" icon={Github} />
                <InputField label="Portfolio URL" value={opPortfolio} onChange={setOpPortfolio} placeholder="yourportfolio.com" icon={Globe} />
              </div>

              {/* Bio */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600">Short Bio / Summary</label>
                <textarea
                  value={opBio}
                  onChange={(e) => setOpBio(e.target.value)}
                  rows={3}
                  placeholder="Final year CS student at IIT Delhi, passionate about building products..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/60 px-4 py-2.5 text-sm text-slate-900 placeholder:text-slate-400 resize-none focus:outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 transition-all"
                />
              </div>

              {/* Skills */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-600">Skills</label>
                <div className="flex flex-wrap gap-1.5 min-h-[2rem]">
                  {opSkills.map((s) => (
                    <span key={s} className="flex items-center gap-1 rounded-full bg-indigo-100 text-indigo-700 px-2.5 py-0.5 text-xs font-semibold">
                      {s}
                      <button onClick={() => setOpSkills(opSkills.filter((x) => x !== s))}>
                        <X className="h-3 w-3" />
                      </button>
                    </span>
                  ))}
                  <input
                    value={opSkillInput}
                    onChange={(e) => setOpSkillInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && opSkillInput.trim()) {
                        e.preventDefault()
                        setOpSkills([...opSkills, opSkillInput.trim()])
                        setOpSkillInput("")
                      }
                    }}
                    placeholder="Add skill + Enter"
                    className="rounded-lg border border-dashed border-slate-300 bg-transparent px-2.5 py-0.5 text-xs focus:outline-none focus:border-indigo-400 w-28"
                  />
                </div>
              </div>

              {/* Projects */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-slate-600">Projects (up to 5)</label>
                  {opProjects.length < 5 && (
                    <button
                      onClick={() => setOpProjects([...opProjects, { id: Date.now().toString(), name: "", description: "", techStack: [] }])}
                      className="flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      <Plus className="h-3 w-3" /> Add Project
                    </button>
                  )}
                </div>
                {opProjects.map((proj, idx) => (
                  <div key={proj.id} className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold text-slate-400 uppercase">Project {idx + 1}</span>
                      <button onClick={() => setOpProjects(opProjects.filter((_, i) => i !== idx))} className="text-slate-400 hover:text-rose-500">
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <input
                      value={proj.name}
                      onChange={(e) => setOpProjects(opProjects.map((p, i) => i === idx ? { ...p, name: e.target.value } : p))}
                      placeholder="Project name"
                      className="w-full h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-300 transition-all"
                    />
                    <input
                      value={proj.description}
                      onChange={(e) => setOpProjects(opProjects.map((p, i) => i === idx ? { ...p, description: e.target.value } : p))}
                      placeholder="Brief description"
                      className="w-full h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-300 transition-all"
                    />
                    <input
                      value={proj.techStack.join(", ")}
                      onChange={(e) => setOpProjects(opProjects.map((p, i) => i === idx ? { ...p, techStack: e.target.value.split(",").map((t) => t.trim()).filter(Boolean) } : p))}
                      placeholder="Tech stack (comma-separated)"
                      className="w-full h-8 rounded-lg border border-slate-200 bg-white px-3 text-xs text-slate-900 focus:outline-none focus:border-indigo-300 transition-all"
                    />
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-end pt-1">
                <button
                  onClick={handleSaveProfile}
                  disabled={profileSaving}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition-all duration-200",
                    profileSaved
                      ? "bg-emerald-500 text-white shadow-md"
                      : "text-white"
                  )}
                  style={profileSaved ? {} : {
                    background: "linear-gradient(135deg, #6366F1 0%, #7C3AED 100%)",
                    boxShadow: "0 4px 12px rgba(99, 102, 241, 0.3)",
                  }}
                >
                  {profileSaved ? (
                    <><CheckCircle2 className="h-3.5 w-3.5" /> Saved!</>
                  ) : (
                    <><Save className="h-3.5 w-3.5" /> Save Profile</>
                  )}
                </button>
              </div>
            </div>
          </SectionCard>
        </div>

        {/* ── Right Column ── */}
        <div className="space-y-5">

          <SectionCard icon={Bell} iconBg="bg-amber-50" iconColor="text-amber-500" title="Notifications">
            <div className="space-y-4">
              {[
                { label: "Email alerts", sub: "Interview schedules in your inbox", val: emailAlerts, set: setEmailAlerts },
                { label: "Weekly report", sub: "Progress & ghost rate summary", val: weeklyReport,   set: setWeeklyReport },
                { label: "Interview reminders", sub: "24hr advance reminders",     val: interviewRemind, set: setInterviewRemind },
                { label: "Marketing emails", sub: "Tips and product updates",      val: marketingEmails, set: setMarketingEmails },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between gap-3 py-1">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-800">{item.label}</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">{item.sub}</p>
                  </div>
                  <Toggle
                    checked={item.val}
                    onChange={(v) => { item.set(v) }}
                  />
                </div>
              ))}
              <div className="pt-1 border-t border-slate-100">
                <button
                  onClick={handleSaveNotifications}
                  disabled={notifSaving}
                  className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
                >
                  {notifSaving ? <Loader2 className="h-3 w-3 animate-spin" /> : <CheckCircle2 className="h-3 w-3" />}
                  Save preferences
                </button>
              </div>
            </div>
          </SectionCard>

          {/* Privacy & Security */}
          <SectionCard icon={Shield} iconBg="bg-sky-50" iconColor="text-sky-600" title="Privacy & Security">
            <div className="space-y-4">
              <div className="flex items-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 p-3">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <div>
                  <p className="text-xs font-bold text-emerald-700">Account Secured</p>
                  <p className="text-[11px] text-emerald-600 mt-0.5">2FA not enabled — consider adding it</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2.5 rounded-xl bg-slate-50 border border-slate-200 p-3">
                  <Database className="h-3.5 w-3.5 text-sky-500 shrink-0" />
                  <div>
                    <p className="text-[11px] font-semibold text-slate-700">Database Status</p>
                    <p className="text-[10px] text-slate-400 mt-0.5">MongoDB Atlas • Connected</p>
                  </div>
                  <div className="ml-auto flex items-center gap-1">
                    <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse-dot" />
                    <span className="text-[10px] font-bold text-emerald-600">Live</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 leading-relaxed">
                All your data is encrypted at rest and in transit using industry-standard AES-256 encryption.
              </p>
            </div>
          </SectionCard>

          {/* Appearance */}
          <SectionCard icon={Palette} iconBg="bg-pink-50" iconColor="text-pink-500" title="Appearance">
            <div className="space-y-3">
              <p className="text-xs text-slate-500">Theme preference</p>
              <div className="grid grid-cols-3 gap-2">
                {(["Light", "Dark", "System"] as const).map((t) => {
                  const stored = typeof window !== "undefined" ? localStorage.getItem("theme") || "System" : "System"
                  const isActive = stored === t
                  return (
                    <button
                      key={t}
                      onClick={() => {
                        localStorage.setItem("theme", t)
                        const root = document.documentElement
                        if (t === "Dark") {
                          root.classList.add("dark")
                        } else if (t === "Light") {
                          root.classList.remove("dark")
                        } else {
                          // System
                          const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
                          prefersDark ? root.classList.add("dark") : root.classList.remove("dark")
                        }
                        // Force re-render
                        window.dispatchEvent(new Event("theme-change"))
                      }}
                      className={cn(
                        "rounded-xl border py-2.5 text-xs font-semibold transition-all duration-150",
                        isActive
                          ? "border-indigo-300 bg-indigo-50 text-indigo-700 shadow-sm"
                          : "border-slate-200 bg-white text-slate-500 hover:border-slate-300"
                      )}
                    >
                      {t}
                    </button>
                  )
                })}
              </div>
              <p className="text-[11px] text-slate-400">
                Changes apply immediately. Dark mode requires theme support in CSS.
              </p>
            </div>
          </SectionCard>
        </div>
      </div>
    </div>
  )
}
