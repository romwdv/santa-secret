import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Avatar } from "@/components/avatar";
import { BottomNav } from "@/components/bottom-nav";
import { Button } from "@/components/button";
import { EmptyState } from "@/components/empty-state";
import { isDrawOpen, getMyDrawRecipient } from "@/app/actions";

export default async function TiragePage() {
  const [drawOpen, recipient] = await Promise.all([
    isDrawOpen(),
    getMyDrawRecipient(),
  ]);

  return (
    <>
      <main className="mx-auto flex justify-center
 w-full max-w-110 flex-1 flex-col px-6">
        <div className="mt-8 flex flex-col items-center gap-4 text-center">
          <Avatar initials="?" size="md" />
          <h1 className="text-heading-md text-text-primary">Mon tirage</h1>
        </div>

        <div className="mt-8 mb-10">
          {!drawOpen ? (
            <EmptyState
              title="Le tirage n'est pas encore ouvert"
              hint="L'administrateur doit l'ouvrir avant que tu puisses tirer."
            />
          ) : !recipient ? (
            <EmptyState
              title="Tu n'as pas encore tiré"
              hint="Reviens ici une fois le tirage ouvert."
            />
          ) : (
            <>
              <p className="text-2xl text-text-muted text-center">
                Tu offriras un cadeau à{" "}
                <span className="text-text-accent">{recipient.firstName}</span>
              </p>

              <ul className="mt-6 flex flex-col gap-5">
                <li>
                  <CardPreview participantId={recipient.id} firstName={recipient.firstName} />
                </li>
              </ul>
            </>
          )}
        </div>

        <Button asChild tone="neutral" size="md" className="mt-8 w-full gap-5">
          <Link href="/">
            <ArrowLeft size={24} aria-hidden="true" />
            Retour à l&apos;accueil
          </Link>
        </Button>
      </main>

    </>
  );
}

async function CardPreview(props: { participantId: string; firstName: string }) {
  return (
    <Button asChild className="w-full">
      <Link href={`/wishlist/${props.participantId}`}>
        Voir la wishlist de {props.firstName}
      </Link>
    </Button>
  );
}