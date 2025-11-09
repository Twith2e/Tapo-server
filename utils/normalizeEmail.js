export function normalizeEmail(email) {
  if (!email || typeof email !== "string") return null;

  return email.trim().toLowerCase();
}
