"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function DashboardPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.replace("/login");
      } else {
        setChecking(false);
      }
    }
    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!session) {
        router.replace("/login");
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [router]);

  if (checking) {
    return (
      <p className="text-sm text-slate-400">
        Checking session…
      </p>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-semibold mb-2">Class dashboard</h1>
      <p className="text-sm text-slate-400">
        This is where the class overview chart will go.
      </p>
    </div>
  );
}
