import { RestrictionForm } from "@/components/admin/restriction-form";
import { deleteRestriction, listParticipants, listRestrictions } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin";

type Props = { action: (formData: FormData) => Promise<void> };

function DeleteRestriction({
  aId,
  bId,
  action,
}: {
  aId: string;
  bId: string;
  action: Props["action"];
}) {
  return (
    <form action={action} className="ml-auto flex items-center gap-5">
      <input type="hidden" name="aId" value={aId} />
      <input type="hidden" name="bId" value={bId} />
      <button
        type="submit"
        className="text-body-lg text-brand-red underline-offset-4 hover:underline cursor-pointer"
      >
        Retirer
      </button>
    </form>
  );
}

export default async function AdminRestrictionsPage() {
  await requireAdmin();
  const [restrictions, participants] = await Promise.all([
    listRestrictions(),
    listParticipants(),
  ]);

  return (
    <>
      <h1 className="text-display-md text-text-primary">Restrictions de tirage</h1>
      <p className="mt-4 text-body-lg text-text-muted">
        Une restriction s&apos;applique dans les deux sens : A ne peut pas tirer B.
      </p>

      <section className="mt-10">
        <h2 className="text-heading-sm text-text-primary">Ajouter une restriction</h2>
        <div className="mt-6">
          <RestrictionForm participants={participants} />
        </div>
      </section>

      <h2 className="mt-10 text-heading-sm text-text-primary">
        Paires restreintes <span className="text-body-lg text-text-muted">{restrictions.length}</span>
      </h2>

      {restrictions.length === 0 ? (
        <p className="mt-6 text-body-lg text-text-muted">Aucune restriction configurée.</p>
      ) : (
        <ul className="mt-6 flex flex-col gap-5">
          {restrictions.map((r) => (
            <li
              key={`${r.aId}-${r.bId}`}
              className="flex flex-wrap items-center gap-5 rounded-md bg-bg-surface py-5 pl-6 pr-6 shadow-card"
            >
              <span className="text-heading-sm text-text-primary">{r.a.firstName}</span>
              <span className="text-body-lg text-text-muted">ne peut pas tirer</span>
              <span className="text-heading-sm text-text-primary">{r.b.firstName}</span>
              <DeleteRestriction aId={r.aId} bId={r.bId} action={deleteRestriction} />
            </li>
          ))}
        </ul>
      )}

      <p className="mt-8 text-body-md text-text-muted">
        La symétrie est garantie par la base : la paire est stockée triée.
        Si les restrictions rendent le tirage impossible, l&apos;ouverture le dira clairement.
      </p>
    </>
  );
}