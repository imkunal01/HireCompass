import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
})

export interface ReminderEmailData {
  id: string
  company: string | null
  jobTitle: string | null
  message: string
  type: "DEADLINE" | "FOLLOWUP" | "INTERVIEW" | "EVENT" | "REGISTRATION" | "TASK" | "CUSTOM"
  eventDate?: string | null
  registrationDeadline?: string | null
  dueAt: string
}

export interface DigestData {
  userName: string
  todayReminders: Array<{ message: string; company: string | null; type: string; dueAt: string }>
  upcomingInterviews: Array<{ company: string; role: string; date: string; time: string; type: string }>
  ghostedApps: Array<{ company: string; title: string; daysSince: number }>
  pipeline: { total: number; applied: number; interview: number; offer: number; rejected: number }
  baseUrl: string
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-IN", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

function formatTime(dateStr: string) {
  return new Date(dateStr).toLocaleTimeString("en-IN", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
}

function getTimeLeft(dateStr: string): string {
  const diff = new Date(dateStr).getTime() - Date.now()
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  if (days > 1) return `${days} days`
  if (hours > 1) return `${hours} hours`
  return "less than an hour"
}

function buildEmailHTML(opts: {
  title: string
  subtitle: string
  badgeLabel: string
  badgeColor: string
  body: string
  ctaUrl?: string
  ctaLabel?: string
  urgency?: "high" | "medium" | "low"
}) {
  const urgencyBg =
    opts.urgency === "high"
      ? "#FEF2F2"
      : opts.urgency === "medium"
      ? "#FFFBEB"
      : "#F0F9FF"
  const urgencyBorder =
    opts.urgency === "high"
      ? "#FECACA"
      : opts.urgency === "medium"
      ? "#FDE68A"
      : "#BAE6FD"

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${opts.title}</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:12px;">
                <div style="width:36px;height:36px;background:rgba(255,255,255,0.2);border-radius:10px;display:inline-flex;align-items:center;justify-content:center;font-size:18px;">🧭</div>
                <span style="color:white;font-size:18px;font-weight:800;letter-spacing:-0.5px;">HireCompass</span>
              </div>
              <div style="display:inline-block;background:${opts.badgeColor};color:white;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:4px 12px;border-radius:999px;margin-bottom:16px;">${opts.badgeLabel}</div>
              <h1 style="margin:0;color:white;font-size:24px;font-weight:800;line-height:1.3;letter-spacing:-0.5px;">${opts.title}</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:14px;">${opts.subtitle}</p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="background:white;padding:32px 40px;">
              ${
                opts.urgency
                  ? `<div style="background:${urgencyBg};border:1px solid ${urgencyBorder};border-radius:12px;padding:16px 20px;margin-bottom:24px;">
                ${opts.body}
              </div>`
                  : `<div>${opts.body}</div>`
              }
              ${
                opts.ctaUrl && opts.ctaLabel
                  ? `<div style="text-align:center;margin-top:28px;">
                <a href="${opts.ctaUrl}" style="display:inline-block;background:linear-gradient(135deg,#4F46E5,#7C3AED);color:white;text-decoration:none;font-weight:700;font-size:14px;padding:14px 32px;border-radius:12px;box-shadow:0 4px 15px rgba(79,70,229,0.3);">${opts.ctaLabel} →</a>
              </div>`
                  : ""
              }
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background:#F8FAFC;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;border-top:1px solid #E2E8F0;">
              <p style="margin:0;color:#94A3B8;font-size:12px;">HireCompass · Your Job Tracker Pro</p>
              <p style="margin:4px 0 0;color:#CBD5E1;font-size:11px;">You're receiving this because you set a reminder on HireCompass.</p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}

// ── Confirmation email when a reminder is created ──────────────────────────
export async function sendReminderConfirmation(
  to: string,
  reminder: ReminderEmailData
) {
  const title = reminder.company
    ? `${reminder.company}${reminder.jobTitle ? ` — ${reminder.jobTitle}` : ""}`
    : reminder.jobTitle || reminder.message

  const lines: string[] = []

  if (reminder.message) {
    lines.push(
      `<p style="margin:0 0 12px;color:#334155;font-size:15px;"><strong>Note:</strong> ${reminder.message}</p>`
    )
  }
  if (reminder.eventDate) {
    lines.push(
      `<p style="margin:0 0 8px;color:#334155;font-size:14px;">📅 <strong>Event Date:</strong> ${formatDate(reminder.eventDate)} at ${formatTime(reminder.eventDate)}</p>`
    )
  }
  if (reminder.registrationDeadline) {
    lines.push(
      `<p style="margin:0 0 8px;color:#334155;font-size:14px;">✍️ <strong>Registration Deadline:</strong> ${formatDate(reminder.registrationDeadline)}</p>`
    )
  }
  lines.push(
    `<p style="margin:16px 0 0;color:#64748B;font-size:13px;">You will receive reminder emails 24 hours and 5 hours before each date.</p>`
  )

  const html = buildEmailHTML({
    title: "Reminder Set! ✅",
    subtitle: title,
    badgeLabel: "Confirmation",
    badgeColor: "#10B981",
    body: lines.join(""),
  })

  await transporter.sendMail({
    from: `"HireCompass 🧭" <${process.env.GMAIL_USER}>`,
    to,
    subject: `✅ Reminder set: ${title}`,
    html,
  })
}

// ── Alert email: 24h before event ─────────────────────────────────────────
export async function sendEventAlertEmail(
  to: string,
  reminder: ReminderEmailData,
  alertType: "24h" | "5h" | "exact",
  dateType: "event" | "registration" | "exact"
) {
  const title = reminder.company
    ? `${reminder.company}${reminder.jobTitle ? ` — ${reminder.jobTitle}` : ""}`
    : reminder.jobTitle || reminder.message

  const targetDate =
    dateType === "exact" ? reminder.dueAt : dateType === "event" ? reminder.eventDate : reminder.registrationDeadline
  if (!targetDate) return

  const timeLeft = getTimeLeft(targetDate)
  const isUrgent = alertType === "5h" || alertType === "exact"
  const dateLabel = dateType === "exact" ? "Reminder" : dateType === "event" ? "Event" : "Registration Deadline"
  const emoji = dateType === "exact" ? "⏰" : dateType === "event" ? "📅" : "✍️"

  const body = `
    <p style="margin:0 0 16px;color:#1E293B;font-size:16px;font-weight:700;">
      ${alertType === "exact" ? "🔔 Reminder Due Now!" : isUrgent ? "⚡ Happening Soon!" : "🔔 Coming Up Tomorrow"}
    </p>
    <p style="margin:0 0 12px;color:#334155;font-size:15px;">
      ${emoji} <strong>${dateLabel}:</strong> ${formatDate(targetDate)} at ${formatTime(targetDate)}
    </p>
    ${
      alertType === "exact"
        ? ""
        : `<p style="margin:0 0 12px;color:#334155;font-size:14px;">
             ⏱️ <strong>Time Remaining:</strong> <span style="color:${isUrgent ? "#EF4444" : "#F59E0B"};font-weight:700;">${timeLeft} left</span>
           </p>`
    }
    ${reminder.message ? `<p style="margin:0;color:#64748B;font-size:13px;padding-top:12px;border-top:1px solid #E2E8F0;">${reminder.message}</p>` : ""}
  `

  const subject =
    alertType === "exact"
      ? `🔔 Reminder: ${title}`
      : isUrgent
      ? `⚡ ${timeLeft} left — ${dateLabel}: ${title}`
      : `🔔 Tomorrow: ${dateLabel} for ${title}`

  const html = buildEmailHTML({
    title: alertType === "exact" ? "Reminder Due" : isUrgent ? `Only ${timeLeft} left!` : `${dateLabel} is Tomorrow`,
    subtitle: title,
    badgeLabel: alertType === "exact" ? "⏰ Now" : isUrgent ? "⚡ Urgent" : `⏰ ${alertType === "24h" ? "24h" : "5h"} Alert`,
    badgeColor: isUrgent ? "#EF4444" : "#F59E0B",
    body,
    urgency: isUrgent ? "high" : "medium",
  })

  await transporter.sendMail({
    from: `"HireCompass 🧭" <${process.env.GMAIL_USER}>`,
    to,
    subject,
    html,
  })
}

// ── Daily Digest Email ─────────────────────────────────────────────────────
export async function sendDailyDigestEmail(to: string, data: DigestData) {
  const { userName, todayReminders, upcomingInterviews, ghostedApps, pipeline, baseUrl } = data
  const today = new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })

  const hasAnything = todayReminders.length > 0 || upcomingInterviews.length > 0 || ghostedApps.length > 0

  // ── Sections ──
  const reminderRows = todayReminders.length === 0
    ? `<p style="color:#94A3B8;font-size:13px;margin:0;">No reminders due today 🎉</p>`
    : todayReminders.map(r => `
        <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid #F1F5F9;">
          <span style="font-size:16px;">${r.type === "INTERVIEW" ? "🎯" : r.type === "DEADLINE" ? "⏰" : r.type === "FOLLOWUP" ? "📩" : "🔔"}</span>
          <div>
            <p style="margin:0;font-size:14px;font-weight:600;color:#1E293B;">${r.company ? `${r.company}` : r.message}</p>
            <p style="margin:2px 0 0;font-size:12px;color:#64748B;">${r.message} · ${new Date(r.dueAt).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true })}</p>
          </div>
        </div>`).join("")

  const interviewRows = upcomingInterviews.length === 0
    ? `<p style="color:#94A3B8;font-size:13px;margin:0;">No interviews in the next 3 days.</p>`
    : upcomingInterviews.map(i => `
        <div style="display:flex;align-items:flex-start;gap:10px;padding:10px 0;border-bottom:1px solid #F1F5F9;">
          <span style="font-size:16px;">🗓️</span>
          <div>
            <p style="margin:0;font-size:14px;font-weight:600;color:#1E293B;">${i.company} — ${i.role}</p>
            <p style="margin:2px 0 0;font-size:12px;color:#64748B;">${i.type} · ${new Date(i.date + "T" + i.time).toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })} at ${i.time}</p>
          </div>
        </div>`).join("")

  const ghostRows = ghostedApps.length === 0
    ? `<p style="color:#94A3B8;font-size:13px;margin:0;">No ghosted applications! Keep it up 💪</p>`
    : ghostedApps.slice(0, 5).map(g => `
        <div style="display:flex;align-items:center;justify-content:space-between;padding:8px 0;border-bottom:1px solid #F1F5F9;">
          <div>
            <p style="margin:0;font-size:13px;font-weight:600;color:#1E293B;">${g.company}</p>
            <p style="margin:2px 0 0;font-size:12px;color:#64748B;">${g.title}</p>
          </div>
          <span style="font-size:11px;font-weight:700;color:#EF4444;background:#FEF2F2;border:1px solid #FECACA;border-radius:999px;padding:3px 8px;">${g.daysSince}d silent</span>
        </div>`).join("")

  const nudge = !hasAnything
    ? "You're all caught up! Consider applying to 3 new roles today. 🚀"
    : todayReminders.length > 0
    ? `You have ${todayReminders.length} reminder${todayReminders.length > 1 ? "s" : ""} due today. Don't miss them!`
    : upcomingInterviews.length > 0
    ? `${upcomingInterviews[0].company} interview coming up — make sure you're prepped! 🎯`
    : ghostedApps.length > 0
    ? `${ghostedApps.length} application${ghostedApps.length > 1 ? "s" : ""} with no response. Consider sending a follow-up!`
    : "Keep pushing — every application gets you closer! 💪"

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Your Daily Job Search Digest</title>
</head>
<body style="margin:0;padding:0;background:#F1F5F9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#F1F5F9;padding:32px 16px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

        <!-- Header -->
        <tr><td style="background:linear-gradient(135deg,#4F46E5 0%,#7C3AED 100%);border-radius:16px 16px 0 0;padding:32px 40px;text-align:center;">
          <div style="display:inline-flex;align-items:center;gap:10px;margin-bottom:12px;">
            <span style="color:white;font-size:20px;">🧭</span>
            <span style="color:white;font-size:18px;font-weight:800;letter-spacing:-0.5px;">HireCompass</span>
          </div>
          <div style="display:inline-block;background:rgba(255,255,255,0.2);color:white;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;padding:4px 12px;border-radius:999px;margin-bottom:16px;">🌅 Daily Digest</div>
          <h1 style="margin:0;color:white;font-size:22px;font-weight:800;line-height:1.3;">Good morning, ${userName}!</h1>
          <p style="margin:6px 0 0;color:rgba(255,255,255,0.75);font-size:13px;">${today}</p>
        </td></tr>

        <!-- Nudge banner -->
        <tr><td style="background:#EEF2FF;border-left:4px solid #4F46E5;padding:16px 40px;">
          <p style="margin:0;font-size:14px;color:#3730A3;font-weight:600;">💡 ${nudge}</p>
        </td></tr>

        <!-- Pipeline stats -->
        <tr><td style="background:white;padding:24px 40px;">
          <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:1px;">Pipeline Overview</p>
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              ${[
                { label: "Total", value: pipeline.total, color: "#4F46E5", bg: "#EEF2FF" },
                { label: "Applied", value: pipeline.applied, color: "#0EA5E9", bg: "#F0F9FF" },
                { label: "Interview", value: pipeline.interview, color: "#8B5CF6", bg: "#F5F3FF" },
                { label: "Offers", value: pipeline.offer, color: "#10B981", bg: "#ECFDF5" },
              ].map(s => `<td align="center" style="padding:0 4px;">
                <div style="background:${s.bg};border-radius:12px;padding:14px 8px;text-align:center;">
                  <div style="font-size:22px;font-weight:800;color:${s.color};">${s.value}</div>
                  <div style="font-size:11px;color:#64748B;font-weight:600;margin-top:2px;">${s.label}</div>
                </div>
              </td>`).join("")}
            </tr>
          </table>
        </td></tr>

        <!-- Today's Reminders -->
        <tr><td style="background:white;padding:0 40px 24px;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:1px;">⏰ Today's Reminders</p>
          ${reminderRows}
        </td></tr>

        <!-- Upcoming Interviews -->
        <tr><td style="background:white;padding:0 40px 24px;border-top:1px solid #F1F5F9;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:1px;">🎯 Upcoming Interviews</p>
          ${interviewRows}
        </td></tr>

        <!-- Ghosting Radar -->
        <tr><td style="background:white;padding:0 40px 24px;border-top:1px solid #F1F5F9;">
          <p style="margin:0 0 12px;font-size:13px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:1px;">👻 Ghosting Radar</p>
          ${ghostRows}
        </td></tr>

        <!-- CTA -->
        <tr><td style="background:white;padding:0 40px 32px;text-align:center;border-top:1px solid #F1F5F9;">
          <a href="${baseUrl}/dashboard" style="display:inline-block;background:linear-gradient(135deg,#4F46E5,#7C3AED);color:white;text-decoration:none;font-weight:700;font-size:14px;padding:14px 32px;border-radius:12px;box-shadow:0 4px 15px rgba(79,70,229,0.3);">Open HireCompass →</a>
        </td></tr>

        <!-- Footer -->
        <tr><td style="background:#F8FAFC;border-radius:0 0 16px 16px;padding:20px 40px;text-align:center;border-top:1px solid #E2E8F0;">
          <p style="margin:0;color:#94A3B8;font-size:12px;">HireCompass · Your Job Search Command Center</p>
          <p style="margin:4px 0 0;color:#CBD5E1;font-size:11px;">You're receiving this daily digest from HireCompass.</p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`

  await transporter.sendMail({
    from: `"HireCompass 🧭" <${process.env.GMAIL_USER}>`,
    to,
    subject: `🌅 Your Daily Digest — ${hasAnything ? `${todayReminders.length + upcomingInterviews.length} items need attention` : "You're all caught up!"} | ${new Date().toLocaleDateString("en-IN", { weekday: "short", month: "short", day: "numeric" })}`,
    html,
  })
}
