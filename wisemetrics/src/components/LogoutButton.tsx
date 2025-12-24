// src/components/LogoutButton.tsx
"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabaseClient";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <Button variant="ghost" onClick={handleLogout}>
      Logout
    </Button>
  );
}
