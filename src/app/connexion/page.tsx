import type { Metadata } from "next";
import Link from "next/link";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";

export const metadata: Metadata = {
  title: "Santa — lien requis",
};

export default function ConnexionPage() {
  return (
    <main className="mx-auto flex w-full max-w-110 flex-1 flex-col items-center justify-center gap-6 px-6 text-center">
      <Avatar initials="?" size="lg" />

      <h1 className="text-heading-md text-text-primary">Accès réservé</h1>

      <p className="max-w-80 text-body-lg text-text-muted">
        Cette page est réservée aux participants du Secret Santa. Ouvre le lien
        que l&apos;administrateur t&apos;a envoyé pour y accéder.
      </p>

      <Button asChild className="mt-2">
        <Link href="/lien-invalide">J&apos;ai un lien</Link>
      </Button>
    </main>
  );
}