import Link from "next/link";
import { requireAdmin } from "@/lib/admin";
import {
  countWishlistItems,
  isDrawOpenForAdmin,
  listDraws,
  listParticipants,
  listRestrictions,
} from "@/app/admin/actions";
import { DrawControls } from "@/components/admin/draw-controls";
import { WishlistPurge } from "@/components/admin/wishlist-purge";

export default async function AdminHomePage() {
  await requireAdmin();
  const [participants, restrictions, draws, drawOpen, wishlistCount] = await Promise.all([
    listParticipants(),
    listRestrictions(),
    listDraws(),
    isDrawOpenForAdmin(),
    countWishlistItems(),
  ]);

  const sections = [
    { href: "/admin/participants", label: "Participants", count: participants.length },
    { href: "/admin/restrictions", label: "Restrictions", count: restrictions.length },
    { href: "/admin/draws", label: "Tirages", count: draws.length },
  ];

  return (
    <>
      <h1 className="text-display-md text-text-primary">Secret Santa</h1>

      <section className="mt-8 flex flex-wrap gap-8 rounded-md bg-bg-surface py-6 pl-8 pr-8 shadow-card">
        <div className="flex flex-col gap-2">
          <span className="text-label-lg text-text-muted">Statut du tirage</span>
          <span
            className={`text-heading-md font-semibold ${
              drawOpen ? "text-text-accent" : "text-text-primary"
            }`}
          >
            {drawOpen ? "Tirages ouverts" : "Tirages fermés"}
          </span>
          <span className="text-body-md text-text-muted">
            {drawOpen
              ? "Les participants voient qui ils ont tiré."
              : "Les participants ne peuvent pas encore tirer."}
          </span>
        </div>
      </section>

      <DrawControls participantCount={participants.length} />

      <WishlistPurge itemCount={wishlistCount} />

      <div className="mt-10 flex flex-wrap gap-5">
        {sections.map((s) => (
          <Link
            key={s.href}
            href={s.href}
            className="flex items-center gap-5 rounded-md bg-bg-surface px-8 py-6 shadow-card"
          >
            <span className="text-heading-sm text-text-accent">{s.label}</span>
            <span className="text-heading-md font-semibold text-text-primary">{s.count}</span>
          </Link>
        ))}
      </div>
    </>
  );
}