import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Variable d'environnement manquante : ${name}.`);
  return value;
}

/**
 * Client Supabase Auth pour l'espace administrateur.
 *
 * Il utilise la clé PUBLIQUE : c'est la seule façon d'obtenir une vraie session
 * Supabase Auth, qui pose ses propres cookies. Il ne touche jamais aux tables
 * `santa` — les données passent par `createServerClient()` (clé secrète), après
 * la vérification de session ci-dessous.
 *
 * `cookies()` est en lecture seule dans un Server Component : `setAll` échoue
 * donc hors Route Handler / Server Action, d'où le try/catch.
 */
export async function createAdminAuth() {
  const cookieStore = await cookies();

  return createServerClient(
    required("NEXT_PUBLIC_SUPABASE_URL"),
    required("SUPABASE_ANON_KEY"),
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // Écriture impossible hors Route Handler : ignoré, la session
            // courante reste valide.
          }
        },
      },
    },
  );
}