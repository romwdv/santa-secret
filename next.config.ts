import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // `standalone` : l'image Docker embarque le serveur Next et ses dépendances
  // de production, sans `node_modules`. Indispensable pour un déploiement
  // Coolify de quelques centaines de Mo au lieu de quelques Go.
  // Cf. docs/ARCHITECTURE.md § 7 et docs/ROADMAP.md (M8).
  output: "standalone",

  // Désactivé : ce modèle impose de délimiter explicitement tout ce qui lit
  // cookies(), ce qui est contre-intuitive quand CHAQUE page dépend de la
  // session. Voir docs/ARCHITECTURE.md § 5.
  // `partialPrefetching` en dépend également : les deux doivent evolutionner
  // ensemble, build compris.
  cacheComponents: false,
  partialPrefetching: false,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
