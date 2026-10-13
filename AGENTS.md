<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Projet Secret Santa

## Commencer ici

**Toute session doit lire ces fichiers avant d'écrire du code :**

1. [`docs/ROADMAP.md`](docs/ROADMAP.md) — l'avancement. La section
   `## État courant` indique la prochaine tâche. **Cocher les cases au fur et à
   mesure**, et mettre à jour `État courant` en fin de session.
2. [`docs/PRD.md`](docs/PRD.md) — le périmètre produit et les règles métier R1 à R8.
3. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — pourquoi des choix techniques
   ont été faits.
4. [`design.md`](design.md) — le design system, et surtout le piège
   `tailwind-merge` sur l'échelle typographique.

## Règles permanentes

- **Ne pas repartir de zéro** : vérifier `ROADMAP.md` avant de commencer, et y
  revenir à la fin.
- **Source de vérité du design** : Penpot. `src/app/globals.css` est un artefact
  généré — ne pas l'éditer à la main.
- **Vérifier avant de déclarer fini** : `npm run lint`, `npx tsc --noEmit`,
  `npm run build`. Un jalon non coché tant que ce n'est pas vert.
- **Ne jamais casser un invariant** : la liste est en bas de `ROADMAP.md`. Le
  premier (`unique (batch, recipient_id)`) est implémenté par le moteur de la
  base ; le remplacer par une vérification applicative réintroduirait une course
  entre deux tirages simultanés.
