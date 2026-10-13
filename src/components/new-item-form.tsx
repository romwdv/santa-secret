"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { Field } from "@/components/field";
import type { Participant } from "@/lib/mock";

type NewItemFormProps = {
  user: Participant;
};

export function NewItemForm({ user }: NewItemFormProps) {
  const router = useRouter();
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");

  const titleInvalid = title.length > 0 && title.trim().length < 3;
  const urlInvalid = url.length > 0 && !/^https?:\/\//i.test(url);
  const canSubmit = title.trim().length >= 3 && /^https?:\/\//i.test(url);

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!canSubmit) return;
    router.push("/wishlist");
  }

  return (
    <main className="mx-auto flex w-full max-w-110 flex-1 flex-col px-6">
      <Avatar initials={user.initials} size="md" className="self-center" />

      <h1 className="mt-10 text-heading-md text-text-primary">
        Ajouter une idée à la whishlist
      </h1>

      <form onSubmit={onSubmit} noValidate className="mt-8 flex flex-col gap-8">
        <div className="flex flex-col gap-4">
          <label htmlFor="title" className="text-label-lg text-text-muted">
            Titre de l&apos;idée
          </label>
          <Field
            id="title"
            name="title"
            autoComplete="off"
            placeholder="Titre de l'idée"
            value={title}
            invalid={titleInvalid}
            aria-describedby={titleInvalid ? "title-error" : undefined}
            onChange={(e) => setTitle(e.target.value)}
          />
          {titleInvalid ? (
            <p id="title-error" className="text-caption text-brand-red">
              Le titre doit faire au moins 3 caractères.
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-4">
          <label htmlFor="url" className="text-label-lg text-text-muted">
            Lien vers l&apos;idée
          </label>
          <Field
            id="url"
            name="url"
            type="url"
            autoComplete="off"
            placeholder="Lien vers idée"
            value={url}
            invalid={urlInvalid}
            aria-describedby={urlInvalid ? "url-error" : undefined}
            onChange={(e) => setUrl(e.target.value)}
          />
          {urlInvalid ? (
            <p id="url-error" className="text-caption text-brand-red">
              Le lien doit commencer par http:// ou https://
            </p>
          ) : null}
        </div>

        <Button
          type="submit"
          disabled={!canSubmit}
          className="mt-4 w-full gap-5 text-heading-sm"
        >
          <Plus size={24} aria-hidden="true" />
          Valider
        </Button>
      </form>
    </main>
  );
}