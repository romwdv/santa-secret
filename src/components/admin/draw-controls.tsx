"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/button";
import { openDraws, resetDraws } from "@/app/admin/actions";

function Submit({ label, tone }: { label: string; tone: "green" | "red" }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" tone={tone} size={tone === "green" ? "md" : "sm"} disabled={pending}>
      {pending ? "…" : label}
    </Button>
  );
}

type State = { ok: true; message?: string } | { ok: false; error: string } | null;

export function DrawControls({ participantCount }: { participantCount: number }) {
  const [open, openAction] = useActionState<State, FormData>(openDraws, null);
  const [reset, resetAction] = useActionState<State, FormData>(resetDraws, null);

  const feedback = open && !open.ok ? open.error : reset && !reset.ok ? reset.error : null;
  const success = open?.ok ? open.message : reset?.ok ? reset.message : null;

  return (
    <section className="mt-10 flex flex-col gap-6">
      <h2 className="text-heading-sm text-text-primary">Tirages</h2>

      <div className="flex flex-wrap items-center gap-6">
        <form action={openAction}>
          <Submit label="Ouvrir les tirages" tone="green" />
        </form>
        <form action={resetAction}>
          <Submit label="Réinitialiser les tirages" tone="red" />
        </form>
      </div>

      {feedback ? (
        <p role="alert" className="max-w-2xl text-body-lg text-brand-red">
          {feedback}
        </p>
      ) : null}

      {success ? (
        <p role="status" className="text-body-lg text-text-accent">
          {success}
        </p>
      ) : null}

      <p className="text-body-md text-text-muted">
        {participantCount < 2
          ? "Il faut au moins deux participants pour ouvrir un tirage."
          : "Réinitialiser remplace tous les tirages en cours. Les participants devront tirer à nouveau."}
      </p>
    </section>
  );
}