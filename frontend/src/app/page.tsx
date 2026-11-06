"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/useUserStore";
import { LandingPage } from "@/components/landing/LandingPage";

export default function RootPage() {
  const router = useRouter();
  const isAuthenticated = useUserStore((s) => s.isAuthenticated);
  const isLoading = useUserStore((s) => s.isLoading);

  // If already authenticated and onboarded, direct to dashboard
  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  return <LandingPage />;
}
