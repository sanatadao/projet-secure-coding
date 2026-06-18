// lib/config.ts
// ⚠️ FAILLE : un secret EN DUR dans le code (devrait vivre dans .env.local, hors de Git)
export const SESSION_SECRET = "mn_live_8f3c1a9e2b7d4f60_PROD_DO_NOT_SHARE";

// (utilisé symboliquement par l'app ; l'important pour l'audit : il est COMMITÉ dans le code)
export const APP_NAME = "MiniNotes";