import React from 'react';
import GeminiGenerator from '@/components/ai/GeminiGenerator'; // We will create this component next
import { AuthProvider, useAuth } from '@/context/auth-context'; // Corrected import path
import { useRouter } from 'next/router';

const AiGeneratorPage = () => {
  const { user, loading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    // Redirect to login if not authenticated after loading
    if (!loading && !user) {
      router.push('/login'); // Adjust login path if needed
    }
  }, [user, loading, router]);

  if (loading || !user) {
    // Display loading indicator or skeleton screen while checking auth
    return <div>Loading...</div>;
  }

  // Check if the user has a pro subscription
  const isPro = user?.subscription_tier === 'pro';

  if (!isPro) {
    return (
      <div className="container mx-auto p-4 text-center">
        <h1 className="text-2xl font-bold mb-4">Upgrade Required</h1>
        <p className="mb-6">The AI Content Generator is a Pro feature.</p>
        {/* Optional: Add a button/link to your pricing/upgrade page */}
        {/* <Link href="/pricing"><Button>Upgrade to Pro</Button></Link> */}
      </div>
    );
  }

  // Render the generator for Pro users
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">AI Content Generator</h1>
      <p className="mb-6 text-muted-foreground">Enter a prompt to generate text using AI. (Pro plan required)</p>
      <GeminiGenerator />
    </div>
  );
};

// Wrap with AuthProvider if it's not already applied in _app.tsx
const AiGeneratorPageWithAuth = () => (
  <AuthProvider>
    <AiGeneratorPage />
  </AuthProvider>
);

// If AuthProvider is in _app.tsx, export AiGeneratorPage directly:
// export default AiGeneratorPage;

// Otherwise, export the wrapped version:
export default AiGeneratorPageWithAuth; // Choose based on your app structure 