import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { getAdmin } from "@/lib/admin";
import { logout } from "@/app/admin/session-actions";

const liens = [
  { href: "/admin", label: "Vue d'ensemble" },
  { href: "/admin/participants", label: "Participants" },
  { href: "/admin/restrictions", label: "Restrictions" },
  { href: "/admin/draws", label: "Tirages" },
];

export default async function AdminHome({ children }: { children: React.ReactNode }) {
  const admin = await getAdmin();
  // `/admin/login` reste accessible : c'est la seule page qui doit l'être.
  if (!admin) redirect("/admin/login");

  return (
    <>
      <header className="border-b border-border-subtle">
        <div className="mx-auto flex w-full max-w-200 flex-wrap items-center gap-8 px-8 py-6">
          <span className="text-heading-sm text-text-primary">Secret Santa</span>
          <nav aria-label="Administration" className="flex flex-wrap gap-5">
            {liens.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                className="text-body-lg text-text-accent underline-offset-4 hover:underline"
              >
                {l.label}
              </Link>
            ))}
          </nav>
          <div className="ml-auto flex items-center gap-5">
            <span className="text-caption text-text-muted">{admin.email}</span>
            <form action={logout}>
              <button
                type="submit"
                className="text-body-lg text-brand-red underline-offset-4 hover:underline cursor-pointer"
              >
                Déconnexion
              </button>
            </form>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-200 flex-1 px-8 py-10">{children as ReactNode}</div>
    </>
  );
}