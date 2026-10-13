"use client";

import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-sm font-semibold cursor-pointer transition-colors disabled:cursor-not-allowed",
  {
    variants: {
      tone: {
        green: "bg-state-default-green text-text-on-brand hover:bg-state-hover-green active:bg-state-pressed-green disabled:bg-state-disabled-green disabled:text-text-on-brand-disabled",
        red: "bg-state-default-red text-text-on-brand hover:bg-state-hover-red active:bg-state-pressed-red disabled:bg-state-disabled-red disabled:text-text-on-brand-disabled",
      },
      size: {
        md: "h-control-md px-8 text-heading-sm",
        sm: "h-control-sm px-5 text-label-sm",
      },
    },
    defaultVariants: {
      tone: "green",
      size: "md",
    },
  },
);

type ButtonProps = ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean };

export function Button({
  className,
  tone,
  size,
  asChild = false,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ tone, size }), className)}
      {...props}
    />
  );
}

export { buttonVariants };