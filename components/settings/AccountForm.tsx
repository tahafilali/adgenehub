"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2 } from 'lucide-react';

export default function AccountForm() {
  const { user, updateProfile, loading: authLoading } = useAuth();
  const [fullName, setFullName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Initialize form with user data once auth is loaded
  useEffect(() => {
    if (user && !authLoading) {
      setFullName(user.fullName || '');
      setCompanyName(user.companyName || '');
    }
  }, [user, authLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || isSaving) return;

    setIsSaving(true);
    const dataToUpdate: Partial<typeof user> = {};

    // Only include fields that have actually changed
    if (fullName !== (user.fullName || '')) {
      dataToUpdate.fullName = fullName;
    }
    if (companyName !== (user.companyName || '')) {
      dataToUpdate.companyName = companyName;
    }

    if (Object.keys(dataToUpdate).length > 0) {
      await updateProfile(dataToUpdate);
    }
    setIsSaving(false);
  };

  if (authLoading) {
    return <div>Loading account details...</div>;
  }

  return (
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Display Name</CardTitle>
          <CardDescription>
            Please enter your full name. This will be displayed publicly.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-1">
            <Label htmlFor="fullName" className="sr-only">Full Name</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              disabled={isSaving}
              maxLength={100} // Example max length
            />
          </div>
        </CardContent>
        <CardHeader>
          <CardTitle>Company Name</CardTitle>
          <CardDescription>
            Enter the name of your company (optional).
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-1">
            <Label htmlFor="companyName" className="sr-only">Company Name</Label>
            <Input
              id="companyName"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              disabled={isSaving}
              maxLength={100} // Example max length
            />
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button type="submit" disabled={isSaving}>
            {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardFooter>
      </Card>
    </form>
  );
} 