# Rapport de sécurité — MiniNotes

## 1. Périmètre & méthode

- **Option B** — application MiniNotes (code inconnu, Next.js + alasql)
- **Outils** : ESLint (config v9), npm audit, Semgrep (OSS, règles limitées
  sans compte), revue manuelle fichier par fichier
- **Méthode** : audit outillé → revue manuelle → attaques de confirmation
  → correctifs → rejouer les attaques (doivent échouer) → durcissement

- **Constat sur l'audit outillé** :

  **npm audit** — analyse uniquement les dépendances (SCA), pas le code
  applicatif. Résultat : 2 vulnérabilités de sévérité modérée, portées
  par `postcss <8.5.10` (XSS via sortie CSS non échappée, GHSA-qx2v-qp2m-jg93),
  elle-même tirée par `next`. Aucune mise à jour non-breaking disponible
  (le correctif proposé par `npm audit fix --force` imposerait un
  downgrade de `next` vers une version canary, écarté pour ce projet).
  Comme attendu, cet outil ne peut par construction détecter aucune des
  failles présentes dans notre propre code (SQLi, IDOR, XSS stocké,
  CSRF) : ce n'est pas son rôle.

  **ESLint** (`next/core-web-vitals`) — testé sur l'ensemble du code
  ainsi que ciblé sur `app/api/login/route.ts` et
  `app/commentaires/page.tsx` : 0 erreur, 0 warning dans les deux cas
  (code de sortie 0). Vérification via `eslint --print-config` : la
  règle `react/no-danger` (qui détecterait l'usage de
  `dangerouslySetInnerHTML`) n'est pas activée par ce ruleset — seule
  la variante restrictive `react/no-danger-with-children` l'est. ESLint
  ne voit donc ni la SQLi (analyse syntaxique de surface, sans suivi de
  flux de données) ni le XSS stocké pourtant présent dans le code.

  **Semgrep** (`scan --config auto`, 213 règles communautaires sur 30
  fichiers) — 0 finding. Même en mode SAST à suivi de flux/patterns, le
  jeu de règles gratuit "auto" (sans compte Semgrep, donc sans accès aux
  règles Pro/proprietary) ne couvre pas spécifiquement le pattern
  "template literal injecté dans un appel à un moteur SQL custom comme
  alasql" ni l'absence de contrôle de propriété (IDOR) — ce sont des
  failles métier/logique, pas des patterns syntaxiques génériques.

  **Conclusion** : les 3 familles d'outils combinées remontent au total
  0 alerte sur les failles réellement présentes dans le code (SQLi,
  IDOR, CSRF, mots de passe en clair, secret en dur, XSS stocké). C'est
  un faux négatif total et un excellent rappel : "0 alerte automatique"
  ne signifie absolument pas "0 faille". Les outils SAST/SCA dégrossissent
  un terrain (dépendances connues, patterns syntaxiques répandus), mais
  ne remplacent jamais la revue manuelle, en particulier pour les failles
  de **logique métier** (contrôle d'accès, gestion de session, validation)
  qui nécessitent de comprendre l'intention du code, pas seulement sa
  syntaxe. La suite de cet audit s'appuie donc sur une revue manuelle
  fichier par fichier (lib/sqldb.ts, lib/config.ts, app/api/login,
  app/api/notes, app/api/notes/[id], app/api/profil, app/commentaires),
  en suivant chaque donnée non fiable (`req.json()`, cookie, `params.id`)
  jusqu'à son sink (`db(sql)`, `dangerouslySetInnerHTML`, réponse JSON).

## 2. Failles trouvées (inventaire)

| # | Fichier · ligne | Faille | OWASP | Gravité CVSS |
|---|-----------------|--------|-------|--------------|
| 1 | lib/sqldb.ts — seed users | Mots de passe stockés en clair | A02 | Élevé |
| 2 | lib/config.ts — SESSION_SECRET | Secret en dur, commité dans Git | A05 | Élevé |
| 3 | app/api/login/route.ts — requête SQL | Injection SQL (bypass login) | A03 | Critique |
| 4 | app/api/login/route.ts — réponse JSON | Réponse renvoie password + role complets | A01/A02 | Élevé |
| 5 | app/api/login/route.ts — message d'erreur | Message trop précis → énumération d'emails | A07 | Moyen |
| 6 | app/api/login/route.ts — pas de limite | Aucun rate limiting → brute force | A07 | Moyen |
| 7 | app/api/login/route.ts — cookie | Cookie session httpOnly:false | A05/A07 | Moyen |
| 8 | app/api/notes/route.ts (GET) | Injection SQL via cookie sessionId | A03 | Critique |
| 9 | app/api/notes/route.ts (POST) | Injection SQL via titre/contenu + pas de validation | A03/A04 | Critique |
| 10 | app/api/notes/[id]/route.ts — pas de vérif userId | IDOR : accès aux notes d'autrui | A01 | Élevé |
| 11 | app/api/profil/route.ts — pas de jeton | CSRF sur changement d'email | A01 | Moyen |
| 12 | app/commentaires/page.tsx — dangerouslySetInnerHTML | XSS stocké | A03 | Élevé |

**Justification de la gravité** :
- *Critique* (#3, #8, #9) : exploitation triviale via curl, impact total
  (bypass auth, lecture/écriture arbitraire en base), zéro prérequis.
- *Élevé* (#1, #2, #4, #10, #12) : accès direct à des données sensibles
  sans casser le système, mais nécessitant une étape supplémentaire
  (fuite de la base, visite d'une page piégée par une victime).
- *Moyen* (#5, #6, #7, #11) : aggravent une attaque mais ne suffisent
  pas seules à compromettre le système.

## 2bis. Backlog priorisé (ordre de correction)

Le correctif se fait du plus grave au moins grave, en respectant la
règle : on traite d'abord ce qui permet une compromission totale et
triviale, avant ce qui nécessite déjà un accès ou une étape préalable.

| Ordre | # | Faille | Gravité | Justification de la priorité |
|-------|---|--------|---------|-------------------------------|
| 1 | 3 | Injection SQL — login (bypass) | Critique | Compromission totale du système (accès admin) en une seule requête `curl`, sans authentification préalable. Impact maximal, effort minimal. |
| 2 | 8 | Injection SQL — GET /api/notes (via cookie) | Critique | Même classe de faille que #3 ; exploitable dès qu'on a un cookie de session (donc juste après avoir été authentifié, même en tant que simple user). |
| 3 | 9 | Injection SQL — POST /api/notes | Critique | Idem : permet en plus l'écriture arbitraire en base (pas seulement la lecture), donc un vecteur supplémentaire de gravité. |
| 4 | 1 | Mots de passe en clair | Élevé | Ne nécessite "que" l'accès à la base (déjà compromise via les SQLi ci-dessus) pour exposer tous les comptes ; corrigé tôt car il conditionne aussi le correctif du login (bcrypt). |
| 5 | 4 | Fuite de l'objet user complet | Élevé | Expose immédiatement le mot de passe et le rôle à quiconque se connecte normalement — aucun effort d'attaque requis, juste regarder la réponse. |
| 6 | 10 | IDOR sur /api/notes/[id] | Élevé | Permet de lire les données privées de n'importe quel autre utilisateur sans élévation de privilège ; un attaquant authentifié "normal" suffit. |
| 7 | 12 | XSS stocké (commentaires) | Élevé | Touche tous les visiteurs de la page, pas seulement l'attaquant — risque de vol de session à grande échelle, mais nécessite qu'une victime visite la page (étape supplémentaire vs les SQLi). |
| 8 | 2 | Secret en dur dans le code | Élevé | Risque différé/long terme (le secret reste dans l'historique Git même après correction) plutôt qu'immédiatement exploitable via l'app elle-même. |
| 9 | 5 | Message d'erreur bavard (énumération) | Moyen | Facilite d'autres attaques (brute force ciblé) mais ne compromet rien directement à elle seule. |
| 10 | 6 | Pas de rate limiting (brute force) | Moyen | Nécessite du temps/volume pour être exploitée ; aggravée par #5 mais traitable indépendamment. |
| 11 | 7 | Cookie httpOnly:false | Moyen | N'est dangereux qu'en présence d'un XSS exploitable (#12) — donc dépend d'une autre faille pour avoir un impact réel ; traité juste après le XSS. |
| 12 | 11 | CSRF sur /api/profil | Moyen | Nécessite qu'une victime déjà connectée visite une page piégée ; impact limité à un seul champ (email) dans ce projet. |

**Principe général retenu** : les 3 injections SQL passent avant tout
car elles permettent une compromission **immédiate et totale** sans
aucun prérequis. Viennent ensuite les failles de **confidentialité**
des données (mots de passe, fuite user, IDOR, XSS) qui exposent des
données sensibles mais demandent un minimum de contexte (être
authentifié, ou qu'une victime agisse). Enfin, les failles qui
**aggravent** d'autres attaques sans être exploitables seules
(énumération, absence de rate limiting, cookie non-httpOnly, CSRF)
sont traitées en dernier, car corriger les failles critiques en amont
réduit déjà une grande partie de leur impact potentiel.

## 3. Correctifs



## 4. Durcissement



## 5. Ce qui reste à faire / limites