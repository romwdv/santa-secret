# Design system Santa

Ce document est le **journal de décisions** du design system. Il ne contient pas
la liste des valeurs de tokens : celles-ci vivent dans
[`src/app/globals.css`](src/app/globals.css), qui est généré depuis Penpot.

---

## Sources et propriété

| Élément | Source de vérité |
| --- | --- |
| Couleurs, typographie, espacements, rayons, ombres | Set de tokens `Santa` dans Penpot |
| Composants et leurs axes de variants | Boards `04 · Composants` et `05 · Sources` dans Penpot |
| Valeurs de tokens côté code | `src/app/globals.css` — **artefact généré** |

Penpot n'est pas versionné : le fichier est la référence de design, `globals.css`
est ce qui est commité. Toute divergence se corrige **dans Penpot**, puis se
ré-exporte. Ne modifiez jamais `globals.css` à la main — la modification serait
écrasée à la prochaine synchronisation.

### Re-synchroniser les tokens

1. Modifier le set `Santa` dans Penpot.
2. Demander à l'agent de ré-exporter le set vers la section `@theme` de
   `src/app/globals.css`.
3. Vérifier que le diff ne contient que les tokens attendus.

Le contrôle automatisé de dérive n'existe pas encore : tant qu'il n'est pas en
place, une relecture du diff fait office de garde-fou.

---

## Conventions

- **Typographie** — Sofia Sans, line-height 1.2 sur toute l'échelle.
  Utilitaires : `text-display-lg|md`, `text-heading-lg|md|sm`, `text-body-lg|md`,
  `text-label-lg|sm`, `text-caption`, `text-avatar-md|lg`.
- **Noms de taille et couleurs partagent le préfixe `text-`** — voir le piège
  § ci-dessous avant d'ajouter une taille à l'échelle.
- **Espacements** — échelle de 4 px. Les hauteurs de contrôle et tailles
  (avatar, icône) vivent dans le même namespace que les espacements :
  `h-control-md`, `h-icon-md`, `w-avatar-lg`, etc.
- **Rayons** — `rounded-sm` (10px, boutons), `rounded-md` (20px, champs),
  `rounded-pill` (40px, cartes de liste).
- **Thème unique clair** — aucun thème sombre pour l'instant.

---

## Règles d'usage des composants

| Composant | Quand l'utiliser | Ne pas utiliser pour |
| --- | --- | --- |
| `Button` | Action principale, soumission de formulaire | La navigation — utiliser un `Link` habillé en `Button` via `asChild` |
| `IconButton` | Action destructive sur un élément de liste ; toujours avec `label` | Une action non destructive (pas de confirmation implicite) |
| `Field` | Saisie de texte courte ; `aria-describedby` pour le message d'erreur | Du texte long ou du multi-ligne |
| `Card` | Un élément de la wishlist : titre + lien + suppression | Un contenu statique générique |
| `EmptyState` | Un état vide explicite, avec la prochaine action | Un chargement (à traiter séparément) |
| `Avatar` | Identifier une personne ; `initials` en 2 lettres maximum | Une photo — le composant ne gère pas les images |

### Axes de variants

Les axes exposés en props sont ceux qui changent le **rendu**. Les états
Default / Hover / Pressed / Disabled sont des **états d'interaction** et ne sont
pas des props : ils se gèrent en CSS et via l'attribut `disabled` natif.

Conséquence : un composant qui expose `state` en prop est un composant mal conçu
dans cette base.

### Piège : `tailwind-merge` et l'échelle typographique

Nos tailles de police portent des noms non standards (`text-heading-sm`,
`text-avatar-lg`…). `tailwind-merge`, utilisé par [`cn`](src/lib/utils.ts), ne les
reconnaît pas comme des tailles : il les place dans le même groupe que les
couleurs et **supprime la couleur** quand les deux cohabitent.

Concrètement, `Button` et `Avatar` perdaient `text-text-on-brand` et leurs
libellés héritaient du `color` du `<body>` — donc **rouge** sur fond vert.

La correction est dans [`src/lib/tw-merge.ts`](src/lib/tw-merge.ts), qui déclare
explicitement l'échelle comme appartenant au groupe `font-size`.
**Toute nouvelle taille de police doit être ajoutée à `santaFontSizes`.**

`cva` n'est pas concerné : il utilise `clsx`, pas `tailwind-merge`.

---

## Décisions prises

- **Next.js 16.4 / React 19.3 / Tailwind 4.3** — Turbopack par défaut, donc pas
  de `--turbopack` dans les scripts. `next lint` a disparu, ESLint tourne en CLI
  via `npm run lint`. Les Request APIs sont asynchrones : toujours `await params`.
- **Icônes — `lucide-react`** — les maquettes mélangeaient `pepicons`, `carbon`
  et `gridicons`, incohérents entre eux. Une seule source a été retenue ; les
  composants `IconButton` et `Card` utilisent `Trash2`.
- **Champ de 44 px** — la maquette indiquait 42 px, en dessous du minimum
  recommandé pour une cible tactile. Corrigé dans Penpot (`sizing.control.height.sm`)
  et dans `globals.css`.
- **Français en dur** — aucune librairie i18n tant qu'il n'y a pas de seconde
  langue.
- **`cacheComponents` activé** — laissé par `create-next-app`, cohérent avec une
  app de lecture principalement statique.
- **Pas de Storybook** — une route `/design-system` rend les primitives et leurs
  états. Suffisant pour six composants, sans le coût de setup.

---

## Écarts assumés avec les maquettes

- `/tirage` — l'écran existe parce que le bouton « Mon tirage » de l'index pointe
  quelque part, mais **il n'a pas été maquetté**. L'implémentation est
  minimale et à revoir.
- `EmptyState` — la maquette fait 379×95 ; le composant fait 400×118 pour tenir
  les trois lignes sans débordement.
- Le bouton « supprimer » du composant `Card` est un `IconButton` et non un
  simple bouton rouge : la maquette n'utilisait pas le composant `IconButton`
  pour cet emplacement.

---

## Points ouverts

- **Modèle de données** — la wishlist est un titre + une URL. Le comportement en
  cas de doublon d'URL n'est pas défini. À trancher avant le backend.
- **Session** — `getSession()` dans `src/lib/mock.ts` renvoie un utilisateur
  figé. Aucune auth n'est en place ; à remplacer avant toute mise en production.
- **Persistance** — toutes les mutations (`Card`, `NewItemForm`) sont locales au
  composant. Elles devront passer par des Server Actions.
- **Dérive des tokens** — pas de contrôle automatisé, cf. § Re-synchroniser.