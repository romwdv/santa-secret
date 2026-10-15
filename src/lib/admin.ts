import { redirect } from "next/navigation";
import { createAdminAuth } from "@/lib/supabase/admin-auth";

/** L'utilisateur Supabase Auth de la requête, ou null. */
export async function getAdmin(): Promise<{ email: string } | null> {
  const supabase = await createAdminAuth();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) return null;
  return { email: user.email };
}

/**
 * Garde d'accès de TOUTE l'action et de TOUT l'écran admin.
 *
 * `getUser()` valide le JWT côté serveur — se fier à un cookie brut ou à un
 * paramètre ne sécuriserait rien. L'URL du backoffice n'est d'ailleurs connue
 * que de l'admin : c'est une commodité, pas une barrière.
 */
export async function requireAdmin(): Promise<{ email: string }> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}