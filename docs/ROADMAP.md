# Roadmap

Suivi de l'avancement. **Source de vérité de l'implémentation.**

## Comment utiliser ce fichier

- Chaque session lit ce fichier **avant** de coder.
- On coche une case quand la tâche est **vraiment** finie et vérifiée
  (`lint` + `tsc` + `build` verts pour tout ce qui touche à du code).
- On ne coche jamais « en cours » : si une tâche est entamée, elle reste
  décochée.
- Un jalon n'est terminé que lorsque **toutes** ses cases sont cochées.
- En fin de session, on met à jour `## État actuel` ci-dessous.

---

## État actuel

**Au dernier point :** `M1`, `M2` et l'essentiel de `M3` sont terminés. Le
compte admin existe (`Confirmed at` renseigné) et `Enable signup` est désactivé.
`lint`, `typecheck`, `test` et `build` sont verts.

**Prochaine tâche :** coller `docs/MIGRATION-001-lien-facultatif.sql` dans le
SQL Editor Supabase — sans cela la colonne `url` reste `NOT NULL` et une idée
sans lien sera refusée par la base.

Puis : connecte-toi sur `/admin`, ajoute 2 participants, copie un lien, ouvre les
tirages. Tu pourras enfin faire les tests manuels de M3 et M5.

**Accès à la base :** supabase-js doit cibler le schéma via
`createClient(url, key, { db: { schema: 'santa' } })`. En curl, la forme
documentée est l'en-tête `Accept-Profile: santa` (lecture) et
`Content-Profile: santa` (écriture) — **pas** la forme de chemin
`/rest/v1/santa/table`, qui répond `PGRST125` alors que tout fonctionne.

**Le SQL est vérifié localement :** `npm run db:verify` rejoue le schéma et ses
tests sur un Postgres jetable, y compris avec une autre application simulée dans
`public` (vérifié : ses 6 tables restent intactes). Les cas d'échec — R2, R3, R4,
R7, RLS, privilèges — sont effectivement bloqués par la base. Ne pas modifier
`docs/*.sql` sans repasser par ce script.

**Point d'attention pour la prochaine session :** le port 3000 était occupé par
un autre `next-server` au dernier Dev, utiliser un autre port si besoin.

**Rappel** : l'admin se crée à la main dans le dashboard Supabase
(Authentication → Users → Add user, **cocher `Auto Confirm User`**), et
`Enable signup` doit être désactivé dans Authentication → Providers → Email.

---

## Jalons

### M1 · Fondations

- [x] `git init` + premier commit (fait par l'utilisateur avant cette session)
- [x] Installer la Supabase CLI en devDependency (`supabase@2.120.0`, binaire fonctionnel)
- [ ] `.env.local` avec `SUPABASE_URL`, clé secrète, clé publique — **en attente des
      valeurs réelles du projet Supabase** ⚠️ action manuelle
- [x] `.env.example` documentant chaque variable, et `.gitignore` corrigé
      (`!.env.example`, sinon le template était ignoré par `.env*`)
- [x] Désactiver `cacheComponents` **et** `partialPrefetching` dans `next.config.ts`
      (le second échoue au build si le premier est désactivé)
- [x] Ajouter Vitest à la chaîne `lint` / `test`, + script `typecheck`
- [x] Corriger `@types/node@^20` → `^24` (Vitest 5 exige `^22 || >=24`)
- [x] Vérifier que `npm run build` passe toujours

### M2 · Modèle de données

> ⚠️ Le projet Supabase héberge **une autre application** dans `public`
> (`actions`, `matches`, `outbox`, `participants`, `players`, `teams`).
> Tout Santa est dans le schéma **`santa`**. Ne jamais écrire dans `public`.

> ⚠️ **L'ordre compte.** Le sélecteur « Exposed schemas » du dashboard ne propose
> que les schémas **déjà existants**. `santa` doit donc être créé par SQL
> *avant* d'être exposé, sinon il n'apparaît pas dans la liste.

- [x] Créer le projet Supabase
- [x] Diagnostic de l'état réel du projet (`docs/ETAT.sql`, une seule requête)
- [x] **Coller `docs/DATA-MODEL.sql`** ⚠️ version `santa`, pas l'ancienne `public.*`
      → `schéma santa existe = OUI`, `tables santa = 5`, `fonctions santa = 3`
- [x] **Coller `docs/NETTOYAGE-PUBLIC.sql`** — les premières exécutions avaient
      laissé 4 tables Santa dans `public`. Après nettoyage : `nos tables dans
      public = 0`, **6 tables de l'autre application intactes**
- [x] Schéma `santa` exposé à PostgREST
- [x] `docs/VERIFY-DATA-MODEL.sql` → `TOUS LES TESTS PASSENT`
- [x] Cycle API complet vérifié sur le projet réel :
      · `POST santa.participants` → 201, relu en GET → bien dans `santa`
      · `POST` sans token → refusé `23502` (colonne NOT NULL)
      · `POST santa.reset_draws()` → 204
      · `anon` bloqué, `service_role` autorisé
- [x] GRANT explicites à `service_role` sur `schema santa`
- [ ] Coller `docs/DIAGNOSTIC.sql` → section 3 doit renvoyer les tables de l'autre
      app, section 2 doit renvoyer 0 ligne
- [ ] Tester la clé secrète en lecture sur `santa.participants` (attendu : 200)
- [x] GRANT explicites à `service_role` sur `schema santa` — constatés nécessaires
      sur le projet réel : sans eux, la clé secrète reçoit `403 permission denied`
- [x] `scripts/db-verify.sh` : rejoue schéma + tests sur un Postgres local jetable
- [x] Schéma **portable** : ni pgcrypto, ni rôle `anon`/`authenticated` requis
- [x] `RESET-SANTA.sql` remplace l'ancien reset global, avec garde-fou vérifiant
      que l'autre application n'a pas été touchée
- [x] `DIAGNOSTIC.sql` rendu non bloquant : `has_schema_privilege` lève une
      erreur si le schéma est absent, ce qui tronquait le script à la section 5

### M3 · Session participant

- [x] Client serveur `src/lib/supabase/server.ts` — clé secrète, `db.schema = "santa"`
- [x] `generateToken()` — `crypto.randomBytes(24)`, CSPRNG, 192 bits
- [x] Helper `getCurrentParticipant()` / `requireParticipant()`
- [x] Route `/j/[token]` : résout le token, pose le cookie, redirige
- [x] Cookie `santa_session` httpOnly + secure + sameSite lax — **vérifié** :
      le préfixe `#HttpOnly_` est présent dans le jar curl, et le token
      n'apparaît nulle part dans le HTML rendu
- [x] Pages `/connexion` et `/lien-invalide` (token inconnu)
- [x] Server actions wishlist : lecture, `getWishlistOf` (isolation R5), ajout, suppression
- [x] `src/lib/mock.ts` **supprimé** — plus aucune donnée fictive
- [x] Écrans branchés sur la base : `/`, `/wishlist`, `/wishlist/nouveau`, `/tirage`
- [x] **Écran `/wishlist/[id]`** — wishlist de la personne tirée, lecture seule (R8) :
      avatar + prénom dessous, retour à l'accueil, retour au tirage
- [x] `BackLink` sur `/wishlist`, `/tirage` et `/wishlist/[id]`
- [x] `Card.deleteAction` rendu **optionnel** — sans lui, aucun formulaire n'est
      produit : c'est le mécanisme qui porte R8
- [x] Isolation vérifiée : `/wishlist/<autre personne>` → 404, `getGiftDetails`
      renvoie `null` hors tirage, aucun nom ni token divulgué
- [x] **Créer le compte admin initial** dans le dashboard Supabase ⚠️ fait par l'utilisateur
      · `Confirmed at` renseigné
      · `Enable signup` désactivé dans Authentication → Providers → Email
- [ ] Session admin via `@supabase/ssr` + protection de `/admin/*` → fait en M5
- [x] Vérifié en conditions réelles : sans cookie `307 → /connexion`, lien invalide
      `→ /lien-invalide`, lien valide `307 → /`, données affichées, token jamais divulgué
- [ ] **Testé manuellement par l'utilisateur : ajout et suppression d'une idée**,
      et les deux écrans de wishlist — dès qu'un lien de connexion existe
      ⚠️ il n'y a aucun participant en base : le backoffice (M5) est le bloquant

### Ajustement · redirection après ajout d'idée

- [x] `addWishlistItem` redirige vers `/wishlist` en cas de succès, côté serveur
- [x] Fonction `neverReturns(): never` — impossible d'oublier le `return` après
      `redirect()`, le compilateur le garantit
- [x] Le discriminant `ok` supprimé : plus de chemin qui le définit
- [x] Le chemin d'échec reste sur l'écran, message d'erreur affiché
- [ ] **À vérifier d'un clic** : la redirection elle-même n'est pas testable en
      curl (protocole d'action Next), le reste l'est

### Migration 001 · lien facultatif

- [x] `docs/DATA-MODEL.sql` : `url` nullable, contrainte qui ne contrôle que le lien fourni
- [x] `docs/MIGRATION-001-lien-facultatif.sql` pour la base existante
- [x] `docs/VERIFY-DATA-MODEL.sql` : cas « sans lien », « lien vide » acceptés,
      URL non-http toujours refusée
- [x] `addWishlistItem` : lien contrôlé seulement s'il est fourni
- [x] `Card` : n'affiche pas de lien si absent
- [x] Formulaire : mention « (facultatif) », placeholder d'exemple
- [ ] **Coller `MIGRATION-001` dans le SQL Editor Supabase** ⚠️ requis

### M4 · Backoffice — conception Penpot

- [x] `06 · Backoffice — Connexion` (440×720)
- [x] `06 · Backoffice — Vue d’ensemble` (880×720)
- [x] `06 · Backoffice — Participants` (880×760)
- [x] `06 · Backoffice — Restrictions` (880×700)
- [x] `06 · Backoffice — Tirages` (880×700)
- [x] Construits avec les **instances** du design system (Button, Field, Avatar)
- [x] Vérifié : 110 éléments, aucun hors cadre
- [ ] Relecture visuelle par l'utilisateur (l'export Penpot a timeouté)

### M5 · Backoffice — implémentation

- [x] Session admin via `@supabase/ssr` (`src/lib/supabase/admin-auth.ts`)
- [x] `requireAdmin()` appelé par **chaque** action et **chaque** écran
- [x] Protection vérifiée : les 4 routes renvoient `307 → /admin/login` sans session,
      et un POST brut sur une Server Action est refusé
- [x] `login` / `logout` — message d'erreur générique (ne révèle pas si l'email existe)
- [x] Participants : lister, créer (token CSPRNG), supprimer
- [x] Suppression **refusée** si `participant_is_drawn()` — R2 préservée
- [x] Lien de connexion rendu côté serveur, copiable client, repli textuel
- [x] Restrictions : lister, créer, retirer — paire **triée avant insertion**
- [x] `src/lib/draw.ts` — backtracking + forward checking
- [x] **14 tests unitaires** : couplage parfait, auto-tirage, restrictions dans les
      deux sens, cas dégénérés (0/1 participant), restrictions impossibles, 30 personnes
- [x] `openDraws()` : calcule puis écrit via `santa.open_draw` (transactionnel)
- [x] `resetDraws()` via `santa.reset_draws` (nouveau lot, historique conservé)
- [x] Écrans `/admin`, `/admin/participants`, `/admin/restrictions`, `/admin/draws`
- [ ] **À tester manuellement (compte admin requis)** : connexion, ajout de
      participants, restrictions, ouverture/réinitialisation

### M6 · Algorithme de tirage

- [ ] `src/lib/draw.ts` — backtracking + forward-checking
- [ ] Tests : tirage valide, auto-tirage exclu, restrictions respectées
- [ ] Tests de dégénérescence : 0 participant, 1 participant, restrictions
      impossibles, restriction totale
- [ ] Message d'erreur nommant les participants bloqués
- [ ] Intégration avec `open_draw()`

### M7 · Parcours participant

- [ ] Accueil : 3 états (tirage fermé / pas encore tiré / déjà tiré)
- [ ] Écran de tirage
- [ ] Wishlist personnelle branchée sur la base (ajout, suppression)
- [ ] Wishlist d'un tiers en lecture seule
- [ ] Vérification que l'anonymat tient (R5) : aucun endpoint ne renvoie
      le donneur d'un participant

### M8 · Déploiement

- [ ] `Dockerfile` multi-stage + `.dockerignore`
- [ ] `output: "standalone"` dans `next.config.ts`
- [ ] Build local de l'image vérifié
- [ ] `.github/workflows/deploy.yml` : build + push GHCR
- [ ] Secrets GitHub configurés
- [ ] Source « Docker Image » configurée dans Coolify
- [ ] Recette complète en production

### M9 · Relecture design

- [ ] Comparaison de chaque écran réel avec sa maquette Penpot
- [ ] Correction des écarts dans Penpot, puis ré-export des tokens si besoin
- [ ] Mise à jour de `design.md`

---

## Récapitulatif

| Jalon | État |
| --- | --- |
| M1 · Fondations | ✅ Terminé |
| M2 · Modèle de données | ✅ Terminé |
| M3 · Session participant | 🟡 Tests manuels en attente d'un lien |
| M4 · Backoffice — conception | 🟡 Relecture visuelle à faire |
| M5 · Backoffice — implémentation | 🟡 Tests manuels admin |
| M6 · Algorithme de tirage | ✅ `draw.ts` + 14 tests |
| M7 · Parcours participant | ⬜ À faire |
| M8 · Déploiement | ⬜ À faire |
| M9 · Relecture design | ⬜ À faire |

---

## Invariants à ne jamais casser

Ces règles sont validées par le modèle de données. Les casser réintroduit des
bugs testés.

1. **R2** — `unique (batch, recipient_id)` est l'implémentation de « une personne
   tirée n'est plus disponible ». Ne jamais la remplacer par une vérification
   applicative.
2. **R4** — symétrie des restrictions garantie par `check (a_id < b_id)`.
3. **R5** — `draws` n'est jamais lu par un participant autrement que filtré sur
   son propre `giver_id`.
4. La clé `service_role` ne traverse jamais vers le client.
5. Le token du lien de connexion reste dans un cookie `httpOnly` et n'est jamais
   renvoyé dans le JS client.