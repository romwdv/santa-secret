# PRD — Secret Santa (usage familial)

Statut : **validé**. Dernière mise à jour : session de cadrage initiale.

---

## 1. But de l'application

Application web permettant d'organiser un Secret Santa **au niveau familial**.
Il n'existe aucune notion de business : ni multi-tenant, ni offre payante, ni
industrialisation du paiement. Le périmètre est celui d'un groupe de quelques
dizaines de personnes, utilisé une fois par an.

Ce cadrage est volontaire : il autorise des choix techniques simples
(authentification par lien, pas de mots de passe, données en lecture seule) qui
seraient Hors sujet dans un contexte commercial.

---

## 2. Décisions produit actées

| Décision | Choix | Raison |
| --- | --- | --- |
| Anonymat du tirage | Chacun voit **qui il a tiré**, jamais **qui l'a tiré**. L'admin voit tout. | Préserve l'effet de surprise du Secret Santa. |
| Connexion participant | Lien unique, généré par l'admin, copié-collé et envoyé par lui. Réutilisable sur plusieurs appareils. | Aucun mot de passe à gérer ni à communicate. |
| Protection du backoffice | Supabase Auth (email + mot de passe), accessible uniquement par URL connue. Aucun lien dans l'interface. | Le backoffice n'est pas destiné aux participants. |
| Ouverture du tirage | Déclenchée manuellement par l'admin. Impossible de tirer avant. | Garantit qu'un tirage complet et valide existe avant le moindre participant. |
| Réinitialisation | Manuelle, par l'admin, tous les tirages d'un coup. Participants et restrictions conservés. | Permet de corriger un tirage bâclé. |
| Backoffice | Conçu dans Penpot avant implémentation, avec le design system existant. | Cohérence avec la méthode retenue pour le reste de l'app. |
| Base de données | Supabase (Postgres). Schéma fourni en SQL à coller dans le SQL Editor. | Peu de migrations à gérer sur un projet de cette taille. |
| Déploiement | GitHub Actions construit une image Docker → GHCR → Coolify (source « Docker Image »). | Intégration native Coolify, rien d'autre à maintenir. |

---

## 3. Règles métier

Ces règles sont **non négociables**. Toute évolution passe par une modification
de ce document.

1. **R1 — Tirage unique.** Un participant ne peut tirer qu'une seule personne.
   Son tirage est définitif.
2. **R2 — Exclusivité du destinataire.** Une personne tirée n'est plus disponible
   dans le tirage. Le couplage est donc **bijectif** : chacun donne à une
   personne, chacun reçoit de quelqu'un.
3. **R3 — Pas d'auto-tirage.** Personne ne peut être son propre destinataire.
4. **R4 — Restrictions symétriques.** Si A ne peut pas tirer B, alors B ne peut pas
   tirer A. La symétrie est garantie **par construction** en base, pas par une
   vérification applicative (cf. `DATA-MODEL.sql`, contrainte `CHECK`).
5. **R5 — Anonymat.** Un participant voit son propre tirage. Il ne voit jamais qui
   l'a tiré. Cette information n'est accessible qu'à l'admin.
6. **R6 — Tirage fermé au départ.** Aucun tirage n'est possible avant l'ouverture
   par l'admin.
7. **R7 — Réinitialisation.** L'admin peut remplacer tous les tirages courants.
   L'historique est conservé (batch), les participants et restrictions ne sont pas
   affectés.
8. **R8 — Lecture seule chez les tiers.** La wishlist d'une autre personne est
   consultable en lecture seule, jamais modifiable.

---

## 4. User stories

### Participant

| ID | Story | Critère d'acceptation |
| --- | --- | --- |
| **US-1** | En tant que participant, je me connecte via le lien unique que l'admin m'a envoyé pour accéder à mon espace. | Le lien pose une session persistante et me redirige vers l'accueil. Le lien fonctionne sur téléphone et sur ordinateur. |
| **US-2** | En tant que participant, je veux voir si j'ai déjà tiré ou si le tirage est ouvert. | L'accueil affiche soit le bouton « Tirer », soit mon résultat, soit un message « le tirage n'est pas encore ouvert ». |
| **US-3** | En tant que participant, je veux tirer une personne au sort. | Le tirage aboutit à l'affichage d'un nom et de son avatar. Un second essai n'est pas possible (R1). |
| **US-4** | En tant que participant, je veux revenir sur mon tirage plus tard. | Mon destinataire est toujours identique d'une session à l'autre. |
| **US-5** | En tant que participant, je veux consulter la wishlist de la personne que j'ai tirée, en lecture seule. | Je vois les idées et les liens, je ne dispose d'aucun contrôle de modification. |
| **US-6** | En tant que participant, je veux ajouter une idée à ma wishlist. | Titre et lien requis, validation de l'URL, l'idée apparaît immédiatement dans ma liste. |
| **US-7** | En tant que participant, je veux supprimer une idée de ma wishlist. | L'idée disparaît après confirmation. Je ne peux supprimer que les miennes. |

### Administrateur

| ID | Story | Critère d'acceptation |
| --- | --- | --- |
| **US-A1** | En tant qu'admin, je veux ouvrir les tirages. | Un tirage complet et valide est calculé et affiché. Si les restrictions rendent l'opération impossible, je reçois un message nommant les participants bloqués. |
| **US-A2** | En tant qu'admin, je veux réinitialiser les tirages. | Confirmation demandée. Tous les participants doivent pouvoir re-tirer. |
| **US-A3** | En tant qu'admin, je veux ajouter un participant avec son prénom et ses initiales. | L'admin obtient immédiatement un lien de connexion à copier. |
| **US-A4** | En tant qu'admin, je veux supprimer un participant. | Refusé si le participant a déjà donné ou reçu un tirage ; l'admin est invité à réinitialiser. |
| **US-A5** | En tant qu'admin, je veux déclarer des restrictions de tirage (couples, exclusions). | Une restriction A↔B s'applique dans les deux sens (R4). |
| **US-A6** | En tant qu'admin, je veux consulter la matrice complète des tirages pour vérifier. | Chaque donneur et son destinataire sont listés, sans exception. |

---

## 5. Périmètre

### Dans le périmètre

- Espace participant : accueil, tirage, wishlist personnelle (CRUD), wishlist d'un tiers (lecture seule)
- Backoffice : participants, restrictions, ouverture/réinitialisation, consultation des tirages
- Design system Santa, déjà réalisé dans Penpot

### Hors périmètre

- Toute forme de compte participant avec mot de passe
- Notifications, e-mails, envoi automatique des liens
- Modification de la wishlist d'un tiers
- Thème sombre
- Internationalisation
- Gestion de plusieurs Secret Santa simultanés

---

## 6. Écrans

### Participant

| Route | Écran | Maquette Penpot |
| --- | --- | --- |
| `/j/[token]` | Point d'entrée du lien unique | À concevoir |
| `/` | Accueil connecté | **Partiellement** — existe, ne couvre pas les états « pas encore ouvert » et « déjà tiré » |
| `/tirage` | Tirage | **À concevoir** — l'existant est un placeholder sans functionality |
| `/wishlist` | Ma wishlist (CRUD) | Réalisée |
| `/wishlist/nouveau` | Ajout d'une idée | Réalisée |
| `/wishlist/[id]` | Wishlist d'un tiers, lecture seule | À concevoir |

### Administrateur

| Route | Écran | Maquette Penpot |
| --- | --- | --- |
| `/admin/login` | Connexion admin | À concevoir |
| `/admin` | Vue d'ensemble, ouverture/réinitialisation | À concevoir |
| `/admin/participants` | Liste, ajout, suppression, copie du lien | À concevoir |
| `/admin/restrictions` | Restrictions symétriques | À concevoir |
| `/admin/draws` | Matrice des tirages | À concevoir |

---

## 7. Risques et points d'attention

| Risque | Impact | Traitement |
| --- | --- | --- |
| Course entre deux tirages simultanés | Deux personnes obtiendraient le même destinataire | **Contrainte `UNIQUE` en base**, pas de vérification applicative. Cf. `DATA-MODEL.sql`. |
| Tirage infaisable (restrictions contradictoires) | L'admin ne peut pas ouvrir | Erreur explicite nommant les participants bloqués. Aucun échec silencieux. |
| Suppression d'un participant après tirage | Casse la bijectivité | Suppression refusée, admin invited à réinitialiser. |
| Division involontaire des tirages | Le secret est spoilé | `draws` n'est jamais lu par un participant autrement que filtré sur son propre `giver_id`. |
| Le lien unique transpire côté client | Session volable par XSS | Le token vit dans un cookie `httpOnly` et n'est jamais renvoyé au JS client. |

---

## 8. Traçabilité

Ce PRD est la source de vérité **produit**. L'avancement d'implémentation est
suivi dans [`ROADMAP.md`](ROADMAP.md). Les décisions techniques sont justifiées
dans [`ARCHITECTURE.md`](ARCHITECTURE.md).