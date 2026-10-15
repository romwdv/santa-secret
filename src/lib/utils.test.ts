import { describe, expect, it } from "vitest";
import { cn } from "@/lib/utils";

describe("cn", () => {
  it("conserve la taille ET la couleur de l'échelle Santa", () => {
    const result = cn(
      "bg-brand-green",
      "text-text-on-brand",
      "text-avatar-lg",
    );

    expect(result).toContain("text-text-on-brand");
    expect(result).toContain("text-avatar-lg");
  });

  it("conserve la taille ET la couleur d'un bouton", () => {
    const result = cn(
      "bg-state-default-green",
      "text-text-on-brand",
      "text-heading-sm",
    );

    expect(result).toContain("text-text-on-brand");
    expect(result).toContain("text-heading-sm");
  });

  it("laisse la dernière taille wins", () => {
    expect(cn("text-body-lg", "text-heading-md")).toBe("text-heading-md");
  });

  it("laisse la dernière couleur wins", () => {
    expect(cn("text-text-accent", "text-brand-red")).toBe("text-brand-red");
  });

  it("ne touche pas aux classes sans conflit", () => {
    expect(cn("flex items-center", "gap-5")).toBe("flex items-center gap-5");
  });
});