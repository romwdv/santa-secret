import { AddParticipantForm, ParticipantRow } from "@/components/admin/participant-list";
import { getParticipantLink, listParticipants } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin";

export default async function AdminParticipantsPage() {
  await requireAdmin();
  const participants = await listParticipants();

  // Le lien est calculé côté serveur : le token ne transite jamais par un composant client.
  const rows = await Promise.all(
    participants.map(async (p) => ({
      ...p,
      link: await getParticipantLink(p.id),
    })),
  );

  return (
    <>
      <h1 className="text-display-md text-text-primary">
        Participants <span className="text-heading-md text-text-muted">{participants.length}</span>
      </h1>
      <p className="mt-4 text-body-lg text-text-muted">
        Chaque participant reçoit un lien unique de connexion.
      </p>

      <section className="mt-10">
        <h2 className="text-heading-sm text-text-primary">Ajouter un participant</h2>
        <div className="mt-6">
          <AddParticipantForm />
        </div>
      </section>

      <ul className="mt-10 flex flex-col gap-20">
        {rows.map((p) => (
          <ParticipantRow
            key={p.id}
            participantId={p.id}
            name={p.firstName}
            initials={p.initials}
            link={p.link}
          />
        ))}
      </ul>

      <p className="mt-8 text-body-md text-text-muted">
        La suppression est refusée si le participant a déjà donné ou reçu un tirage.
      </p>
    </>
  );
}