"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/admin";
import { generateToken } from "@/lib/participant";
import { computeDraw, validateAssignments } from "@/lib/draw";
import { createServerClient } from "@/lib/supabase/server";
import type { Participant } from "@/lib/types";

export type AdminResult = { ok: true; message?: string } | { ok: false; error: string };

function fd(formData: FormData, key: string): string {
  return String(formData.get(key) ?? "").trim();
}

// ── Participants ────────────────────────────────────────────────────────────

export async function listParticipants(): Promise<Participant[]> {
  await requireAdmin();
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("participants")
    .select("id, first_name, initials")
    .order("first_name", { ascending: true });

  if (error) throw new Error(`Lecture des participants impossible : ${error.message}`);
  return (data ?? []).map((r) => ({ id: r.id, firstName: r.first_name, initials: r.initials }));
}

/** Le lien de connexion d'un participant — jamais exposé aux participants eux-mêmes. */
export async function getParticipantLink(participantId: string): Promise<string> {
  await requireAdmin();
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("participants")
    .select("token")
    .eq("id", participantId)
    .single();

  if (error || !data) throw new Error("Participant introuvable.");
  return `/j/${data.token}`;
}

export async function createParticipant(
  _previous: AdminResult | null,
  formData: FormData,
): Promise<AdminResult> {
  await requireAdmin();

  const firstName = fd(formData, "firstName");
  const initials = fd(formData, "initials").toUpperCase();

  if (!firstName) return { ok: false, error: "Le prénom est obligatoire." };
  if (initials.length < 1 || initials.length > 3) {
    return { ok: false, error: "Les initiales doivent faire 1 à 3 caractères." };
  }

  const supabase = createServerClient();
  const { error } = await supabase.from("participants").insert({
    first_name: firstName,
    initials,
    token: generateToken(),
  });

  if (error) return { ok: false, error: "Le participant n'a pas pu être créé." };

  revalidatePath("/admin/participants");
  return { ok: true };
}

/**
 * Suppression d'un participant.
 *
 * Refusée s'il a déjà donné ou reçu un tirage dans le lot courant : le retirer
 * casserait la bijectivité (R2) et laisserait un participant sans contrepartie.
 * L'admin doit d'abord réinitialiser.
 */
export async function deleteParticipant(
  _previous: AdminResult | null,
  formData: FormData,
): Promise<AdminResult> {
  await requireAdmin();
  const id = fd(formData, "id");
  if (!id) return { ok: false, error: "Identifiant manquant." };

  const supabase = createServerClient();
  const { data: drawn, error: rpcError } = await supabase.rpc("participant_is_drawn", {
    p_participant_id: id,
  });

  if (rpcError) {
    return { ok: false, error: "Vérification impossible, suppression refusée par sécurité." };
  }
  if (drawn === true) {
    return {
      ok: false,
      error:
        "Ce participant a déjà donné ou reçu un tirage. Réinitialise les tirages avant de le supprimer.",
    };
  }

  const { error } = await supabase.from("participants").delete().eq("id", id);
  if (error) return { ok: false, error: "La suppression a échoué." };

  revalidatePath("/admin/participants");
  revalidatePath("/admin");
  return { ok: true };
}

// ── Restrictions ────────────────────────────────────────────────────────────

export async function listRestrictions(): Promise<
  { aId: string; bId: string; a: Participant; b: Participant }[]
> {
  await requireAdmin();
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("restrictions")
    .select("a_id, b_id, a:participants!restrictions_a_id_fkey(id, first_name, initials), b:participants!restrictions_b_id_fkey(id, first_name, initials)")
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Lecture des restrictions impossible : ${error.message}`);

  return (data ?? []).map((r) => ({
    aId: r.a_id,
    bId: r.b_id,
    a: toParticipant(r.a),
    b: toParticipant(r.b),
  }));
}

type Row = { id: string; first_name: string; initials: string };

/** Les jointures PostgREST renvoient un tableau à un élément ou un objet selon la cardinalité. */
function toParticipant(row: Row | Row[] | null): Participant {
  const one = (Array.isArray(row) ? row[0] : row) ?? {
    id: "",
    first_name: "",
    initials: "",
  };
  return { id: one.id, firstName: one.first_name, initials: one.initials };
}

export async function createRestriction(
  _previous: AdminResult | null,
  formData: FormData,
): Promise<AdminResult> {
  await requireAdmin();
  const aId = fd(formData, "aId");
  const bId = fd(formData, "bId");

  if (!aId || !bId) return { ok: false, error: "Les deux participants sont obligatoires." };
  if (aId === bId) return { ok: false, error: "Un participant ne peut pas se restreindre lui-même." };

  const supabase = createServerClient();
  // Tri canonique : la contrainte `a_id < b_id` rend la paire symétrique par
  // construction. Invalider l'ordre ici ferait échouer l'insertion.
  const [a, b] = aId < bId ? [aId, bId] : [bId, aId];

  const { error } = await supabase.from("restrictions").insert({ a_id: a, b_id: b });
  if (error) return { ok: false, error: "Cette restriction existe déjà." };

  revalidatePath("/admin/restrictions");
  return { ok: true };
}

export async function deleteRestriction(formData: FormData): Promise<void> {
  await requireAdmin();
  const aId = fd(formData, "aId");
  const bId = fd(formData, "bId");
  if (!aId || !bId) throw new Error("Paire incomplète.");

  const supabase = createServerClient();
  const [a, b] = aId < bId ? [aId, bId] : [bId, aId];

  const { error } = await supabase.from("restrictions").delete().eq("a_id", a).eq("b_id", b);
  if (error) throw new Error("La suppression a échoué.");

  revalidatePath("/admin/restrictions");
}

// ── Tirages ─────────────────────────────────────────────────────────────────

export type DrawRow = { giver: Participant; recipient: Participant };

export async function listDraws(): Promise<DrawRow[]> {
  await requireAdmin();
  const supabase = createServerClient();

  const { data: settings, error: settingsError } = await supabase
    .from("app_settings")
    .select("batch")
    .eq("id", 1)
    .single();

  if (settingsError) throw new Error(`Lecture de la configuration impossible : ${settingsError.message}`);

  const { data, error } = await supabase
    .from("draws")
    .select("giver:participants!draws_giver_id_fkey(id, first_name, initials), recipient:participants!draws_recipient_id_fkey(id, first_name, initials)")
    .eq("batch", settings.batch)
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Lecture des tirages impossible : ${error.message}`);

  return (data ?? []).map((r) => ({
    giver: toParticipant(r.giver),
    recipient: toParticipant(r.recipient),
  }));
}

/**
 * Ouvre les tirages : calcule un couplage puis l'écrit en une transaction.
 *
 * `santa.open_draw` verrouille la ligne de configuration, vérifie la
 * cardinalité et l'auto-tirage, rejette toute paire restreinte, et s'appuie sur
 * les unicités `(batch, giver)` et `(batch, recipient)` pour garantir R1 et R2.
 */
export async function openDraws(
  _previous: AdminResult | null,
  _formData: FormData,
): Promise<AdminResult> {
  await requireAdmin();
  const supabase = createServerClient();

  const [{ data: participants, error: pError }, { data: restrictions, error: rError }] =
    await Promise.all([
      supabase.from("participants").select("id"),
      supabase.from("restrictions").select("a_id, b_id"),
    ]);

  if (pError || rError) return { ok: false, error: "Lecture de la configuration impossible." };

  const result = computeDraw(
    (participants ?? []).map((p) => ({ id: p.id })),
    (restrictions ?? []).map((r) => ({ aId: r.a_id, bId: r.b_id })),
  );

  if (!result.ok) {
    const noms = result.blocked.length
      ? ` Participants concernés : ${result.blocked.length}.`
      : "";
    return { ok: false, error: result.reason + noms };
  }

  const invalid = validateAssignments(
    result.assignments,
    (participants ?? []).map((p) => ({ id: p.id })),
    (restrictions ?? []).map((r) => ({ aId: r.a_id, bId: r.b_id })),
  );
  if (invalid) return { ok: false, error: `Affectation invalide : ${invalid}` };

  const { error } = await supabase.rpc("open_draw", {
    p_assignments: result.assignments.map((a) => ({
      giver_id: a.giverId,
      recipient_id: a.recipientId,
    })),
  });

  if (error) return { ok: false, error: `Ouverture impossible : ${error.message}` };

  revalidatePath("/admin");
  revalidatePath("/admin/draws");
  return { ok: true, message: "Tirages ouverts." };
}

export async function resetDraws(
  _previous: AdminResult | null,
  _formData: FormData,
): Promise<AdminResult> {
  await requireAdmin();
  const supabase = createServerClient();

  const { error } = await supabase.rpc("reset_draws");
  if (error) return { ok: false, error: `Réinitialisation impossible : ${error.message}` };

  revalidatePath("/admin");
  revalidatePath("/admin/draws");
  return { ok: true, message: "Tirages réinitialisés." };
}

// ── Wishlists ───────────────────────────────────────────────────────────────

export async function countWishlistItems(): Promise<number> {
  await requireAdmin();
  const supabase = createServerClient();
  const { count, error } = await supabase
    .from("wishlist_items")
    .select("id", { count: "exact", head: true });
  if (error) return 0;
  return count ?? 0;
}

/**
 * Purge toutes les wishlists. Outil de recette : il permet de repartir d'un
 * état vide sans toucher aux participants, aux restrictions ni aux tirages.
 *
 * La suppression est irréversible : d'où la confirmation explicite dans le
 * formulaire, une case à cocher et non un simple avertissement.
 */
export async function purgeWishlists(
  _previous: AdminResult | null,
  formData: FormData,
): Promise<AdminResult> {
  await requireAdmin();
  if (fd(formData, "confirm") !== "PURGER") {
    return { ok: false, error: "Confirmation requise : cochez la case pour purger." };
  }

  const supabase = createServerClient();
  // Supabase exige un filtre : on cible un identifiant impossible, ce qui vide
  // la table sans avoir à énumérer les lignes.
  const { error } = await supabase
    .from("wishlist_items")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000");

  if (error) return { ok: false, error: `Purge impossible : ${error.message}` };

  revalidatePath("/admin");
  return { ok: true, message: "Wishlists purgées." };
}

export async function isDrawOpenForAdmin(): Promise<boolean> {
  await requireAdmin();
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("draws_open")
    .eq("id", 1)
    .single();

  if (error) return false;
  return data.draws_open === true;
}