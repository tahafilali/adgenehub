"use client";

import AccountForm from "@/components/settings/AccountForm";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { Separator } from "@/components/ui/separator"

export default function SettingsAccountPage() {
  return (
    <AuthGuard requireAuth={true}>
      <div className="space-y-6">
        <div>
          <h3 className="text-lg font-medium">Account</h3>
          <p className="text-sm text-muted-foreground">
            Update your account settings. Set your display name and company.
          </p>
        </div>
        <Separator />
        <AccountForm />
      </div>
    </AuthGuard>
  );
} 