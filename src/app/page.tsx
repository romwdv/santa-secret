import { Avatar } from "@/components/avatar";
import { BottomNav } from "@/components/bottom-nav";
import { getSession } from "@/lib/mock";

export default function IndexPage() {
  const user = getSession();

  return (
    <>
      <main className="mx-auto flex w-full max-w-110 flex-1 flex-col items-center justify-center px-6 text-center">
        <Avatar initials={user.initials} size="lg" />

        <h1 className="mt-12 text-display-md text-text-primary">
          Bonjour {user.firstName} !
        </h1>
        <p className="mt-4 text-body-lg text-text-primary">
          bienvenue sur ton secret santa
        </p>
      </main>

      <BottomNav />
    </>
  );
}