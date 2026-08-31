/**
 * DOH LANGUAGE™ — verbal identity system DOHNUT.
 * Single source of truth mesin untuk DOH phrases (rujuk brand-system/02-doh-language.md).
 * Digunakan oleh AI Concierge (Doh Boy persona) & komponen UI.
 */

export const DOH_CORE = [
  "DOH NUT WORRY",
  "DOH NUT PANIC",
  "DOH NUT DISTURB",
  "DOH NUT CARE",
  "DOH NUT QUIT",
  "DOH NUT STOP",
  "DOH NUT MISS",
  "DOH NUT WAIT",
  "DOH NUT LIE",
  "DOH NUT JUDGE",
  "DOH NUT OVERTHINK",
  "DOH NUT STRESS",
] as const;

export const DOH_MALAYSIAN = [
  "DOH LAH",
  "DOH WEI",
  "DOH GILER",
  "DOH BOLEH",
  "DOH SEDAP",
  "DOH APA NI?",
  "DOH SERIOUS LAH",
  "DOH JANGAN",
  "DOH KAN?",
  "DOH, KAU DAH CUBA?",
] as const;

export const DOH_MIX = [
  "DOH NOT BAD",
  "DOH SO GOOD",
  "DOH MY GOSH",
  "DOH MY GOODNESS",
  "DOH PLEASE",
  "GET YOUR DOH ON",
  "MORE DOH",
  "NEED MORE DOH",
  "A LITTLE MORE DOH",
  "NEVER ENOUGH DOH",
] as const;

/** Tagline rasmi brand. */
export const DOH_TAGLINE = "GOOD VIBE. GOOD DOH." as const;

/**
 * Frasa mengikut konteks emosi — untuk concierge memilih punchline yang padan.
 */
export const DOH_BY_CONTEXT = {
  reassurance: ["DOH NUT WORRY", "DOH NUT PANIC", "DOH NUT STRESS"],
  hype: ["DOH BOLEH", "DOH SEDAP", "DOH SO GOOD", "DOH GILER", "MORE DOH"],
  curiosity: ["DOH APA NI?", "DOH, KAU DAH CUBA?", "DOH NUT MISS"],
  cheeky: ["DOH MY GOSH", "DOH WEI", "DOH NUT JUDGE", "GET YOUR DOH ON"],
} as const;

/** Senarai penuh (flat) — untuk rawak/lookup. */
export const DOH_ALL: readonly string[] = [
  ...DOH_CORE,
  ...DOH_MALAYSIAN,
  ...DOH_MIX,
];

/** Semak sama ada satu baris teks mengandungi DOH phrase yang sah. */
export function containsDohPhrase(text: string): boolean {
  const upper = text.toUpperCase();
  return DOH_ALL.some((p) => upper.includes(p));
}

/**
 * Rangka persona DOH BOY™ untuk system prompt AI Concierge.
 * Kekalkan protokol katalog & format JSON block yang sedia ada.
 */
export const DOH_BOY_PERSONA = `
You are DOH BOY™ — the official DOHNUT internet character working as the shop concierge.
Your vibe: "GOOD VIBE. GOOD DOH." — cheeky, playful, bold, helpful. A meme-aware Malaysian donut character with strong opinions about flavours.

VOICE RULES (DOH LANGUAGE™):
- Sprinkle AT MOST one DOH phrase per reply as opener or punchline (never spam): DOH NUT WORRY / DOH BOLEH / DOH SEDAP / DOH WEI / DOH GILER / DOH, KAU DAH CUBA? / DOH NUT MISS / DOH MY GOSH.
- Rojak BM + English is encouraged — modern Malaysian, not cliché.
- Stay SHORT and punchy (2-4 sentences). At most 1 emoji.
- Strong takes on flavours are allowed ("finally someone gets it" energy), but the recommendation must be genuinely useful.
- Never force DOH into serious contexts (payment issues, safety).
`.trim();
