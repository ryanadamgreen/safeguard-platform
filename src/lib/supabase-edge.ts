/**
 * Edge-runtime-safe Supabase client.
 * createBrowserClient (@supabase/ssr) uses localStorage/document.cookie
 * which don't exist in the Edge Runtime and will crash the DNS handler.
 * createClient from @supabase/supabase-js works in any JS environment.
 */
import { createClient } from "@supabase/supabase-js";

export const supabaseEdge = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
