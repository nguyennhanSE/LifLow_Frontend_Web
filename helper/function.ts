/**
 * Validates email format.
 * @param email - Email string to validate
 * @returns true if valid email format, false otherwise
 */
export function validateEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  return emailRegex.test(email.trim())
}
