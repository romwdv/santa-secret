"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/button";
import { createRestriction } from "@/app/admin/actions";
import type { Participant } from "@/lib/types";

const selectClass =
  "h-control-sm rounded-md border-2 border-transparent bg-bg-surface px-5 text-body-lg text-text-primary focus:border-brand-green focus:outline-none";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" size="sm" disabled={pending}>
      {pending ? "…" : "Ajouter"}
    </Button>
  );
}

export function RestrictionForm({ participants }: { participants: Participant[] }) {
  const [state, formAction] = useActionState(createRestriction, null);
  const options = participants.map((p) => (
    <option key={p.id} value={p.id}>
      {p.firstName} ({p.initials})
    </option>
  ));

  return (
    <form action={formAction} className="flex flex-wrap items-end gap-5">
      <div className="flex w-56 flex-col gap-4">
        <label htmlFor="ra" className="text-label-lg text-text-muted">
          Premier participant
        </label>
        <select id="ra" name="aId" className={selectClass} defaultValue="">
          <option value="" disabled>
            Choisir…
          </option>
          {options}
        </select>
      </div>

      <div className="flex w-56 flex-col gap-4">
        <label htmlFor="rb" className="text-label-lg text-text-muted">
          Second participant
        </label>
        <select id="rb" name="bId" className={selectClass} defaultValue="">
          <option value="" disabled>
            Choisir…
          </option>
          {options}
        </select>
      </div>

      <Submit />

      {state && !state.ok ? (
        <p role="alert" className="text-caption text-brand-red">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}