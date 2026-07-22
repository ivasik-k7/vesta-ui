/** Deterministic flame-tinted identity gradient from any seed string (wallet
 *  address, merchant pubkey). Shared by every avatar/glyph across the app. */
export function identityGradient(seed: string): string {
  let h = 0
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360
  return `conic-gradient(from 140deg, hsl(${h} 80% 55%), hsl(${(h + 60) % 360} 75% 45%), hsl(${h} 80% 55%))`
}
