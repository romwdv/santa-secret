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

**Au dernier point :** aucun jalon entamé. Le produit est cadré (PRD), le design
system existe dans Penpot, l'app Next.js est scaffoldée avec l'UI des
participants en données mockées. La base de données n'existe pas encore.

**Prochaine tâche :** `M1 · Fondations` — `git init` et suppression de
`src/lib/mock.ts` quand le backend existe.

**Point d'attention pour la prochaine session :** le port 3000 était occupé par
un autre `next-server` au dernier Dev, utiliser un autre port si besoin.

---

## Jalons

### M1 · Fondations

- [ ] `git init` + premier commit (le dépôt n'est **pas** encore versionné)
- [ ] Installer la Supabase CLI en devDependency
- [ ] `.env.local` avec `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
      `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `.env.example` documentant chaque variable
- [ ] Désactiver `cacheComponents` dans `next.config.ts` (cf. `ARCHITECTURE.md` § 5)
- [ ] Ajouter Vitest à la chaîne `lint` / `test`
- [ ] Vérifier que `npm run build` passe toujours

### M2 · Modèle de données

- [ ] Créer le projet Supabase (région UE de préférence)
- [ ] Coller `docs/DATA-MODEL.sql` dans le SQL Editor
- [ ] Vérifier que les 5 tables et les 3 fonctions existent
- [ ] Vérifier que RLS refuse bien un accès `anon` (test curl avec la clé anon)
- [ ] Vérifier que `unique (batch, recipient_id)` rejette un doublon

### M3 · Session participant

- [ ] Génération du token à l'insertion d'un participant
- [ ] Route `/j/[token]` qui résout le participant et pose le cookie `httpOnly`
- [ ] `proxy.ts` : résolution de session, redirection si absent
- [ ] Helper `getCurrentParticipant()` côté serveur, utilisé par tous les écrans
- [ ] **Créer le compte admin initial** dans le dashboard Supabase
      ⚠️ action manuelle de l'utilisateur
- [ ] Session admin via `@supabase/ssr` + protection de `/admin/*`
- [ ] Retirer `src/lib/mock.ts` et brancher les écrans participants sur la base

### M4 · Backoffice — conception Penpot

- [ ] Écran `/admin` (vue d'ensemble, ouverture, réinitialisation)
- [ ] Écran `/admin/participants` (liste, ajout, copie du lien)
- [ ] Écran `/admin/restrictions` (paires symétriques)
- [ ] Écran `/admin/draws` (matrice des tirages)
- [ ] Écrans manquants côté participant : accueil connecté, tirage réel,
      wishlist en lecture seule
- [ ] Tokens exportés de Penpot → `globals.css` si de nouvelles valeurs apparaissent

### M5 · Backoffice — implémentation

- [ ] `GET/POST/DELETE` participants
- [ ] Affichage du lien de connexion avec bouton « copier »
- [ ] Refus de suppression si `participant_is_drawn()` est vrai
- [ ] CRUD des restrictions (tri automatique des deux identifiants)
- [ ] Bouton « Ouvrir les tirages » → appel à `open_draw()`
- [ ] Bouton « Réinitialiser les tirages » → appel à `reset_draws()`
- [ ] Page de consultation des tirages du batch courant

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
| M1 · Fondations | ⬜ À faire |
| M2 · Modèle de données | ⬜ À faire |
| M3 · Session participant | ⬜ À faire |
| M4 · Backoffice — conception | ⬜ À faire |
| M5 · Backoffice — implémentation | ⬜ À faire |
| M6 · Algorithme de tirage | ⬜ À faire |
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