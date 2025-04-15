"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";
import { toast } from "sonner";

export default function SignUpPage() {
  const router = useRouter();
  
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    password: "",
    companyName: "",
    terms: false,
    startTrial: true,
    trialTier: "starter"
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    if (formData.password.length < 8) {
      toast.error("Password Error", {
        description: "Password must be at least 8 characters long",
      });
      setIsLoading(false);
      return;
    }
    
    if (!formData.terms) {
      toast.error("Terms Not Accepted", {
        description: "You must agree to the Terms of Service and Privacy Policy",
      });
      setIsLoading(false);
      return;
    }
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || 'Failed to create account');
      }
      
      if (data.url) {
        console.log("Redirecting to Stripe Checkout:", data.url);
        window.location.href = data.url;
      } else {
        toast.success("Account Created!", {
          description: "Your free account has been successfully created.",
        });
        router.push('/dashboard');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      toast.error("Signup Failed", {
        description: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <Header />
      <div className="container max-w-6xl mx-auto px-4 py-16 md:py-24">
        <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-center">
          <div className="md:w-1/2 space-y-6">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
              Join AdGenie Today
            </h1>
            <p className="text-lg text-muted-foreground">
              Create your account and start generating high-performing ads with AI.
              Get started in minutes with our 14-day free trial.
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-medium">1</span>
                </div>
                <div>
                  <h3 className="font-medium">Create your account</h3>
                  <p className="text-muted-foreground">
                    Sign up with your email or connect your Google account.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-medium">2</span>
                </div>
                <div>
                  <h3 className="font-medium">Set up your profile</h3>
                  <p className="text-muted-foreground">
                    Tell us about your business and advertising goals.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <div className="bg-primary/10 p-2 rounded-full h-8 w-8 flex items-center justify-center flex-shrink-0">
                  <span className="text-primary font-medium">3</span>
                </div>
                <div>
                  <h3 className="font-medium">Start creating ads</h3>
                  <p className="text-muted-foreground">
                    Begin generating high-converting ads with our AI tools.
                  </p>
                </div>
              </div>
            </div>
            
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <h3 className="font-medium">Already have an account?</h3>
              <Button asChild variant="outline" className="w-full sm:w-auto">
                <Link href="/login">Log In</Link>
              </Button>
            </div>
          </div>
          
          <div className="md:w-1/2">
            <Card className="p-6 md:p-8 shadow-md">
              <h2 className="text-2xl font-bold mb-6">Create Your Account</h2>
              
              <form className="space-y-6" onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="fullName" className="text-sm font-medium">
                      Full Name
                    </label>
                    <input
                      type="text"
                      id="fullName"
                      name="fullName"
                      value={formData.fullName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="John Doe"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="email" className="text-sm font-medium">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="john@example.com"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="password" className="text-sm font-medium">
                      Password
                    </label>
                    <input
                      type="password"
                      id="password"
                      name="password"
                      value={formData.password}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="••••••••"
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Password must be at least 8 characters long.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <label htmlFor="companyName" className="text-sm font-medium">
                      Company Name (Optional)
                    </label>
                    <input
                      type="text"
                      id="companyName"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Your Company"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-start gap-2">
                      <input
                        type="checkbox"
                        id="startTrial"
                        name="startTrial"
                        checked={formData.startTrial}
                        onChange={handleChange}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <label htmlFor="startTrial" className="text-sm">
                        Start with a 14-day free trial of our Starter plan
                      </label>
                    </div>
                  </div>
                </div>
                
                <div className="flex items-start gap-2">
                  <input
                    type="checkbox"
                    id="terms"
                    name="terms"
                    checked={formData.terms}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                    required
                  />
                  <label htmlFor="terms" className="text-sm">
                    I agree to the{" "}
                    <Link href="/terms" className="text-primary hover:underline">
                      Terms of Service
                    </Link>{" "}
                    and{" "}
                    <Link href="/privacy" className="text-primary hover:underline">
                      Privacy Policy
                    </Link>
                  </label>
                </div>
                
                <Button type="submit" className="w-full" disabled={isLoading}>
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Creating account...
                    </span>
                  ) : "Create Account"}
                </Button>
              </form>
            </Card>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
} 