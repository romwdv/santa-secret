import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Santa — Administration",
  robots: { index: false, follow: false },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <div data-slot="admin" className="flex min-h-full flex-1 flex-col">
      {children}
    </div>
  );
}