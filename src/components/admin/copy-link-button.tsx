"use client";

import { useState } from "react";

/**
 * Copie dans le presse-papiers. Affiche le lien en cas d'échec : le presse-papiers
 * peut être refusé (contexte non sécurisé, permission navigateur) — l'admin doit
 * toujours pouvoir récupérer le lien.
 */
export function CopyLinkButton({ value }: { value: string }) {
  const [feedback, setFeedback] = useState<string | null>(null);

  async function copy() {
    try {
      await navigator.clipboard.writeText(value);
      setFeedback("Lien copié");
    } catch {
      setFeedback(`Copie impossible : ${value}`);
    }
  }

  return (
    <span className="flex items-center gap-4">
      <button
        type="button"
        onClick={copy}
        className="text-body-lg text-text-accent underline-offset-4 hover:underline cursor-pointer"
      >
        Copier le lien
      </button>
      {feedback ? (
        <span role="status" className="text-caption text-text-muted">
          {feedback}
        </span>
      ) : null}
    </span>
  );
}