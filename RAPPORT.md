# Rapport de sécurité — MiniNotes

## 1. Périmètre & méthode

- **Option B** — application MiniNotes (code inconnu, Next.js + alasql)
- **Outils** : ESLint (config v9), npm audit, Semgrep (OSS, règles limitées
  sans compte), revue manuelle fichier par fichier
- **Méthode** : audit outillé → revue manuelle → attaques de confirmation
  → correctifs → rejouer les attaques (doivent échouer) → durcissement

## 2. Failles trouvées (inventaire)

| # | Fichier · ligne | Faille | OWASP | Gravité CVSS |
|---|-----------------|--------|-------|--------------|

| 1 | app/api/login/route.ts — réponse JSON | Réponse renvoie password + role complets | A01/A02 | Élevé |

| 2 | app/api/login/route.ts — SQL concaténé | Injection SQL (bypass login) | A03 | Critique |

| 3 | app/api/notes/[id]/route.ts — pas de vérif userId | IDOR : accès aux notes d'autrui | A01 | Élevé |




## 3. Correctifs



## 4. Durcissement



## 5. Ce qui reste à faire / limites

