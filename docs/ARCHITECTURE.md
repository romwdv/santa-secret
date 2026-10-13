# Architecture

Justification des décisions techniques structurantes. Le **pourquoi**, pas le
mode d'emploi : le mode d'emploi est dans le code.

---

## 1. Supabase est un serveur, pas une API client

**Décision : aucun accès direct à Supabase depuis le navigateur.**

Toutes les lectures et écritures passent par des Server Components, Server
Actions et Route Handlers, qui utilisent la clé `service_role`. Cette clé n'est
jamais exposée au client.

**Pourquoi :** le cookie de session du participant est un bearer token. S'il
existait un accès direct à Supabase depuis le navigateur, un XSS suffirait à
extraire le token et à usurper l'identité. En gardant tout le chemin
serveur — cookie `httpOnly` → résolution du participant → requête Postgres —
l'attaquant n'a rien à voler.

**Conséquence :** RLS est activée **sans aucune policy** pour `anon` et
`authenticated` (`DATA-MODEL.sql`). Tout accès direct est refusé par défaut.
C'est une défense en profondeur, pas le mécanisme principal.

---

## 2. Deux systèmes d'authentification, volontairement distincts

| | Participant | Administrateur |
| --- | --- | --- |
| Mécanisme | Token opaque en cookie `httpOnly` | Session Supabase Auth |
| Package | Aucun (`node:crypto` + cookie) | `@supabase/ssr` |
| Identité | `participants.token` | Table `auth.users` |
| Protection | Middleware de résolution | `proxy.ts` sur `/admin/*` |

Ces deux populations n'ont ni le même cycle de vie ni le même niveau de risque.
Les fusionner en un seul mécanisme obligerait à faire gérer des mots de passe
aux participants — ce que le produit refuse explicitement.

**Le backoffice n'est lié depuis nulle part dans l'interface.** Son URL n'est
connue que de l'admin. Ce n'est pas une mesure de sécurité — n'importe qui peut
la deviner — mais elle évite les accès involontaires.

---

## 3. Le tirage : l'algorithme en TS, la guaranteeing en SQL

**Décision : l'affectation est calculée dans `src/lib/draw.ts`, puis écrite par
une fonction transactionnelle `open_draw(jsonb)`.**

Le problème est un couplage parfait entre participants avec arêtes interdites
(auto-tirage + restrictions) — un *matching* biparti. L'algorithme (backtracking
aléatoire avec forward-checking) vit en TypeScript pour trois raisons :

- il est **testable unitairement**, ce qu'un recursive PL/pgSQL n'est pas ;
- il est **lisible et modifiable** sans toucher au schéma ;
- il produit une erreur métier explicite (« ces participants sont bloqués »)
  qu'on peut afficher telle quelle à l'admin.

La persistance, elle, doit être atomique : `open_draw` verrouille la ligne
singleton (`SELECT … FOR UPDATE`), vérifie la cardinalité, insère, puis ouvre le
tirage — le tout dans une transaction. Une violation de contrainte annule
l'ensemble.

### R2 est garantie par la base, pas par le code

`unique (batch, recipient_id)` est la véritable implémentation de « une personne
tirée n'est plus disponible ». Une vérification applicative (`if (!alreadyDrawn)
draw()`) est **incorrecte** : deux requêtes simultanées la franchirient toutes
les deux. Ici, la seconde insertion viole la contrainte et la transaction est
annulée.

C'est le point le plus important de tout le modèle de données. Toute
simplification future qui le remplacerait par une vérification applicative
réintroduirait le bug.

### La réinitialisation ne supprime rien

Chaque tirage porte un `batch`. Réinitialiser ouvre un nouveau batch : les
unicités deviennent `(batch, giver_id)` et `(batch, recipient_id)`, et
l'historique reste consultable. Supprimer les lignes aurait perdu l'information
et aurait rendu le diagnostic d'incident impossible.

---

## 4. Les restrictions sont symétriques par construction

Une restriction A↔B est stockée avec les identifiants **triés**, imposé par
`check (a_id < b_id)`. Il est donc mathématiquement impossible d'insérer « A ne
peut pas tirer B » sans que « B ne peut pas tirer A » soit aussi vrai.

Un trigger ou une double ligne auraient introduit deux états possibles
divergents. La contrainte d'ordre n'en a qu'un.

---

## 5. `cacheComponents` : désactivé

`create-next-app` active `cacheComponents`. Ce modèle impose de délimiter
explicitement tout ce qui lit `cookies()` et rend l'optique contre-intuitive sur
une application où **chaque page** dépend de la session.

Pour une app authentifiée de cette taille, on paie plus qu'on ne gagne.
`cacheComponents: false` dans `next.config.ts`.

---

## 6. Turbopack et les conventions Next 16

- Turbopack est le bundler par défaut : **ne pas** ajouter `--turbopack` dans les scripts.
- `next lint` a été supprimé : le lint tourne via la CLI ESLint (`npm run lint`).
- Les Request APIs sont **asynchrones** : `await params`, `await cookies()`.
- L'interception de requêtes s'appelle `proxy.ts` (ex-`middleware.ts`), runtime Node uniquement.

---

## 7. Déploiement

```
push sur main → GitHub Actions → build image → ghcr.io/<owner>/santa:main
                                                  ↓
                                          Coolify (source Docker Image)
```

`output: "standalone"` dans `next.config.ts` pour que l'image soit légère.
Le serveur n'expose que `PORT`, les secrets (`SUPABASE_URL`, clés) sont des
variables d'environnement côté Coolify.

---

## 8. Ce qui n'est pas tranché

| Sujet | Position actuelle | À trancher |
| --- | --- | --- |
| Suppression d'un participant ayant tiré | Refusée, admin invité à réinitialiser | Confirmer avec le produit |
| Compte admin initial | Créé à la main dans le dashboard Supabase | Voir `ROADMAP.md`, jalon 3 |
| Conservation des tirages batchés | Conservés | Revoir si le volume devient gênant |