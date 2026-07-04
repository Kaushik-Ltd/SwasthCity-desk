export type LanguageCode =
  | "en" | "hi" | "bn" | "ta" | "te" | "kn" | "ml" | "gu" | "mr" | "pa" | "as" | "or" | "ur";

export interface LanguageDef {
  code: LanguageCode;
  native: string;
  english: string;
  flag: string; // emoji or short label
  aiName: string; // full name to send to the AI
}

export const LANGUAGES: LanguageDef[] = [
  { code: "en", native: "English",      english: "English",   flag: "🇬🇧", aiName: "English" },
  { code: "hi", native: "हिन्दी",        english: "Hindi",     flag: "अ",  aiName: "Hindi (Devanagari script)" },
  { code: "bn", native: "বাংলা",         english: "Bengali",   flag: "অ",  aiName: "Bengali (Bangla script)" },
  { code: "ta", native: "தமிழ்",         english: "Tamil",     flag: "அ",  aiName: "Tamil" },
  { code: "te", native: "తెలుగు",        english: "Telugu",    flag: "అ",  aiName: "Telugu" },
  { code: "kn", native: "ಕನ್ನಡ",         english: "Kannada",   flag: "ಅ",  aiName: "Kannada" },
  { code: "ml", native: "മലയാളം",       english: "Malayalam", flag: "അ",  aiName: "Malayalam" },
  { code: "gu", native: "ગુજરાતી",       english: "Gujarati",  flag: "અ",  aiName: "Gujarati" },
  { code: "mr", native: "मराठी",         english: "Marathi",   flag: "अ",  aiName: "Marathi (Devanagari script)" },
  { code: "pa", native: "ਪੰਜਾਬੀ",         english: "Punjabi",   flag: "ਅ",  aiName: "Punjabi (Gurmukhi script)" },
  { code: "as", native: "অসমীয়া",       english: "Assamese",  flag: "অ",  aiName: "Assamese" },
  { code: "or", native: "ଓଡ଼ିଆ",          english: "Odia",      flag: "ଅ",  aiName: "Odia (Oriya)" },
  { code: "ur", native: "اردو",          english: "Urdu",      flag: "ا",  aiName: "Urdu (Nastaʿlīq script)" },
];

export const LANGUAGE_MAP: Record<LanguageCode, LanguageDef> =
  Object.fromEntries(LANGUAGES.map((l) => [l.code, l])) as Record<LanguageCode, LanguageDef>;

export function isLanguageCode(v: unknown): v is LanguageCode {
  return typeof v === "string" && v in LANGUAGE_MAP;
}
