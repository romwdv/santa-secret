import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const avatarVariants = cva(
  "flex mb-20 shrink-0 items-center justify-center rounded-full bg-brand-green font-normal text-text-on-brand select-none",
  {
    variants: {
      size: {
        md: "h-avatar-md w-avatar-md text-avatar-md",
        lg: "h-avatar-lg w-avatar-lg text-avatar-lg",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

type AvatarProps = VariantProps<typeof avatarVariants> & {
  initials: string;
  className?: string;
};

export function Avatar({ initials, size, className }: AvatarProps) {
  return (
    <span data-slot="avatar" className={cn(avatarVariants({ size }), className)}>
      {initials}
    </span>
  );
}

export { avatarVariants };