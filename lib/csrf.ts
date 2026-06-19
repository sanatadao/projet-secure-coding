// lib/csrf.ts — génération et vérification d'un jeton CSRF (pattern double-submit)
import { randomBytes } from "crypto";

export function genererJetonCsrf(): string {
  return randomBytes(32).toString("hex");
}
