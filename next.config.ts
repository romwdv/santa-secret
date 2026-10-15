import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
