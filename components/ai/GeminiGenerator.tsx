import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Loader2 } from 'lucide-react'; // For loading spinner

const GeminiGenerator = () => {
  const [prompt, setPrompt] = useState<string>('');
  const [generatedText, setGeneratedText] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;
    setIsLoading(true);
    setError(null);
    setGeneratedText('');

    try {
      const response = await fetch('/api/generate/gemini', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Request failed with status ${response.status}`);
      }

      setGeneratedText(data.generatedText || 'No text generated.');

    } catch (err: unknown) {
      console.error('Gemini API call failed:', err);
      const message = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <form onSubmit={handleSubmit}>
        <CardHeader>
          {/* Optional: Title/Description inside the card header */}
          {/* <CardTitle>Generate Content</CardTitle> */}
          {/* <CardDescription>Enter your prompt below.</CardDescription> */}
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="gemini-prompt">Prompt</Label>
            <Textarea
              id="gemini-prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., Write three ad headlines for a new sustainable sneaker brand"
              disabled={isLoading}
              rows={4}
            />
          </div>
          {error && (
            <Alert variant="destructive">
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          {generatedText && (
             <Card className="bg-muted/40">
                <CardHeader>
                    <CardTitle className="text-lg">Generated Text</CardTitle>
                 </CardHeader>
                 <CardContent>
                    <p className="whitespace-pre-wrap">{generatedText}</p>
                 </CardContent>
             </Card>
          )}
        </CardContent>
        <CardFooter>
          <Button type="submit" disabled={isLoading || !prompt.trim()}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Generating...' : 'Generate Text'}
          </Button>
        </CardFooter>
      </form>
    </Card>
  );
};

export default GeminiGenerator; 