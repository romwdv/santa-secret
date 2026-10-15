"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/button";
import { Field } from "@/components/field";
import { CopyLinkButton } from "@/components/admin/copy-link-button";
import { createParticipant, deleteParticipant } from "@/app/admin/actions";

function Submit({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "…" : label}
    </Button>
  );
}

export function AddParticipantForm() {
  const [state, formAction] = useActionState(createParticipant, null);

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-5">
      <div className="flex w-56 flex-col gap-4">
        <label htmlFor="np" className="text-label-lg text-text-muted">
          Prénom
        </label>
        <Field id="np" name="firstName" placeholder="Prénom" />
      </div>
      <div className="flex w-40 flex-col gap-4">
        <label htmlFor="ni" className="text-label-lg text-text-muted">
          Initiales
        </label>
        <Field id="ni" name="initials" placeholder="AL" maxLength={3} />
      </div>
      <Submit label="Ajouter" />
      {state && !state.ok ? (
        <p role="alert" className="text-caption text-brand-red">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

export function ParticipantRow({
  participantId,
  name,
  initials,
  link,
}: {
  participantId: string;
  name: string;
  initials: string;
  link: string;
}) {
  const [state, formAction] = useActionState(deleteParticipant, null);

  return (
    <li className="flex flex-wrap items-center gap-6 rounded-pill bg-bg-surface py-5 pl-6 pr-6 shadow-card">
      <span className="flex h-avatar-md w-avatar-md shrink-0 items-center justify-center rounded-full bg-brand-green text-avatar-md font-normal text-text-on-brand">
        {initials}
      </span>
      <span className="text-heading-sm text-text-primary">{name}</span>
      <code className="text-caption text-text-muted">{`https://santa.romwdv.fr${link}`}</code>

      <span className="ml-auto flex items-center gap-8">
        <CopyLinkButton value={`https://santa.romwdv.fr${link}`} />
        <form action={formAction} className="flex items-center gap-4">
          <input type="hidden" name="id" value={participantId} />
          <button
            type="submit"
            className="text-body-lg text-brand-red underline-offset-4 hover:underline cursor-pointer"
          >
            Supprimer
          </button>
          {state && !state.ok ? (
            <span role="alert" className="max-w-96 text-caption text-brand-red">
              {state.error}
            </span>
          ) : null}
        </form>
      </span>
    </li>
  );
}