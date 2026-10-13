import type { Metadata } from "next";
import { Sofia_Sans } from "next/font/google";
import "./globals.css";

const sofiaSans = Sofia_Sans({
  variable: "--font-sofia-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Santa",
  description: "Organise ton Secret Santa",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="fr" className={`${sofiaSans.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-bg-canvas text-text-primary font-sans">
        {children}
      </body>
    </html>
  );
}