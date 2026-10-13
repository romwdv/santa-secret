"use client";

import { cva } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const fieldVariants = cva(
  "w-full h-control-sm rounded-md bg-bg-surface px-5 text-body-lg text-text-primary placeholder:text-text-placeholder transition-colors focus:outline-none disabled:cursor-not-allowed disabled:text-state-disabled-text",
  {
    variants: {
      invalid: {
        true: "border-2 border-brand-red text-brand-red",
        false: "border-2 border-transparent focus:border-brand-green",
      },
    },
    defaultVariants: {
      invalid: false,
    },
  },
);

type FieldProps = Omit<ComponentProps<"input">, "className"> & {
  invalid?: boolean;
  className?: string;
};

export function Field({ className, invalid, ...props }: FieldProps) {
  return (
    <input
      data-slot="field"
      aria-invalid={invalid || undefined}
      className={cn(fieldVariants({ invalid }), className)}
      {...props}
    />
  );
}

export { fieldVariants };