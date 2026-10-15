import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

type BackLinkProps = {
  href?: string;
  className?: string;
};

export function BackLink({ href = "/", className }: BackLinkProps) {
  return (
    <Link
      href={href}
      className={cn(
        "inline-flex w-fit items-center gap-5 self-start text-body-lg text-brand-red underline-offset-4 hover:underline",
        className,
      )}
    >
      <ArrowLeft size={24} aria-hidden="true" />
      Retour à l&apos;accueil
    </Link>
  );
}