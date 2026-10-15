import { requireAdmin } from "@/lib/admin";
import { listDraws } from "@/app/admin/actions";

export default async function AdminDrawsPage() {
  await requireAdmin();
  const draws = await listDraws();

  return (
    <>
      <h1 className="text-display-md text-text-primary">Tirages</h1>
      <p className="mt-4 text-body-lg text-text-muted">
        Vérifie que personne ne s&apos;est tiré lui-même ni sa paire restreinte.
      </p>

      {draws.length === 0 ? (
        <p className="mt-10 text-body-lg text-text-muted">
          Aucun tirage pour le moment. Ouvre les tirages depuis la vue d&apos;ensemble.
        </p>
      ) : (
        <ul className="mt-10 flex flex-col gap-5">
          {draws.map((d) => (
            <li
              key={d.giver.id}
              className="flex flex-wrap items-center gap-5 rounded-md bg-bg-surface py-5 pl-6 pr-6 shadow-card"
            >
              <span className="flex h-avatar-md w-avatar-md items-center justify-center rounded-full bg-brand-green text-avatar-md font-normal text-text-on-brand">
                {d.giver.initials}
              </span>
              <span className="text-heading-sm text-text-primary">{d.giver.firstName}</span>
              <span className="text-heading-sm text-text-muted" aria-hidden="true">
                →
              </span>
              <span className="flex h-avatar-md w-avatar-md items-center justify-center rounded-full bg-brand-green text-avatar-md font-normal text-text-on-brand">
                {d.recipient.initials}
              </span>
              <span className="text-heading-sm text-text-accent">{d.recipient.firstName}</span>
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-body-md text-text-muted">
        Réinitialiser referme le tirage et efface les tirages en cours. Tu peux
        ensuite rouvrir : le nouveau tirage porte sur l&apos;ensemble des
        participants.
      </p>
    </>
  );
}