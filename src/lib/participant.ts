import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { createServerClient } from "@/lib/supabase/server";
import type { Participant } from "@/lib/types";

export const SESSION_COOKIE = "santa_session";
const SESSION_MAX_AGE = 60 * 60 * 24 * 365;

/** 24 octets = 192 bits d'entropie, Issué par node:crypto (CSPRNG). */
export function generateToken(): string {
  return randomBytes(24).toString("hex");
}

type ParticipantRow = {
  id: string;
  first_name: string;
  initials: string;
};

function toParticipant(row: ParticipantRow): Participant {
  return {
    id: row.id,
    firstName: row.first_name,
    initials: row.initials,
  };
}

export async function findParticipantByToken(token: string): Promise<Participant | null> {
  const supabase = createServerClient();
  const { data, error } = await supabase
    .from("participants")
    .select("id, first_name, initials")
    .eq("token", token)
    .maybeSingle();

  if (error) throw new Error(`Lecture du participant impossible : ${error.message}`);
  return data ? toParticipant(data) : null;
}

/**
 * Participant associé à la session courante, ou null.
 *
 * Le cookie contient le token du lien unique. Il est httpOnly et n'est jamais
 * renvoyé au JS client : un XSS n'a donc rien à exfiltrer.
 */
export async function getCurrentParticipant(): Promise<Participant | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) return null;

  return findParticipantByToken(token);
}

export async function requireParticipant(): Promise<Participant> {
  const participant = await getCurrentParticipant();
  if (!participant) redirect("/connexion");
  return participant;
}

export async function setSessionCookie(token: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}