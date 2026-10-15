import { createClient } from "@supabase/supabase-js";

export const SANTA_SCHEMA = "santa";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(
      `Variable d'environnement manquante : ${name}. ` +
        `Copiez .env.example vers .env.local et remplissez les valeurs Supabase.`,
    );
  }
  return value;
}

/**
 * Client Supabase pour le serveur uniquement.
 *
 * Il utilise la clé secrète : elle contourne RLS et n'a JAMAIS vocation à
 * joindre le client. Les requêtes sont donc toutes filtrées explicitement par
 * l'identifiant du participant courant — voir ARCHITECTURE.md § 1.
 *
 * Le type de retour est inféré : le paramètre générique par défaut de
 * `SupabaseClient` est lié à `public`, ce qui ne correspond pas à notre schéma.
 */
export function createServerClient() {
  return createClient(required("NEXT_PUBLIC_SUPABASE_URL"), required("SUPABASE_SECRET_KEY"), {
    db: { schema: SANTA_SCHEMA },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}