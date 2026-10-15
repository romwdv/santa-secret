import Link from "next/link";
import { Trash2 } from "lucide-react";
import type { WishlistItem } from "@/lib/types";

type CardProps = {
  item: WishlistItem;
  /** Absent = lecture seule (R8) : aucun contrôle de modification n'est rendu. */
  deleteAction?: (formData: FormData) => Promise<void>;
};

export function Card({ item, deleteAction }: CardProps) {
  return (
    <div
      data-slot="card"
      className="flex items-center gap-10 rounded-pill bg-bg-surface px-6 py-7 shadow-card"
    >
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-body-lg text-text-accent">{item.title}</span>
        {item.url ? (
          <Link
            href={item.url}
            target="_blank"
            rel="noreferrer noopener"
            className="truncate text-body-md text-brand-red underline-offset-4 hover:underline"
          >
            {item.url}
          </Link>
        ) : null}
      </div>

      {deleteAction ? (
        <form action={deleteAction} className="ml-auto">
          <input type="hidden" name="id" value={item.id} />
          <button
            type="submit"
            aria-label={`Supprimer ${item.title}`}
            title={`Supprimer ${item.title}`}
            className="inline-flex h-icon-md w-icon-md shrink-0 items-center justify-center rounded-sm bg-brand-red text-text-on-brand cursor-pointer transition-colors hover:bg-state-hover-red active:bg-state-pressed-red"
          >
            <Trash2 size={20} aria-hidden="true" />
          </button>
        </form>
      ) : null}
    </div>
  );
}