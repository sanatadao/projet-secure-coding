// lib/rateLimit.ts — rate limiting en mémoire (labo). En prod : Redis/Upstash (voir limites du rapport).
const tentatives = new Map<string, { count: number; resetAt: number }>();

const LIMITE = 5; // 5 tentatives max
const FENETRE_MS = 60_000; // par fenêtre de 60 secondes

export function autoriser(cle: string): boolean {
  const maintenant = Date.now();
  const entree = tentatives.get(cle);

  if (!entree || maintenant > entree.resetAt) {
    // première tentative, ou fenêtre expirée → on repart à zéro
    tentatives.set(cle, { count: 1, resetAt: maintenant + FENETRE_MS });
    return true;
  }

  if (entree.count >= LIMITE) {
    // limite atteinte dans la fenêtre actuelle
    return false;
  }

  entree.count += 1;
  return true;
}
