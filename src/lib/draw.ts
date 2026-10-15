export type ParticipantRef = { id: string };
export type RestrictionPair = { aId: string; bId: string };
export type Assignment = { giverId: string; recipientId: string };

export type DrawSuccess = { ok: true; assignments: Assignment[] };
export type DrawFailure = { ok: false; reason: string; blocked: string[] };

export type DrawResult = DrawSuccess | DrawFailure;

/**
 * Calcule un couplage parfait : chacun donne à quelqu'un, chacun reçoit de
 * quelqu'un, sans auto-tirage (R3) et sans paire restreinte (R4).
 *
 * Backtracking aléatoire avec *forward checking* : après chaque affectation on
 * vérifie qu'il reste au moins un destinataire possible pour chaque donneur
 * restant. Cela élague très tôt et rend le calcul instantané à l'échelle d'une
 * famille — de l'ordre de la milliseconde pour 30 participants.
 *
 * L'algorithme ne fait aucune écriture : la persistance est confiée à la
 * fonction transactionnelle `santa.open_draw`, qui rejette en base toute
 * affectation qui violerait une contrainte.
 */
export function computeDraw(
  participants: ParticipantRef[],
  restrictions: RestrictionPair[],
  random: () => number = Math.random,
): DrawResult {
  const ids = participants.map((p) => p.id);

  if (ids.length < 2) {
    return {
      ok: false,
      reason: "Un Secret Santa nécessite au moins deux participants.",
      blocked: ids,
    };
  }

  const index = new Map(ids.map((id, i) => [id, i]));
  const pair = (i: number, j: number) => (i < j ? `${i}|${j}` : `${j}|${i}`);

  const forbidden = new Set<string>();
  for (const r of restrictions) {
    const i = index.get(r.aId);
    const j = index.get(r.bId);
    if (i === undefined || j === undefined || i === j) continue;
    forbidden.add(pair(i, j));
  }

  const n = ids.length;
  const remaining = new Array<boolean>(n).fill(true);
  const recipientOf = new Array<number>(n).fill(-1);

  function candidatesFor(giver: number): number[] {
    const out: number[] = [];
    for (let j = 0; j < n; j++) {
      if (!remaining[j]) continue; // déjà attribué (R2)
      if (j === giver) continue; // auto-tirage (R3)
      if (forbidden.has(pair(giver, j))) continue; // restriction (R4)
      out.push(j);
    }
    return out;
  }

  // Les donneurs les plus contraints d'abord : élague plus tôt.
  const order = [...ids.keys()].sort(
    (a, b) => candidatesFor(a).length - candidatesFor(b).length,
  );

  function shuffle(list: number[]): number[] {
    const out = [...list];
    for (let i = out.length - 1; i > 0; i--) {
      const j = Math.floor(random() * (i + 1));
      [out[i], out[j]] = [out[j], out[i]];
    }
    return out;
  }

  function isDeadEnd(from: number): boolean {
    for (let k = from; k < order.length; k++) {
      if (candidatesFor(order[k]).length === 0) return true;
    }
    return false;
  }

  function solve(step: number): boolean {
    if (step === order.length) return true;
    const giver = order[step];

    for (const recipient of shuffle(candidatesFor(giver))) {
      remaining[recipient] = false;
      recipientOf[giver] = recipient;

      if (!isDeadEnd(step + 1) && solve(step + 1)) return true;

      remaining[recipient] = true;
      recipientOf[giver] = -1;
    }
    return false;
  }

  if (!solve(0)) {
    const blocked = order
      .filter((i) => candidatesFor(i).length === 0)
      .map((i) => ids[i]);
    return {
      ok: false,
      reason:
        "Aucune affectation possible avec les restrictions actuelles. " +
        "Assouplis les restrictions pour pouvoir ouvrir le tirage.",
      blocked: blocked.length > 0 ? blocked : ids,
    };
  }

  return {
    ok: true,
    assignments: ids.map((giverId, i) => ({ giverId, recipientId: ids[recipientOf[i]] })),
  };
}

/** Un tirage doit être un couplage parfait : vérifié avant écriture. */
export function validateAssignments(
  assignments: Assignment[],
  participants: ParticipantRef[],
  restrictions: RestrictionPair[],
): string | null {
  const ids = new Set(participants.map((p) => p.id));
  const givers = new Set<string>();
  const recipients = new Set<string>();

  for (const a of assignments) {
    if (!ids.has(a.giverId)) return `Donneur inconnu : ${a.giverId}`;
    if (!ids.has(a.recipientId)) return `Destinataire inconnu : ${a.recipientId}`;
    if (a.giverId === a.recipientId) return "Auto-tirage détecté.";
    if (givers.has(a.giverId)) return `Donneur en double : ${a.giverId}`;
    if (recipients.has(a.recipientId)) return `Destinataire en double : ${a.recipientId}`;
    givers.add(a.giverId);
    recipients.add(a.recipientId);
  }

  if (givers.size !== ids.size) {
    return `Affectation incomplète : ${givers.size} donneur(s) pour ${ids.size} participant(s).`;
  }

  for (const r of restrictions) {
    const hit = assignments.some(
      (a) =>
        (a.giverId === r.aId && a.recipientId === r.bId) ||
        (a.giverId === r.bId && a.recipientId === r.aId),
    );
    if (hit) return "Une paire restreinte a été tirée.";
  }

  return null;
}