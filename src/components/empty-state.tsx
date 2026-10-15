import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type EmptyStateProps = {
  title: string;
  hint?: string;
  children?: ReactNode;
  className?: string;
};

export function EmptyState({ title, hint, children, className }: EmptyStateProps) {
  return (
    <div
      data-slot="empty-state"
      className={cn(
        "flex flex-col items-center gap-4 rounded-md border-2 border-dashed bg-bg-canvas px-5 py-6 text-center",
        className,
      )}
    >
      <p className="text-heading-md text-text-muted">{title}</p>
      {hint ? <p className="text-body-lg text-text-muted">{hint}</p> : null}
      {children}
    </div>
  );
}