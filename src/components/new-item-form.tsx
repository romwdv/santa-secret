"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Plus } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { Field } from "@/components/field";
import { addWishlistItem } from "@/app/actions";
import type { Participant } from "@/lib/types";

type NewItemFormProps = {
  user: Participant;
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="mt-4 w-full gap-5">
      <Plus size={24} aria-hidden="true" />
      {pending ? "Enregistrement…" : "Valider"}
    </Button>
  );
}

export function NewItemForm({ user }: NewItemFormProps) {
  const [state, formAction] = useActionState(addWishlistItem, null);

  return (
    <main className="mx-auto flex w-full max-w-110 flex-1 flex-col px-6">
      <Avatar initials={user.initials} size="md" className="self-center" />

      <h1 className="mt-10 text-heading-md text-text-primary">
        Ajouter une idée à la whishlist
      </h1>

      <form action={formAction} noValidate className="mt-8 flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <label htmlFor="title" className="text-label-lg text-text-muted">
            Titre de l&apos;idée
          </label>
          <Field
            id="title"
            name="title"
            autoComplete="off"
            placeholder="Titre de l'idée"
            aria-describedby={state ? "form-error" : undefined}
          />
        </div>

        <div className="flex flex-col gap-4">
          <label htmlFor="url" className="text-label-lg text-text-muted">
            Lien vers l&apos;idée <span className="text-caption">(facultatif)</span>
          </label>
          <Field
            id="url"
            name="url"
            type="url"
            autoComplete="off"
            placeholder="https://exemple.fr/mon-idee"
            aria-describedby={state ? "form-error" : undefined}
          />
        </div>

        {state ? (
          <p id="form-error" role="alert" className="text-caption text-brand-red">
            {state.error}
          </p>
        ) : null}

        <SubmitButton />
      </form>
    </main>
  );
}