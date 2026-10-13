import { extendTailwindMerge } from "tailwind-merge";

/**
 * L'échelle typographique Santa (voir @theme dans globals.css) utilise des noms
 * de taille non standards — `text-heading-sm`, `text-avatar-lg`, etc.
 * tailwind-merge ne les reconnaît pas comme des tailles de police et les classe
 * dans le même groupe que les couleurs, ce qui fait disparaître la couleur
 * quand les deux sont présentes.
 *
 * On déclare donc explicitement ces noms comme belonging to `font-size`.
 */
const santaFontSizes = [
  "display-lg",
  "display-md",
  "heading-lg",
  "heading-md",
  "heading-sm",
  "body-lg",
  "body-md",
  "label-lg",
  "label-sm",
  "caption",
  "avatar-md",
  "avatar-lg",
];

export const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [{ text: santaFontSizes }],
    },
  },
});

export { santaFontSizes };