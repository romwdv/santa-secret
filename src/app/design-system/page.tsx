import { Avatar } from "@/components/avatar";
import { Button } from "@/components/button";
import { Card } from "@/components/card";
import { EmptyState } from "@/components/empty-state";
import { Field } from "@/components/field";
import { IconButton } from "@/components/icon-button";
import { deleteWishlistItem } from "@/app/actions";

const tones = [
  { tone: "green", label: "Green" },
  { tone: "red", label: "Red" },
] as const;

const sizes = [
  { size: "md", label: "MD" },
  { size: "sm", label: "SM" },
] as const;

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="flex flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h2 className="text-heading-sm text-text-primary">{title}</h2>
        {description ? (
          <p className="text-caption text-text-muted">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

export default function DesignSystemPage() {
  return (
    <main className="mx-auto flex w-full max-w-160 flex-col gap-16 px-8 py-16">
      <header className="flex flex-col gap-2">
        <h1 className="text-display-md text-text-primary">Design system Santa</h1>
        <p className="text-body-lg text-text-muted">
          Rendu des primitives alimenté par les tokens Penpot.
        </p>
      </header>

      <Section
        title="Button"
        description="Axes Penpot : Tone × Size. Les états Default / Hover / Pressed / Disabled sont des états d'interaction, pas des props."
      >
        <div className="flex flex-col gap-8">
          {tones.map(({ tone, label }) => (
            <div key={tone} className="flex flex-col gap-4">
              <p className="text-caption text-text-muted">Tone {label}</p>
              <div className="flex flex-wrap items-center gap-5">
                {sizes.map(({ size, label: sizeLabel }) => (
                  <Button key={size} tone={tone} size={size}>
                    {sizeLabel}
                  </Button>
                ))}
                <Button tone={tone} size="md" disabled>
                  Disabled
                </Button>
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section
        title="Field"
        description="État Focus sur interaction clavier, Filled dès qu'une valeur est saisie, Error via aria-invalid."
      >
        <div className="flex flex-col gap-5">
          <Field id="ds-default" placeholder="Titre de l'idée" />
          <Field id="ds-filled" defaultValue="Bougie senteur" />
          <Field
            id="ds-error"
            defaultValue="Ce titre est déjà utilisé"
            invalid
            aria-describedby="ds-error-msg"
          />
          <p id="ds-error-msg" className="text-caption text-brand-red">
            Message d&apos;erreur.
          </p>
        </div>
      </Section>

      <Section title="Avatar" description="Axe Penpot : Size.">
        <div className="flex items-end gap-8">
          <Avatar initials="FS" size="md" />
          <Avatar initials="FS" size="lg" />
        </div>
      </Section>

      <Section title="Card" description="Avec suppression, lien présent (gauche) ou absent (droite).">
        <div className="flex flex-col gap-5">
          <Card
            item={{
              id: "ds",
              participantId: "ds",
              title: "Bougie senteur",
              url: "http://mabougie.com",
            }}
            deleteAction={deleteWishlistItem}
          />
          <Card
            item={{
              id: "ds2",
              participantId: "ds",
              title: "Un livre de cuisine",
              url: null,
            }}
            deleteAction={deleteWishlistItem}
          />
        </div>
      </Section>

      <Section title="IconButton">
        <IconButton label="Supprimer Bougie senteur" />
      </Section>

      <Section title="EmptyState">
        <EmptyState
          title="Whishlist vide !"
          hint="Ajoute une idée pour commencer"
        />
      </Section>
    </main>
  );
}