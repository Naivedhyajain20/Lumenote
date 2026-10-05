/**
 * Global API URL resolver for Lumenote Frontend.
 *
 * Hierarchy:
 * 1. process.env.NEXT_PUBLIC_API_URL if explicitly configured.
 * 2. In browser runtime:
 *    - If hostname is localhost or 127.0.0.1, use http://localhost:8000
 *    - Otherwise (e.g. *.vercel.app, custom production domain), use https://lumenote.onrender.com
 * 3. In SSR / server build:
 *    - If NODE_ENV === 'production', use https://lumenote.onrender.com
 *    - Otherwise, default to http://localhost:8000
 */
export function getApiBase(): string {
  if (process.env.NEXT_PUBLIC_API_URL && process.env.NEXT_PUBLIC_API_URL.trim() !== "") {
    return process.env.NEXT_PUBLIC_API_URL.replace(/\/+$/, "");
  }

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host !== "localhost" && host !== "127.0.0.1") {
      return "https://lumenote.onrender.com";
    }
  }

  if (process.env.NODE_ENV === "production") {
    return "https://lumenote.onrender.com";
  }

  return "http://localhost:8000";
}

export const API_BASE = getApiBase();
