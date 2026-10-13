import { Avatar } from "@/components/avatar";
import { BottomNav } from "@/components/bottom-nav";
import { getSession, mockDraw } from "@/lib/mock";

export default function TiragePage() {
  const user = getSession();

  return (
    <>
      <main className="mx-auto flex w-full max-w-110 flex-1 flex-col items-center justify-center px-6 text-center">
        <Avatar initials={user.initials} size="md" />

        <h1 className="mt-10 text-heading-md text-text-primary">Mon tirage</h1>
        <p className="mt-4 text-body-lg text-text-muted">
          Tu offres un cadeau à{" "}
          <span className="text-text-accent">{mockDraw.recipient.firstName}</span>
        </p>
      </main>

      <BottomNav />
    </>
  );
}