import { google } from "googleapis"

const SCOPES = ["https://www.googleapis.com/auth/calendar"]

export function createOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI || `${process.env.NEXT_PUBLIC_BASE_URL}/api/google-calendar/callback`
  )
}

export function getAuthUrl() {
  const oauth2Client = createOAuth2Client()
  return oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: SCOPES,
    prompt: "consent",
  })
}

export function createAuthenticatedClient(tokens: {
  access_token?: string | null
  refresh_token?: string | null
  expiry_date?: number | null
}) {
  const oauth2Client = createOAuth2Client()
  oauth2Client.setCredentials(tokens)
  return oauth2Client
}

export interface CalendarEvent {
  summary: string
  description?: string
  start: { dateTime: string; timeZone?: string }
  end: { dateTime: string; timeZone?: string }
  colorId?: string
}

export async function createCalendarEvent(
  tokens: { access_token?: string | null; refresh_token?: string | null; expiry_date?: number | null },
  event: CalendarEvent
): Promise<string | null> {
  try {
    const auth = createAuthenticatedClient(tokens)
    const calendar = google.calendar({ version: "v3", auth })

    const response = await calendar.events.insert({
      calendarId: "primary",
      requestBody: {
        summary: event.summary,
        description: event.description,
        start: event.start,
        end: event.end,
        colorId: event.colorId ?? "9", // blueberry
        reminders: {
          useDefault: false,
          overrides: [
            { method: "email", minutes: 24 * 60 },
            { method: "popup", minutes: 5 * 60 },
            { method: "popup", minutes: 30 },
          ],
        },
      },
    })

    return response.data.id ?? null
  } catch (err) {
    console.error("[createCalendarEvent]", err)
    return null
  }
}

export async function listUpcomingEvents(
  tokens: { access_token?: string | null; refresh_token?: string | null; expiry_date?: number | null },
  maxResults = 10
) {
  try {
    const auth = createAuthenticatedClient(tokens)
    const calendar = google.calendar({ version: "v3", auth })

    const response = await calendar.events.list({
      calendarId: "primary",
      timeMin: new Date().toISOString(),
      maxResults,
      singleEvents: true,
      orderBy: "startTime",
    })

    return response.data.items ?? []
  } catch (err) {
    console.error("[listUpcomingEvents]", err)
    return []
  }
}

export async function deleteCalendarEvent(
  tokens: { access_token?: string | null; refresh_token?: string | null; expiry_date?: number | null },
  eventId: string
) {
  try {
    const auth = createAuthenticatedClient(tokens)
    const calendar = google.calendar({ version: "v3", auth })
    await calendar.events.delete({ calendarId: "primary", eventId })
    return true
  } catch (err) {
    console.error("[deleteCalendarEvent]", err)
    return false
  }
}
