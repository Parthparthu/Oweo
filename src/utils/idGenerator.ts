/**
 * Generates a collision-resistant random identifier.
 */
export function generateId(prefix?: string): string {
  const randomPart = Math.random().toString(36).substring(2, 10) + Date.now().toString(36)
  return prefix ? `${prefix}_${randomPart}` : randomPart
}

/**
 * Generates an 8-character alphanumeric invite code (e.g. "OWEO-7K9A").
 */
export function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return `OW-${code}`
}
