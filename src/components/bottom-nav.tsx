"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Gift, List } from "lucide-react";
import { Button } from "@/components/button";
import { cn } from "@/lib/utils";

const links = [
  { href: "/tirage", label: "Mon tirage", Icon: Gift, tone: "green" },
  { href: "/wishlist", label: "Ma wishlist", Icon: List, tone: "red" },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 mt-auto bg-bg-canvas pt-8 pb-8">
      <ul className="flex justify-center gap-5">
        {links.map(({ href, label, Icon, tone }) => {
          const active = pathname === href;
          return (
            <li key={href}>
              <Button tone={tone} size="sm" asChild>
                <Link
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={cn("gap-5", active && "underline-offset-8")}
                >
                  <Icon size={24} aria-hidden="true" />
                  {label}
                </Link>
              </Button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}