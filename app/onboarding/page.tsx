"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

export default function OnboardingPage() {
  const router = useRouter();

  const handleContinue = () => {
    router.push("/dashboard");
  };

  return (
    <div className="container mx-auto px-4 py-16 text-center">
      <h1 className="text-3xl font-bold mb-4">Welcome to AdGenie!</h1>
      <p className="text-lg mb-8">Let's get you started with a quick tour.</p>
      <Button onClick={handleContinue} className="btn-primary">
        Continue to Dashboard
      </Button>
    </div>
  );
} 