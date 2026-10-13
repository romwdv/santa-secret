"use client";

import type { ComponentProps } from "react";
import { Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type IconButtonProps = ComponentProps<"button"> & { label: string };

export function IconButton({ label, className, ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      data-slot="icon-button"
      className={cn(
        "inline-flex h-icon-md w-icon-md shrink-0 items-center justify-center rounded-sm bg-brand-red text-text-on-brand cursor-pointer transition-colors hover:bg-state-hover-red active:bg-state-pressed-red disabled:cursor-not-allowed disabled:bg-state-disabled-red disabled:text-text-on-brand-disabled",
        className,
      )}
      {...props}
    >
      <Trash2 size={20} aria-hidden="true" />
    </button>
  );
}