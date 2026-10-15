import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Santa — lien invalide",
};

export default function LienInvalidePage() {
  return (
    <main className="mx-auto flex w-full max-w-110 flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <h1 className="text-heading-md text-text-primary">Ce lien n&apos;est plus valable</h1>

      <p className="max-w-80 text-body-lg text-text-muted">
        Le lien est peut-être mal recopié, ou le participant a été retiré du
        Secret Santa. Demande un nouveau lien à l&apos;administrateur.
      </p>

      <Link href="/connexion" className="text-body-lg text-brand-red underline underline-offset-4">
        Retour à l&apos;accueil
      </Link>
    </main>
  );
}