import { redirect } from "next/navigation";
import { findParticipantByToken, setSessionCookie } from "@/lib/participant";

/**
 * Point d'entrée du lien unique : /j/<token>
 *
 * Résout le token, pose la session puis redirige vers l'accueil. Un token
 * inconnu — ou supprimé depuis le backoffice — mène à une page d'erreur
 * lisible plutôt qu'à une boucle de redirection.
 *
 * `params` est une promesse : l'accès synchrone a été supprimé en Next 16.
 */
type Context = { params: Promise<{ token: string }> };

export async function GET(_request: Request, ctx: Context) {
  const { token } = await ctx.params;

  const participant = await findParticipantByToken(token);
  if (!participant) redirect("/lien-invalide");

  await setSessionCookie(token);
  redirect("/");
}