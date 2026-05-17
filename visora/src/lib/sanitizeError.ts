/**
 * Strip likely secrets from error messages before returning them in JSON.
 * Server logs keep the raw message; API responses use the sanitized form.
 */

const SENSITIVE_ENV_KEYS = [
  "FAL_KEY",
  "OPENAI_API_KEY",
  "NEXT_PUBLIC_SUPABASE_ANON_KEY",
  "SUPABASE_SERVICE_ROLE_KEY",
  "NEXTAUTH_SECRET",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_CLIENT_ID",
  "GITHUB_CLIENT_SECRET",
] as const;

export function sanitizeErrorMessage(message: string): string {
  let out = message;

  for (const key of SENSITIVE_ENV_KEYS) {
    const value = process.env[key]?.trim();
    if (value && value.length >= 8 && out.includes(value)) {
      out = out.replaceAll(value, "[redacted]");
    }
  }

  out = out.replace(/sk-[a-zA-Z0-9_-]{8,}/g, "[redacted]");
  out = out.replace(/Bearer\s+[a-zA-Z0-9._-]+/gi, "Bearer [redacted]");

  return out;
}
