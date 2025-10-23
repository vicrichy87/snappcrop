// lib/session.js
import { supabase } from "./supabase";

export async function getSession() {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.error("Session fetch error:", error);
    return null;
  }
  return data.session;
}
