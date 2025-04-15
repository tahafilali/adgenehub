"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle, Users, LockIcon, KeyRound } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";

export default function SettingsPage() {
  const { user, updateProfile, requestPasswordReset } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [isPasswordLoading, setIsPasswordLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: user?.fullName || "",
    companyName: user?.companyName || "",
  });

  const isPro = user?.subscriptionTier === "pro";

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await updateProfile(formData);
    } catch (error) {
      toast.error("Update Failed", {
        description: error instanceof Error ? error.message : "Failed to update profile",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendResetEmail = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setIsPasswordLoading(true);
    console.log("Calling requestPasswordReset...");
    const { error } = await requestPasswordReset();
    console.log("requestPasswordReset finished. Error:", error);
    setIsPasswordLoading(false);

    if (error) {
      toast.error("Failed to Send Reset Email", { description: error });
    } else {
      toast.success("Password Reset Email Sent", {
        description: "Please check your email for instructions to reset your password.",
      });
    }
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <h1 className="text-3xl font-bold mb-8">Settings</h1>
      
      <Tabs defaultValue="account" className="space-y-8">
        <TabsList className="space-x-4">
          <TabsTrigger value="account">Account</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="teams">
            Teams
            {!isPro && <LockIcon className="ml-1 h-3 w-3" />}
          </TabsTrigger>
          <TabsTrigger value="billing">Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="account" className="space-y-8">
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Profile Information</h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  name="fullName"
                  value={formData.fullName}
                  onChange={handleChange}
                  placeholder="Your full name"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="companyName">Company Name</Label>
                <Input
                  id="companyName"
                  name="companyName"
                  value={formData.companyName}
                  onChange={handleChange}
                  placeholder="Your company name"
                />
              </div>

              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Saving..." : "Save Changes"}
              </Button>
            </form>
          </Card>

          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Connected Accounts</h2>
            <div className="space-y-4">
              <p className="text-sm text-muted-foreground">Connecting external accounts is not currently supported.</p>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="space-y-8">
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Password Settings</h2>
            <p className="text-muted-foreground mb-4">
              To change your password, click the button below to send a reset link to your email.
            </p>
            <Button 
              onClick={handleSendResetEmail} 
              disabled={isPasswordLoading}
            >
              {isPasswordLoading ? "Sending..." : "Send Password Reset Email"}
            </Button>
            
            <Alert className="mt-6">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Check Your Email</AlertTitle>
              <AlertDescription>
                Follow the instructions in the email to set a new password. The link will expire.
              </AlertDescription>
            </Alert>
          </Card>
        </TabsContent>

        <TabsContent value="teams" className="space-y-8">
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Team Management</h2>
            {isPro ? (
              <div className="space-y-4">
                <p className="text-muted-foreground mb-4">
                  Manage your team members, invite new users, and set permissions.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card className="p-4 border border-border">
                    <div className="flex flex-col h-full">
                      <h3 className="font-medium mb-2">Team Members</h3>
                      <p className="text-sm text-muted-foreground mb-4 flex-grow">
                        Invite and manage team members who can access your account.
                      </p>
                      <Button asChild>
                        <Link href="/dashboard/settings/team">
                          <Users className="mr-2 h-4 w-4" />
                          Manage Team
                        </Link>
                      </Button>
                    </div>
                  </Card>
                  
                  <Card className="p-4 border border-border">
                    <div className="flex flex-col h-full">
                      <h3 className="font-medium mb-2">API Access</h3>
                      <p className="text-sm text-muted-foreground mb-4 flex-grow">
                        Create and manage API keys for programmatic access to the platform.
                      </p>
                      <Button asChild>
                        <Link href="/dashboard/settings/api">
                          <KeyRound className="mr-2 h-4 w-4" />
                          Manage API Keys
                        </Link>
                      </Button>
                    </div>
                  </Card>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex flex-col items-center justify-center py-10">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="text-lg font-medium mb-2">Team Management</h3>
                  <p className="text-muted-foreground text-center mb-4 max-w-md">
                    Team management is a Pro-only feature. Upgrade to invite team members and collaborate on your campaigns.
                  </p>
                  <Button asChild>
                    <Link href="/dashboard/billing">
                      Upgrade to Pro
                    </Link>
                  </Button>
                </div>
              </div>
            )}
          </Card>
        </TabsContent>

        <TabsContent value="billing" className="space-y-8">
          <Card className="p-6 mb-8">
            <h2 className="text-xl font-semibold mb-4">Subscription & Billing</h2>
            <div className="space-y-4">
              <p>Current Plan: {user?.subscriptionTier || 'Free'}</p>
              <p>Status: {user?.subscriptionStatus || 'Active'}</p>
              <Button variant="outline" asChild>
                <Link href="/dashboard/billing">
                  Manage Subscription
                </Link>
              </Button>
            </div>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 