import Link from "next/link";
import { ArrowLeft, Plus } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { deleteWishlistItem, getMyWishlist } from "@/app/actions";
import { requireParticipant } from "@/lib/participant";

export default async function WishlistPage() {
  const user = await requireParticipant();
  const items = await getMyWishlist();

  return (
    <>
      <main className="mx-auto flex w-full max-w-110 flex-1 flex-col px-6">
        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          <Avatar initials={user.initials} size="md" />
          <h1 className="mb-20 text-heading-md text-text-primary">Ma wishlist</h1>

        </div>

        {items.length === 0 ? (
          <EmptyState
            title="Whishlist vide !"
            hint="Ajoute une idée pour commencer"
            className="mt-8"
          />
        ) : (
          <ul className="mb-15 mt-8 flex flex-col gap-20">
            {items.map((item) => (
              <li key={item.id}>
                <Card item={item} deleteAction={deleteWishlistItem} />
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8 flex flex-col gap-13">
          <Button asChild className="w-full gap-5">
            <Link href="/wishlist/nouveau">
              <Plus size={24} aria-hidden="true" />
              Ajouter une idée
            </Link>
          </Button>

          <Button asChild tone="neutral" size="md" className="w-full gap-5">
            <Link href="/">
              <ArrowLeft size={24} aria-hidden="true" />
              Retour à l&apos;accueil
            </Link>
          </Button>
        </div>
      </main>
    </>
  );
}