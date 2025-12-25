"use client";

// src/components/LogoutButton.tsx
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { createSupabaseBrowserClient } from "@/lib/supabaseBrowser";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const confirmed = window.confirm("Are you sure you want to log out?");
    if (!confirmed) return;

    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/"); // Send user back to WiseGraph home
  }

  return (
    <Button variant="ghost" onClick={handleLogout}>
      Log out
    </Button>
  );
}
