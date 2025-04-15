"use client";

import Link from "next/link";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { useAuth } from '@/context/auth-context';
import { Button } from '@/components/ui/button';
import { DashboardNav } from '@/components/dashboard/dashboard-nav';
import { UserAccountNav } from '@/components/dashboard/user-account-nav';
import { ModeToggle } from "@/components/mode-toggle";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b bg-background">
        <div className="container flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-4">
            <Link 
              href="/dashboard"
              className="font-heading text-xl font-extrabold tracking-tight text-primary transition-colors hover:text-primary/80"
            >
              AdGeneHub
            </Link>
            {user?.subscriptionStatus === 'trialing' && (
              <div className="bg-amber-100 text-amber-800 px-2 py-1 rounded-md text-xs">
                Trial Mode
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
            <ModeToggle />
            {user && <UserAccountNav user={user} />}
          </div>
        </div>
      </header>
      
      <div className="container flex-1 items-start md:grid md:grid-cols-[220px_1fr] md:gap-6 lg:grid-cols-[240px_1fr] lg:gap-10 py-6">
        <aside className="fixed top-14 z-30 -ml-2 hidden h-[calc(100vh-3.5rem)] w-full shrink-0 overflow-y-auto border-r md:sticky md:block">
          <DashboardNav />
          
          {user?.subscriptionTier === 'free' && (
            <div className="mt-6 rounded-lg border p-4 mx-2">
              <h3 className="font-medium">Upgrade Your Plan</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Get more features and generate unlimited ads
              </p>
              <Button asChild className="mt-4 w-full" size="sm">
                <Link href="/dashboard/billing">
                  View Plans
                </Link>
              </Button>
            </div>
          )}
        </aside>
        <main className="flex w-full flex-1 flex-col overflow-hidden">
          <AuthGuard requireAuth={true}>
            {children}
          </AuthGuard>
        </main>
      </div>
    </div>
  );
} 