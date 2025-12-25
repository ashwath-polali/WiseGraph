// src/components/LogoutButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();

    // Send user back to WiseGraph home
    router.push("/");
  }

  return (
    <Button
      type="button"
      variant="ghost"
      className="text-xs text-slate-400 hover:text-slate-100"
      onClick={handleLogout}
    >
      Log out
    </Button>
  );
}
