import Link from "next/link";
import { IconButton } from "@/components/icon-button";

export type WishlistItem = {
  id: string;
  title: string;
  url: string;
};

type CardProps = {
  item: WishlistItem;
  onDelete?: (id: string) => void;
};

export function Card({ item, onDelete }: CardProps) {
  return (
    <div
      data-slot="card"
      className="flex items-center gap-5 rounded-pill bg-bg-surface py-5 pl-5 pr-4 shadow-card"
    >
      <div className="flex min-w-0 flex-col">
        <span className="truncate text-body-lg text-text-accent">{item.title}</span>
        <Link
          href={item.url}
          target="_blank"
          rel="noreferrer noopener"
          className="truncate text-body-md text-brand-red underline-offset-4 hover:underline"
        >
          {item.url}
        </Link>
      </div>
      {onDelete ? (
        <IconButton
          label={`Supprimer ${item.title}`}
          className="ml-auto"
          onClick={() => onDelete(item.id)}
        />
      ) : null}
    </div>
  );
}