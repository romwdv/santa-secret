"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/button";
import { purgeWishlists } from "@/app/admin/actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" tone="red" size="sm" disabled={pending}>
      {pending ? "…" : "Purger les wishlists"}
    </Button>
  );
}

type State = { ok: true; message?: string } | { ok: false; error: string } | null;

/**
 * Purge des wishlists — outil de recette. Le nombre d'idées est affiché pour que
 * l'admin vérifie visuellement que la purge a bien eu effet.
 */
export function WishlistPurge({ itemCount }: { itemCount: number }) {
  const [state, action] = useActionState<State, FormData>(purgeWishlists, null);

  return (
    <section className="mt-10 flex flex-col gap-6">
      <h2 className="text-heading-sm text-text-primary">
        Wishlists <span className="text-heading-sm text-text-muted">{itemCount}</span>
      </h2>

      <form action={action} className="flex flex-col items-start gap-6">
        <label className="flex items-center gap-4 text-body-md text-text-muted">
          <input type="checkbox" name="confirm" value="PURGER" />
          Supprimer définitivement toutes les idées ({itemCount}). Participants,
          restrictions et tirages ne sont pas touchés.
        </label>
        <Submit />
      </form>

      {state && !state.ok ? (
        <p role="alert" className="max-w-2xl text-body-lg text-brand-red">
          {state.error}
        </p>
      ) : null}

      {state?.ok ? (
        <p role="status" className="text-body-lg text-text-accent">
          {state.message}
        </p>
      ) : null}
    </section>
  );
}