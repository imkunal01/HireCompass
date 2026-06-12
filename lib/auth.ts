/**
 * lib/auth.ts — thin re-export shim
 *
 * NextAuth has been removed. All auth is now handled via lib/session.ts.
 * This file exists only for backward-compatibility during the migration.
 */
export { getSession, getServerSession } from "./session"
