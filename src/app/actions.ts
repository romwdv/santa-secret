"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireParticipant } from "@/lib/participant";
import { createServerClient } from "@/lib/supabase/server";
import type { Participant, WishlistItem } from "@/lib/types";

type WishlistRow = {
  id: string;
  participant_id: string;
  title: string;
  url: string;
};

type ParticipantRow = {
  id: string;
  first_name: string;
  initials: string;
};

function toItem(row: WishlistRow): WishlistItem {
  return {
    id: row.id,
    participantId: row.participant_id,
    title: row.title,
    url: row.url,
  };
}

/**
 * Le batch courant. Toute lecture de `draws` doit être filtrée dessus : sans
 * cela, un participant ayant déjà donné lors d'un tirage précédent ferait
 * échouer les lectures par `giver_id`.
 */
async function getCurrentBatch(): Promise<string | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("batch")
    .eq("id", 1)
    .single();

  if (error) throw new Error(`Lecture de la configuration impossible : ${error.message}`);
  return data?.batch ?? null;
}

/** Les idées du participant courant. */
export async function getMyWishlist(): Promise<WishlistItem[]> {
  const participant = await requireParticipant();
  const supabase = createServerClient();

  const { data, error } = await supabase
    .from("wishlist_items")
    .select("id, participant_id, title, url")
    .eq("participant_id", participant.id)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Lecture de la wishlist impossible : ${error.message}`);
  return (data ?? []).map(toItem);
}

/**
 * Wishlist d'un participant donné — jamais la sienne.
 *
 * R5 : le tirage est anonyme. C'est cette fonction qui porte US-5 : le donneur
 * voit la wishlist de celui qu'il a tiré, en lecture seule, sans jamais
 * apprendre qui l'a tiré lui.
 */
export async function getWishlistOf(recipientId: string): Promise<WishlistItem[]> {
  const recipient = await getGiftDetails(recipientId);
  return recipient ? recipient.items : [];
}

/**
 * Destinataire tiré par le participant courant, et sa wishlist.
 *
 * Renvoie null si le participant demandé n'est pas celui du tirage : on ne
 * divulgue ni son nom ni ses idées. R5 est appliqué ici, pas seulement dans
 * l'affichage — un appel direct à cette fonction avec un autre identifiant ne
 * renvoie rien.
 */
export async function getGiftDetails(
  recipientId: string,
): Promise<{ recipient: Participant; items: WishlistItem[] } | null> {
  const giver = await requireParticipant();
  const supabase = createServerClient();

  const batch = await getCurrentBatch();
  if (!batch) return null;

  const { data: draw, error } = await supabase
    .from("draws")
    .select("recipient:participants!draws_recipient_id_fkey(id, first_name, initials)")
    .eq("batch", batch)
    .eq("giver_id", giver.id)
    .maybeSingle();

  if (error) throw new Error(`Lecture du tirage impossible : ${error.message}`);

  const row = (draw?.recipient ?? null) as unknown as ParticipantRow | null;
  if (!row || row.id !== recipientId) return null;

  const { data: items, error: itemsError } = await supabase
    .from("wishlist_items")
    .select("id, participant_id, title, url")
    .eq("participant_id", recipientId)
    .order("created_at", { ascending: false });

  if (itemsError) {
    throw new Error(`Lecture de la wishlist impossible : ${itemsError.message}`);
  }

  return {
    recipient: { id: row.id, firstName: row.first_name, initials: row.initials },
    items: (items ?? []).map(toItem),
  };
}

/** Le destinataire tiré par le participant courant, sans ses idées. */
export async function getMyDrawRecipient(): Promise<Participant | null> {
  const giver = await requireParticipant();
  const supabase = createServerClient();

  const batch = await getCurrentBatch();
  if (!batch) return null;

  const { data, error } = await supabase
    .from("draws")
    .select("recipient:participants!draws_recipient_id_fkey(id, first_name, initials)")
    .eq("batch", batch)
    .eq("giver_id", giver.id)
    .maybeSingle();

  if (error) throw new Error(`Lecture du tirage impossible : ${error.message}`);

  const row = (data?.recipient ?? null) as unknown as ParticipantRow | null;
  if (!row) return null;
  return { id: row.id, firstName: row.first_name, initials: row.initials };
}

/** Le tirage est-il ouvert ? */
export async function isDrawOpen(): Promise<boolean> {
  await requireParticipant();
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("app_settings")
    .select("draws_open")
    .eq("id", 1)
    .single();

  if (error) throw new Error(`Lecture de la configuration impossible : ${error.message}`);
  return data.draws_open === true;
}

/** `redirect` ne rend pas la main : cette fonction ne rend jamais. */
function neverReturns(): never {
  redirect("/wishlist");
}

/** Échec d'enregistrement. Le succès redirige : il n'a pas d'état à rendre. */
export type AddWishlistResult = { error: string };

export async function addWishlistItem(
  _previous: AddWishlistResult | null,
  formData: FormData,
): Promise<AddWishlistResult> {
  const participant = await requireParticipant();
  const title = String(formData.get("title") ?? "").trim();
  const rawUrl = String(formData.get("url") ?? "").trim();

  if (title.length < 3) return { error: "Le titre doit faire au moins 3 caractères." };

  // Le lien est facultatif : on ne le contrôle que s'il est fourni.
  if (rawUrl && !/^https?:\/\//i.test(rawUrl)) {
    return { error: "Le lien doit commencer par http:// ou https://" };
  }

  const supabase = createServerClient();
  const { error } = await supabase.from("wishlist_items").insert({
    participant_id: participant.id,
    title,
    url: rawUrl || null,
  });

  // Le message de la base est remonté tel quel : c'est lui qui permet de
  // diagnostiquer une migration manquante, ce qu'un message générique masquait.
  if (error) return { error: `Enregistrement refusé : ${error.message}` };

  // Redirection côté serveur : le participant atterrit directement sur sa
  // wishlist. `redirect` ne retourne jamais, le type `never` le dit au
  // compilateur — donc impossible d'oublier le `return`.
  revalidatePath("/wishlist");
  return neverReturns();
}

export async function deleteWishlistItem(formData: FormData): Promise<void> {
  const participant = await requireParticipant();
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const supabase = createServerClient();
  // Le filtre porte aussi sur participant_id : un participant ne peut pas
  // supprimer l'idée d'un autre, même en forçant l'id.
  const { error } = await supabase
    .from("wishlist_items")
    .delete()
    .eq("id", id)
    .eq("participant_id", participant.id);

  if (error) throw new Error(`Suppression impossible : ${error.message}`);
  revalidatePath("/wishlist");
}