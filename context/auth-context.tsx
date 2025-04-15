"use client";

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { toast } from "sonner";

// Create a singleton Supabase client for client-side usage
const createSupabaseClient = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  
  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      storageKey: 'supabase-auth',
      detectSessionInUrl: true,
      autoRefreshToken: true,
      // Use PKCE flow instead of implicit for better compatibility
      flowType: 'pkce',
      storage: typeof window !== 'undefined' ? localStorage : undefined,
    }
  });
};

// Create the client only once
let supabaseInstance: ReturnType<typeof createSupabaseClient> | null = null;

// Getter function to ensure singleton pattern
export function getSupabaseClient() {
  if (!supabaseInstance && typeof window !== 'undefined') {
    supabaseInstance = createSupabaseClient();
  }
  return supabaseInstance!;
}

// Reverted UserType
export type UserType = {
  id: string;
  email: string;
  fullName: string | null;
  companyName: string | null;
  subscriptionTier: string | null;
  subscriptionStatus: string | null;
  creditsUsed: number;
  creditsLimit: number;
  trialEndDate: string | null;
  // active_plan and current_organization_id removed
};

type AuthContextType = {
  user: UserType | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<boolean>;
  isUserInFreeTrial: () => boolean;
  trialDaysRemaining: () => number | null;
  updateProfile: (data: Partial<UserType>) => Promise<void>; // Kept the signature
  requestPasswordReset: () => Promise<{ error: string | null }>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  
  // Create a memoized supabase client
  const supabase = useMemo(() => getSupabaseClient(), []);

  // Reverted createBasicUserFromAuth
  const createBasicUserFromAuth = (authUser: {
    id: string;
    email?: string;
    user_metadata?: { full_name?: string | null };
  }) => {
    console.log("Creating basic user from auth data");
    return {
      id: authUser.id,
      email: authUser.email || '',
      fullName: authUser.user_metadata?.full_name || null,
      companyName: null,
      subscriptionTier: 'free', 
      subscriptionStatus: null,
      creditsUsed: 0,
      creditsLimit: 1000,
      trialEndDate: null
      // active_plan and current_organization_id defaults removed
    };
  };

  // Reverted fetchUserDetails (using select('*') and eq('id', userId) as per original state implied by user)
  const fetchUserDetails = async (userId: string) => { // Using userId (matching auth.users.id implicitly)
    console.log("Fetching user details for:", userId); 
    
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*') // Reverted to select *
        .eq('id', userId) // Reverted to query by users.id (matching auth.users.id)
        .single();

      if (error) {
        console.error('Error fetching user details:', error);
        console.log('Error code:', error.code);
        console.log('Error message:', error.message);
        
        if (error.message?.includes('relation "users" does not exist')) {
          console.error('The users table does not exist in the database');
        }
        
        return null;
      }

      if (!data) {
        console.error('No user data found for ID:', userId); 
        
        try {
          console.log('Attempting to create missing user record via API');
          const response = await fetch('/api/debug/check-user');
          
          if (response.ok) {
            const result = await response.json();
            console.log('User creation attempt result:', result);
            
            if (result.checks?.userCreationResult?.success) {
              console.log('User record created, fetching updated data');
              
              const { data: newData } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId) // Reverted
                .single();
                
              if (newData) {
                return mapUserDataToModel(newData);
              }
            }
          }
        } catch (apiError) {
          console.error('API error when creating user:', apiError);
        }
        
        return null;
      }

      console.log("User details fetched successfully"); // Reverted log message slightly
      return mapUserDataToModel(data);
    } catch (err) {
      console.error('Exception fetching user details:', err);
      return null;
    }
  };
  
  // Reverted mapUserDataToModel
  const mapUserDataToModel = (data: {
    id: string;
    email: string;
    full_name?: string | null;
    company_name?: string | null;
    subscription_tier?: string | null;
    subscription_status?: string | null;
    credits_used?: number;
    credits_limit?: number;
    trial_end_date?: string | null;
    // active_plan and current_organization_id removed from input type
  }): UserType => {
    return {
      id: data.id,
      email: data.email,
      fullName: data.full_name || null,
      companyName: data.company_name || null,
      subscriptionTier: data.subscription_tier || null,
      subscriptionStatus: data.subscription_status || null,
      creditsUsed: data.credits_used || 0,
      creditsLimit: data.credits_limit || 1000,
      trialEndDate: data.trial_end_date || null,
      // active_plan and current_organization_id mapping removed
    };
  };

  // Refresh user data (no changes needed here as it calls fetchUserDetails)
  const refreshUser = async () => {
    console.log("Refreshing user data...");
    
    try {
      const { data: authData, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error("Error getting user:", authError);
        setUser(null);
        return false;
      }
      
      if (authData.user) {
        console.log("Found user in session:", authData.user.email);
        console.log("Auth user ID:", authData.user.id);
        
        const userDetails = await fetchUserDetails(authData.user.id);
        
        if (userDetails) {
          setUser(userDetails);
          console.log("User details refreshed successfully");
          return true;
        } else {
          console.log("Failed to refresh user details from database, using basic user");
          setUser(createBasicUserFromAuth(authData.user));
          return true;
        }
      } else {
        console.log("No authenticated user found");
        setUser(null);
        return false;
      }
    } catch (err) {
      console.error("Error in refreshUser:", err);
      return false;
    }
  };

  // Sign in with email and password (no changes needed)
  const signIn = async (email: string, password: string) => {
    setLoading(true);
    console.log("Signing in user:", email);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("Sign in error:", error.message);
        setLoading(false);
        return { error: error.message };
      }

      if (data.user) {
        console.log("User signed in successfully:", data.user.email);
        const userDetails = await fetchUserDetails(data.user.id);
        if (userDetails) {
          setUser(userDetails);
        } else {
          setUser(createBasicUserFromAuth(data.user));
        }
        router.push('/dashboard');
      }

      setLoading(false);
      return { error: null };
    } catch (err) {
      console.error("Exception during sign in:", err);
      setLoading(false);
      return { error: 'An unexpected error occurred' };
    }
  };

  // Sign out (no changes needed)
  const signOut = async () => {
    console.log("Signing out user");
    
    try {
      await supabase.auth.signOut();
      setUser(null);
      router.push('/login');
    } catch (err) {
      console.error("Error signing out:", err);
    }
  };

  // Check if user is in free trial (no changes needed)
  const isUserInFreeTrial = () => {
    if (!user) return false;
    return user.subscriptionStatus === 'trialing' && !!user.trialEndDate;
  };

  // Calculate trial days remaining (no changes needed)
  const trialDaysRemaining = () => {
    if (!user || !user.trialEndDate) return null;
    
    const trialEnd = new Date(user.trialEndDate);
    const today = new Date();
    
    const diffTime = trialEnd.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays > 0 ? diffDays : 0;
  };

  // Re-implement updateProfile with database logic
  const updateProfile = async (dataToUpdate: Partial<UserType>) => {
    if (!user) {
      console.error("Cannot update profile, user not logged in.");
      toast.error("Update Failed", { description: "You must be logged in to update your profile." });
      return;
    }
    if (!supabase) {
      console.error("Cannot update profile, Supabase client not available.");
      toast.error("Update Failed", { description: "Database connection is not available." });
      return;
    }

    console.log("Attempting to update profile for user ID:", user.id, "with data:", dataToUpdate);

    // 1. Optimistic UI Update
    const previousUserData = { ...user }; // Shallow copy previous state
    setUser(currentUser => currentUser ? { ...currentUser, ...dataToUpdate } : null);

    // 2. Prepare data for Supabase (map names)
    const dbUpdateData: Record<string, string | null> = {};
    if (dataToUpdate.fullName !== undefined) dbUpdateData.full_name = dataToUpdate.fullName;
    if (dataToUpdate.companyName !== undefined) dbUpdateData.company_name = dataToUpdate.companyName;
    // Add other mappable fields here if needed (e.g., avatar_url)

    if (Object.keys(dbUpdateData).length === 0) {
      console.log("No mappable data provided for profile update.");
      toast.info("No Changes", { description: "No profile information was provided to update." });
      // No need to revert optimistic update if nothing was sent
      return;
    }

    try {
      // 3. Update Database
      // RLS Policy "Allow individual user update access" ON public.users USING (auth.uid() = id) should allow this.
      const { error } = await supabase
        .from('users')
        .update(dbUpdateData)
        .eq('id', user.id); // Match based on the public.users primary key (which matches auth.uid)

      if (error) {
        console.error("Supabase profile update error:", error);
        // Revert optimistic update on error
        setUser(previousUserData);
        toast.error("Update Failed", {
          description: error.message || "Could not save profile changes to the database.",
        });
      } else {
        console.log("Profile updated successfully in database.");
        toast.success("Profile Updated", {
          description: "Your profile changes have been saved.",
        });
        // Optional: Explicitly refresh all user data if needed after update
        // await refreshUser();
      }
    } catch (err: unknown) {
      console.error("Exception during profile update:", err);
      // Revert optimistic update on exception
      setUser(previousUserData);
      const message = err instanceof Error ? err.message : "An unexpected error occurred.";
      toast.error("Update Failed", { description: message });
    }
  };

  // requestPasswordReset (kept as is - this was the state you wanted to revert TO)
  const requestPasswordReset = async () => {
    if (!supabase) return { error: "Supabase client not available." };
    if (!user?.email) return { error: "User email not found." };

    console.log("Requesting password reset for email:", user.email);
    const redirectUrl = `${window.location.origin}/update-password`; 
    console.log("Redirect URL for password update:", redirectUrl);

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(user.email, {
        redirectTo: redirectUrl,
      });
      console.log("supabase.auth.resetPasswordForEmail completed. Error:", error);

      if (error) {
        console.error("Error requesting password reset:", error);
        return { error: error.message || "Failed to send password reset email." };
      }

      console.log("Password reset email sent successfully.");
      return { error: null };
    } catch (requestError) {
      console.error("Exception during resetPasswordForEmail:", requestError);
      return { error: requestError instanceof Error ? requestError.message : "An unexpected error occurred sending the reset email." };
    }
  };

  // Initialize auth state (logic remains the same, relies on reverted fetchUserDetails)
  useEffect(() => {
    let isActive = true;
    
    const initializeAuth = async () => {
      if (!isActive) return;
      
      console.log("Initializing auth context...");
      setLoading(true);
      
      try {
        if (typeof window !== 'undefined' && window.location.hash) {
          console.log("Hash params detected in URL:", window.location.hash);
        }
        
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Error getting session:", error);
          if (isActive) setLoading(false);
          return;
        }
        
        console.log("Session check result:", data.session ? "Found session" : "No session");
        
        if (data.session?.user) {
          console.log("User found in session:", data.session.user.email);
          console.log("User ID:", data.session.user.id); // This is auth.users.id
          console.log("Auth provider:", data.session.user.app_metadata?.provider);
          
          // fetchUserDetails now expects auth.users.id but queries users.id
          const userDetails = await fetchUserDetails(data.session.user.id); 
          
          if (userDetails && isActive) {
            console.log("User details loaded from DB");
            setUser(userDetails);
          } else {
            console.log("Failed to load user details from DB, using basic user");
            if (isActive) {
              setUser(createBasicUserFromAuth(data.session.user));
            }
          }
        }
        
        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (!isActive) return;
          
          console.log("Auth state changed:", event, session?.user?.email);
          
          if (event === 'SIGNED_IN' && session?.user) {
            console.log("User signed in, fetching details");
            
            const userDetails = await fetchUserDetails(session.user.id); // Uses auth.users.id
            
            if (userDetails && isActive) {
              console.log("User details loaded after sign in");
              setUser(userDetails);
              if (typeof window !== 'undefined' && (window.location.pathname === '/login' || window.location.pathname === '/signup')) {
                router.push('/dashboard');
              }
            } else {
              console.log("Failed to load user details after sign in, using basic user");
              if (isActive) {
                setUser(createBasicUserFromAuth(session.user));
                if (typeof window !== 'undefined' && (window.location.pathname === '/login' || window.location.pathname === '/signup')) {
                  router.push('/dashboard');
                }
              }
            }
          }
          
          if (event === 'SIGNED_OUT') {
            console.log("User signed out");
            if (isActive) setUser(null);
          }
          
          if (event === 'TOKEN_REFRESHED') {
            console.log("Token refreshed");
          }
          
          if (event === 'USER_UPDATED') {
            console.log("User updated, refreshing details");
            if (session?.user && isActive) {
              const userDetails = await fetchUserDetails(session.user.id); // Uses auth.users.id
              if (userDetails) {
                setUser(userDetails);
              } else if (isActive) {
                setUser(createBasicUserFromAuth(session.user));
              }
            }
          }
        });
        
        if (isActive) setLoading(false);
        
        return () => {
          console.log("Cleaning up auth listener");
          authListener.subscription.unsubscribe();
        };
      } catch (error) {
        console.error("Error initializing auth:", error);
        if (isActive) setLoading(false);
      }
    };

    initializeAuth();
    
    return () => {
      isActive = false;
    };
  }, [supabase]); // Dependency array kept simple

  const value = useMemo(
    () => ({ user, loading, signIn, signOut, refreshUser, isUserInFreeTrial, trialDaysRemaining, updateProfile, requestPasswordReset }),
    [user, loading, supabase] // Dependencies reverted
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 