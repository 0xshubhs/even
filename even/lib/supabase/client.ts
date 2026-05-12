import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

let cached: SupabaseClient | null = null;

/**
 * Returns a shared Supabase client, or `null` if env vars are missing. The app
 * runs fine without Supabase — group state simply stays local. The sync layer
 * checks for null before issuing any requests.
 */
export function getSupabase(): SupabaseClient | null {
  if (!URL || !ANON_KEY) return null;
  if (!cached) {
    cached = createClient(URL, ANON_KEY, {
      auth: { persistSession: false },
      realtime: { params: { eventsPerSecond: 5 } },
    });
  }
  return cached;
}

export const isSupabaseConfigured = !!(URL && ANON_KEY);
