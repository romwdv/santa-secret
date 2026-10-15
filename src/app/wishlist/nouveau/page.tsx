import { NewItemForm } from "@/components/new-item-form";
import { requireParticipant } from "@/lib/participant";

export default async function NewWishlistItemPage() {
  const user = await requireParticipant();
  return <NewItemForm user={user} />;
}