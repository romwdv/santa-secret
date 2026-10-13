import { NewItemForm } from "@/components/new-item-form";
import { getSession } from "@/lib/mock";

export default function NewWishlistItemPage() {
  return <NewItemForm user={getSession()} />;
}