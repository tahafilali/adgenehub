"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";

type AuthGuardProps = {
  children: React.ReactNode;
  requireAuth?: boolean;
};

// Define paths that are publicly accessible
const PUBLIC_PATHS = ["/", "/login", "/signup", "/features", "/pricing", "/contact"];

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { user, loading, refreshUser } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isInitialized, setIsInitialized] = useState(false);
  
  useEffect(() => {
    // Handle error parameters from OAuth redirects
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');
    
    if (error) {
      console.error(`Auth error: ${error}${errorDescription ? ` - ${errorDescription}` : ''}`);
    }
    
    // Perform initialization only once when loading is complete
    const initAuth = async () => {
      if (loading) {
        console.log("AuthGuard: Loading auth state...");
        return;
      }

      if (isInitialized) {
        return;
      }
      
      // Handle OAuth code parameter - we need to refresh user data
      const code = searchParams.get('code');
      if (code) {
        console.log("AuthGuard: Detected OAuth code parameter, will refresh user data");
      }
      
      console.log("AuthGuard: Auth state loaded", { 
        isAuthenticated: !!user, 
        pathname, 
        requireAuth 
      });
      
      try {
        // Always refresh user data on mount and when code param is present
        await refreshUser();
        setIsInitialized(true);
      } catch (err) {
        console.error("Error refreshing user data:", err);
        setIsInitialized(true);
      }
    };

    initAuth();
  }, [loading, user, pathname, searchParams, refreshUser, isInitialized]);

  // Handle redirects in a separate effect that runs after initialization
  useEffect(() => {
    if (!isInitialized || loading) {
      return;
    }

    // Check if path is public
    const isPublicPath = PUBLIC_PATHS.includes(pathname);
    
    // If auth is required and user is not logged in, redirect to login
    if (requireAuth && !user && !isPublicPath) {
      console.log("AuthGuard: Redirecting to login, auth required but no user");
      router.push(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    
    // If user is logged in and trying to access login/signup pages, redirect to dashboard
    if (user && (pathname === "/login" || pathname === "/signup")) {
      console.log("AuthGuard: Redirecting to dashboard, user is logged in");
      
      // Check if there's a redirect param
      const redirectParam = searchParams.get('redirect');
      if (redirectParam) {
        router.push(redirectParam);
      } else {
        router.push("/dashboard");
      }
      return;
    }
    
    console.log("AuthGuard: No redirect needed");
  }, [user, loading, pathname, router, requireAuth, searchParams, isInitialized]);
  
  // During initial loading, show loading indicator
  if (loading || !isInitialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  // If auth is required and user is not logged in, don't render children
  if (requireAuth && !user) {
    return null;
  }
  
  // Otherwise, render the children
  return <>{children}</>;
} 