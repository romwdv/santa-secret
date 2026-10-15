# syntax=docker/dockerfile:1

# ═══════════════════════════════════════════════════════════════════════════
# Secret Santa — image de production
#
# Multi-stage : le premier étage compile, le second ne reçoit que le serveur
# Next en `standalone` (voir `output: "standalone"` dans next.config.ts).
#
# Les secrets sont répartis en deux familles, et c'est le point à ne pas
# rater :
#
#   • NEXT_PUBLIC_SUPABASE_URL est INLINÉ dans le bundle par `next build`.
#     Il doit donc être fourni au BUILD, via ARG. Le changer exige de
#     reconstruire l'image — il ne peut pas être fixé à l'exécution.
#
#   • SUPABASE_ANON_KEY et SUPABASE_SECRET_KEY ne sont lues qu'au RUNTIME,
#     côté serveur uniquement. Elles viennent de l'environnement du
#     conteneur et peuvent être changées sans reconstruire.
#
# Aucun secret n'est écrit dans une couche : ARG apparaît dans l'historique,
# donc seule la variable NEXT_PUBLIC_* (publique par nature) passe par là.
# ═══════════════════════════════════════════════════════════════════════════

ARG NODE_VERSION=24-alpine


# ── Étage 1 : dépendances ───────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS deps
WORKDIR /app

# Uniquement les manifestes : cette couche n'est invalidée que par un
# changement de dépendances, pas par chaque modification de source.
COPY package.json package-lock.json ./
# `--ignore-scripts` : on n'exécute rien de ce que le registre pourrait
# fournir. Les dépendances de ce projet n'ont pas de script de build.
RUN npm ci --ignore-scripts


# ── Étage 2 : compilation ────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS build
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Seule variable inlinée au build. Sans valeur, `next build` réussit mais
# produit un bundle qui pointe vers une URL Supabase vide : le défaut ne se
# voit qu'à l'exécution, en production. D'où le garde-fou ci-dessous.
ARG NEXT_PUBLIC_SUPABASE_URL
RUN test -n "$NEXT_PUBLIC_SUPABASE_URL" \
    || (echo "NEXT_PUBLIC_SUPABASE_URL est requis au build." >&2; exit 1)

ENV NEXT_PUBLIC_SUPABASE_URL=$NEXT_PUBLIC_SUPABASE_URL
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build


# ── Étage 3 : exécution ─────────────────────────────────────────────────────
FROM node:${NODE_VERSION} AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# Les secrets du runtime. Pas de valeur par défaut : une clé absente doit faire
# échouer le démarrage, pas produire des lectures anonymes en silence.
ENV SUPABASE_ANON_KEY=""
ENV SUPABASE_SECRET_KEY=""

RUN addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

# `standalone` produit un serveur auto-suffisant, avec son propre
# `node_modules`. On ajoute les deux morceaux qui ne sont pas dedans :
# les assets statiques et le dossier `public`.
COPY --from=build --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=build --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=build --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

# Sonde applicative : `/` exige une session participant et redirige, donc elle
# ne convient pas. La racine renvoie 307, ce qui suffit à prouver que le
# serveur répond — on ne teste pas la base depuis le HEALTHCHECK.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:3000/').then(r=>process.exit(r.status<500?0:1)).catch(()=>process.exit(1))"

CMD ["node", "server.js"]