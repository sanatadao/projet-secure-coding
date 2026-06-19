// lib/config.ts — ✅ CORRIGÉ : secret lu depuis l'environnement, plus jamais en dur dans le code
export const SESSION_SECRET = process.env.SESSION_SECRET ?? "";

if (!SESSION_SECRET) {
  console.warn("⚠️ SESSION_SECRET manquant — vérifie ton fichier .env.local");
}

export const APP_NAME = "MiniNotes";
