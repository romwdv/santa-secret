import { BottomNav } from "@/components/bottom-nav";
import { WishlistList } from "@/components/wishlist-list";
import { getSession, mockWishlist } from "@/lib/mock";

export default function WishlistPage() {
  return (
    <>
      <WishlistList user={getSession()} initialItems={mockWishlist} />
      <BottomNav />
    </>
  );
}