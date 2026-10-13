"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import type { WishlistItem } from "@/components/card";
import type { Participant } from "@/lib/mock";

type WishlistListProps = {
  user: Participant;
  initialItems: WishlistItem[];
};

export function WishlistList({ user, initialItems }: WishlistListProps) {
  const [items, setItems] = useState(initialItems);

  return (
    <>
      <main className="mx-auto flex w-full max-w-110 flex-1 flex-col px-6">
        <Avatar initials={user.initials} size="md" className="self-center" />

        <h1 className="mt-10 text-heading-md text-text-primary">Ma wishlist</h1>

        {items.length === 0 ? (
          <EmptyState
            title="Whishlist vide !"
            hint="Ajoute une idée pour commencer"
            className="mt-8"
          />
        ) : (
          <ul className="mt-8 flex flex-col gap-5">
            {items.map((item) => (
              <li key={item.id}>
                <Card
                  item={item}
                  onDelete={(id) =>
                    setItems((prev) => prev.filter((i) => i.id !== id))
                  }
                />
              </li>
            ))}
          </ul>
        )}

        <Button asChild className="mt-8 w-full gap-5">
          <Link href="/wishlist/nouveau">
            <Plus size={24} aria-hidden="true" />
            Ajouter une idée
          </Link>
        </Button>
      </main>
    </>
  );
}