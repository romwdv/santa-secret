import Link from "next/link";
import { redirect } from "next/navigation";
import { getAdmin } from "@/lib/admin";
import { LoginForm } from "@/components/admin/login-form";

export default async function AdminLoginPage() {
  // Déjà connecté : inutile de repasser par le formulaire.
  if (await getAdmin()) redirect("/admin");

  return (
    <main className="mx-auto flex w-full max-w-110 flex-1 flex-col justify-center px-6 py-16">
      <h1 className="text-heading-md text-text-primary">Espace administrateur</h1>
      <p className="mt-2 text-body-lg text-text-muted">
        Réservé à l&apos;organisateur du Secret Santa.
      </p>

      <div className="mt-10 max-w-110">
        <LoginForm />
      </div>

      <div className="mt-16 border-t border-border-subtle pt-8">
        <p className="text-label-lg text-text-primary">Accès non lié à l&apos;application</p>
        <p className="mt-2 text-body-md text-text-muted">
          Ce lien n&apos;est accessible que par toi. Aucun participant ne peut le découvrir
          depuis l&apos;application.
        </p>
        <Link href="/" className="mt-4 inline-block text-body-lg text-brand-red underline underline-offset-4">
          Retour à l&apos;accueil
        </Link>
      </div>
    </main>
  );
}