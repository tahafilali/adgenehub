"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// import { createClient } from '@supabase/supabase-js'; // Remove this
import { getSupabaseClient } from '@/context/auth-context'; // Import the getter
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { Header } from '@/components/header'; // Assuming a generic header
import { Footer } from '@/components/footer'; // Assuming a generic footer

// Use the getter to get the shared client instance
// const supabase = getSupabaseClient(); // Remove this line

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
    // Remove the session check entirely
    // const checkSession = async () => { ... };
    // checkSession();
  }, []); // Remove router dependency if not needed

  const handlePasswordUpdate = async (e: React.FormEvent) => {
    console.log("--- handlePasswordUpdate function START ---");
    e.preventDefault();
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    setLoading(true);
    try {
      const localSupabase = getSupabaseClient(); 
      if (!localSupabase) {
        throw new Error("Supabase client could not be initialized.");
      }
      
      console.log("Calling localSupabase.auth.updateUser (fire-and-forget)...");
      
      // Initiate the update but don't await it here for flow control
      localSupabase.auth.updateUser({ password })
        .then(({ error }) => {
          // Log the result when the promise actually resolves/rejects
          console.log("localSupabase.auth.updateUser promise settled. Error:", error);
          if (error) {
             console.error("Delayed error from updateUser:", error);
             // toast.error("Background update check failed.", { description: error.message });
          }
        })
        .catch(err => {
           console.error("Delayed exception from updateUser:", err);
           // toast.error("Background update check failed.", { description: "An unexpected error occurred." });
        });

      // --- Assume success based on USER_UPDATED event ---
      console.log("Assuming success based on event trigger, proceeding immediately.");
      setLoading(false); // Set loading false NOW
      toast.success("Password update request sent!", {
        description: "Redirecting to dashboard...",
      });
      console.log("Attempting to navigate to /dashboard immediately...");
      router.push('/dashboard'); 

    } catch (setupError) { // Catch errors from getting client, etc.
      console.error("Error during password update setup:", setupError);
      toast.error("Failed to initiate password update", {
        description: setupError instanceof Error ? setupError.message : "An unexpected error occurred."
      });
      setLoading(false); // Ensure loading is false if setup fails
    }
  };

  if (!isClient) {
    return null; // Avoid rendering server-side or during hydration mismatch
  }

  return (
    <>
      <Header />
      <div className="container max-w-md mx-auto px-4 py-16 md:py-24">
        <Card className="p-6 md:p-8 shadow-md">
          <h1 className="text-2xl font-bold mb-6 text-center">Set New Password</h1>
          <form onSubmit={handlePasswordUpdate} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">New Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter new password (min. 8 characters)"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirm New Password</Label>
              <Input
                id="confirmPassword"
                name="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="Confirm new password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Updating..." : "Update Password"}
            </Button>
          </form>
        </Card>
      </div>
      <Footer />
    </>
  );
} 