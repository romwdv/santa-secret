import Link from "next/link";
import { notFound } from "next/navigation";
import { BackLink } from "@/components/back-link";
import { Avatar } from "@/components/avatar";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { getGiftDetails } from "@/app/actions";

type Context = { params: Promise<{ id: string }> };

/**
 * Wishlist de la personne tirée — lecture seule (R8).
 *
 * Aucun contrôle de modification n'est rendu ici : `Card` sans `deleteAction`
 * ne produit aucun formulaire. Le choix des idées appartient à leur propriétaire.
 */
export default async function GiftWishlistPage(ctx: Context) {
  const { id } = await ctx.params;
  const gift = await getGiftDetails(id);

  // Tirage absent, ou ce participant n'est pas celui du tirage : on ne dit rien
  // de plus que « introuvable » (R5).
  if (!gift) notFound();

  const { recipient, items } = gift;

  return (
    <main className="mx-auto flex w-full max-w-110 flex-1 flex-col px-6">
      <BackLink />

      <div className="mt-8 flex flex-col items-center gap-4 text-center">
        <Avatar initials={recipient.initials} size="lg" />
        <h1 className="text-heading-md text-text-primary">La wishlist de {recipient.firstName}</h1>
        <p className="text-body-lg text-text-muted">
        pour t&apos;aider à choisir son cadeau.
        </p>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Whishlist vide !"
          hint="Cette personne n'a pas encore ajouté d'idée."
          className="mt-8"
        />
      ) : (
        <ul className="mt-8 flex flex-col gap-10">
          {items.map((item) => (
            <li key={item.id}>
              <Card item={item} />
            </li>
          ))}
        </ul>
      )}

      <Link
        href="/tirage"
        className="mt-8 text-body-lg text-brand-red underline underline-offset-4"
      >
        Retour à mon tirage
      </Link>
    </main>
  );
}