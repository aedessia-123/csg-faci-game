// Passcode-gate for /admin. Uses Web Crypto (crypto.subtle) instead of Node's
// crypto module so the same code works in both the Edge middleware runtime
// and normal Node route handlers without any runtime-specific imports.

export const ADMIN_COOKIE_NAME = "admin_session";

export async function computeAdminToken() {
  const passcode = process.env.ADMIN_PASSCODE || "";
  const secret = process.env.ADMIN_AUTH_SECRET || "";
  if (!passcode || !secret) return null;
  const data = new TextEncoder().encode(`${passcode}:${secret}`);
  const hashBuffer = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}
