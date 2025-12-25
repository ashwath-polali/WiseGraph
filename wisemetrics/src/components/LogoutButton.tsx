// src/components/LogoutButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

export function LogoutButton() {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  async function handleLogout() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Logout error", error);
      // You could show a toast here later.
    }
    router.push("/login");
  }

  return (
    <Button
      variant="ghost"
      onClick={handleLogout}
      className="text-xs text-slate-300 hover:text-sky-300"
    >
      Logout
    </Button>
  );
}
