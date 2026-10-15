"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { createAdminAuth } from "@/lib/supabase/admin-auth";

export async function login(_previous: string | null, formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) return "Email et mot de passe requis.";

  const supabase = await createAdminAuth();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  // Message volontairement générique : ne pas révéler si l'email existe.
  if (error) return "Identifiants invalides.";

  revalidatePath("/admin", "layout");
  redirect("/admin");
}

export async function logout() {
  const supabase = await createAdminAuth();
  await supabase.auth.signOut();
  revalidatePath("/admin", "layout");
  redirect("/admin/login");
}