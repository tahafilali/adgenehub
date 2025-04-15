"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { FileSearch } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4 py-16">
      <FileSearch className="w-16 h-16 mb-6 text-muted-foreground" />
      <h1 className="text-4xl font-bold mb-4">Oops! Page Not Found</h1>
      <p className="text-lg text-muted-foreground mb-8 max-w-md">
        It seems the page you were looking for has vanished or never existed.
      </p>
      <Button asChild>
        <Link href="/">
          Go Back Home
        </Link>
      </Button>
    </div>
  );
} 