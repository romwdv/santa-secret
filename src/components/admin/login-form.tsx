"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/button";
import { Field } from "@/components/field";
import { login } from "@/app/admin/session-actions";

function Submit() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending} className="w-full">
      {pending ? "Connexion…" : "Se connecter"}
    </Button>
  );
}

export function LoginForm() {
  const [error, formAction] = useActionState(login, null);

  return (
    <form action={formAction} className="flex flex-col gap-8">
      <div className="flex flex-col gap-4">
        <label htmlFor="email" className="text-label-lg text-text-muted">
          Email
        </label>
        <Field id="email" name="email" type="email" autoComplete="username" />
      </div>

      <div className="flex flex-col gap-4">
        <label htmlFor="password" className="text-label-lg text-text-muted">
          Mot de passe
        </label>
        <Field
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
        />
      </div>

      {error ? (
        <p role="alert" className="text-caption text-brand-red">
          {error}
        </p>
      ) : null}

      <Submit />
    </form>
  );
}