import { describe, expect, it } from "vitest";
import { computeDraw, validateAssignments } from "@/lib/draw";

const people = (...names: string[]) => names.map((n) => ({ id: n }));
const rng = () => 0.42;

describe("computeDraw", () => {
  it("refuse moins de deux participants", () => {
    expect(computeDraw([], [], rng).ok).toBe(false);
    expect(computeDraw(people("a"), [], rng).ok).toBe(false);
  });

  it("produit un couplage parfait", () => {
    const participants = people("a", "b", "c", "d", "e", "f");
    const result = computeDraw(participants, [], rng);

    expect(result.ok).toBe(true);
    if (!result.ok) return;

    const givers = result.assignments.map((a) => a.giverId);
    const recipients = result.assignments.map((a) => a.recipientId);

    expect(new Set(givers).size).toBe(participants.length);
    expect(new Set(recipients).size).toBe(participants.length);
    expect(givers.sort()).toEqual(recipients.sort());
  });

  it("n'autorise jamais l'auto-tirage", () => {
    const participants = people("a", "b", "c", "d", "e");
    for (let seed = 0; seed < 40; seed++) {
      const result = computeDraw(participants, [], () => (seed * 7919 % 1000) / 1000);
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      for (const a of result.assignments) expect(a.giverId).not.toBe(a.recipientId);
    }
  });

  it("respecte une restriction (R4)", () => {
    const participants = people("a", "b", "c", "d");
    for (let seed = 0; seed < 40; seed++) {
      const result = computeDraw(participants, [{ aId: "a", bId: "b" }], () =>
        (seed * 104729 % 997) / 997,
      );
      expect(result.ok).toBe(true);
      if (!result.ok) return;
      for (const x of result.assignments) {
        const forbidden = (x.giverId === "a" && x.recipientId === "b") ||
          (x.giverId === "b" && x.recipientId === "a");
        expect(forbidden).toBe(false);
      }
    }
  });

  it("respecte une restriction dans les deux sens", () => {
    const participants = people("a", "b", "c", "d", "e", "f");
    const result = computeDraw(participants, [{ aId: "a", bId: "b" }], rng);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const draw = (g: string) => result.assignments.find((x) => x.giverId === g)?.recipientId;
    expect(draw("a")).not.toBe("b");
    expect(draw("b")).not.toBe("a");
  });

  it("échoue et nomme les participants bloqués si c'est impossible", () => {
    // 3 personnes restrictions circulaires : a-b, b-c, c-a → chacun ne peut
    // donner qu'à un seul, ce qui force une permutation circulaire valide.
    // 2 personnes : a et b ne peuvent ni se donner à eux-mêmes ni l'un à l'autre.
    const result = computeDraw(people("a", "b"), [{ aId: "a", bId: "b" }], rng);

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toContain("Aucune affectation possible");
    expect(result.blocked.length).toBeGreaterThan(0);
  });

  it("trouve le couplage même quand les restrictions semblent serrées", () => {
    // a-b, b-c, c-d, d-a : il existe bel et bien une solution
    // (a→c, b→d, c→a, d→b). Écrire le contraire serait un faux test.
    const result = computeDraw(
      people("a", "b", "c", "d"),
      [
        { aId: "a", bId: "b" },
        { aId: "b", bId: "c" },
        { aId: "c", bId: "d" },
        { aId: "d", bId: "a" },
      ],
      rng,
    );

    expect(result.ok).toBe(true);
  });

  it("échoue quand un participant n'a plus personne à qui donner", () => {
    // `a` est restreint avec les trois autres : plus personne à qui donner.
    const result = computeDraw(
      people("a", "b", "c", "d"),
      [
        { aId: "a", bId: "b" },
        { aId: "a", bId: "c" },
        { aId: "a", bId: "d" },
      ],
      rng,
    );

    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.blocked).toContain("a");
  });

  it("gère un cas à taille réelle", () => {
    const participants = Array.from({ length: 30 }, (_, i) => ({ id: `p${i}` }));
    const restrictions = [
      { aId: "p0", bId: "p1" },
      { aId: "p2", bId: "p3" },
      { aId: "p4", bId: "p5" },
    ];
    const result = computeDraw(participants, restrictions, rng);

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(validateAssignments(result.assignments, participants, restrictions)).toBeNull();
  });
});

describe("validateAssignments", () => {
  const participants = people("a", "b", "c");

  it("accepte un couplage valide", () => {
    expect(
      validateAssignments(
        [
          { giverId: "a", recipientId: "b" },
          { giverId: "b", recipientId: "c" },
          { giverId: "c", recipientId: "a" },
        ],
        participants,
        [],
      ),
    ).toBeNull();
  });

  it("refuse un destinataire en double (R2)", () => {
    // Pas d'auto-tirage dans les données : le seul défaut est bien le doublon.
    const quatre = people("a", "b", "c", "d");
    expect(
      validateAssignments(
        [
          { giverId: "a", recipientId: "c" },
          { giverId: "b", recipientId: "c" },
          { giverId: "c", recipientId: "a" },
          { giverId: "d", recipientId: "b" },
        ],
        quatre,
        [],
      ),
    ).toMatch(/Destinataire en double/);
  });

  it("refuse l'auto-tirage", () => {
    expect(
      validateAssignments(
        [
          { giverId: "a", recipientId: "a" },
          { giverId: "b", recipientId: "c" },
          { giverId: "c", recipientId: "b" },
        ],
        participants,
        [],
      ),
    ).toMatch(/Auto-tirage/);
  });

  it("refuse une affectation incomplète", () => {
    expect(
      validateAssignments([{ giverId: "a", recipientId: "b" }], participants, []),
    ).toMatch(/incomplète/);
  });

  it("refuse une paire restreinte", () => {
    expect(
      validateAssignments(
        [
          { giverId: "a", recipientId: "b" },
          { giverId: "b", recipientId: "c" },
          { giverId: "c", recipientId: "a" },
        ],
        participants,
        [{ aId: "a", bId: "b" }],
      ),
    ).toMatch(/paire restreinte/);
  });
});