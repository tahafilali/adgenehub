"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";
import { Lock, Eye, EyeOff, Copy, KeyRound, Plus, Trash, AlertTriangle } from "lucide-react";
import { toast } from "sonner";

type ApiKey = {
  id: string;
  name: string;
  prefix: string;
  createdAt: string;
  lastUsed: string | null;
};

export default function ApiKeysPage() {
  const { user } = useAuth();
  const isPro = user?.subscriptionTier === "pro";
  
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([
    {
      id: "1",
      name: "Production Key",
      prefix: "sk_prod_",
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      lastUsed: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
    },
    {
      id: "2",
      name: "Development Key",
      prefix: "sk_dev_",
      createdAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000).toISOString(),
      lastUsed: null
    }
  ]);
  
  const [newKeyName, setNewKeyName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [showNewKey, setShowNewKey] = useState(true);
  
  const createNewKey = () => {
    if (!newKeyName) {
      toast.error("Please enter a name for your API key");
      return;
    }
    
    setIsCreating(true);
    
    // Simulate API call
    setTimeout(() => {
      const mockKey = "sk_dev_" + Array(24).fill(0).map(() => Math.random().toString(36).charAt(2)).join('');
      setNewlyCreatedKey(mockKey);
      
      const newKey: ApiKey = {
        id: `new-${Date.now()}`,
        name: newKeyName,
        prefix: "sk_dev_",
        createdAt: new Date().toISOString(),
        lastUsed: null
      };
      
      setApiKeys([...apiKeys, newKey]);
      setNewKeyName("");
      setIsCreating(false);
    }, 1500);
  };
  
  const deleteKey = (id: string) => {
    // Simulate API call
    setApiKeys(apiKeys.filter(key => key.id !== id));
    toast.success("API key deleted");
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Copied to clipboard");
  };

  if (!isPro) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold">API Access</h1>
          <p className="text-muted-foreground">
            Manage API keys for programmatic access
          </p>
        </div>
        
        <Card className="p-6">
          <div className="flex flex-col items-center justify-center py-10">
            <Lock className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">API Access</h3>
            <p className="text-muted-foreground text-center mb-4 max-w-md">
              API access is available on the Pro plan. Upgrade to integrate with your own systems and automate ad generation.
            </p>
            <Button asChild>
              <Link href="/dashboard/billing">
                Upgrade to Pro
              </Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">API Access</h1>
        <p className="text-muted-foreground">
          Manage API keys for programmatic access
        </p>
      </div>
      
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-4">Your API Keys</h2>
        
        <Card className="mb-6 border-amber-200 bg-amber-50 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-amber-800">API Key Security</h3>
              <p className="text-amber-700 text-sm">
                Your API keys provide full access to your account. Never share them in public or include in client-side code.
              </p>
            </div>
          </div>
        </Card>
        
        {/* Display newly created key */}
        {newlyCreatedKey && (
          <div className="mb-6 p-4 border rounded-md bg-muted/10">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-medium text-sm">New API Key Created</h3>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-8 w-8 p-0"
                onClick={() => setShowNewKey(!showNewKey)}
              >
                {showNewKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </Button>
            </div>
            <div className="flex bg-muted p-2 rounded-md mb-2">
              <code className="flex-1 text-xs overflow-hidden overflow-ellipsis">
                {showNewKey ? newlyCreatedKey : "•".repeat(40)}
              </code>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0 ml-2" 
                onClick={() => copyToClipboard(newlyCreatedKey)}
              >
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Make sure to copy your API key now. You won't be able to see it again!
            </p>
          </div>
        )}
        
        {/* List existing keys */}
        <div className="rounded-md border">
          <div className="grid grid-cols-12 gap-2 p-4 border-b bg-muted/50 text-sm font-medium text-muted-foreground">
            <div className="col-span-4">Name</div>
            <div className="col-span-4">Key</div>
            <div className="col-span-3">Created</div>
            <div className="col-span-1"></div>
          </div>
          
          {apiKeys.length === 0 ? (
            <div className="p-4 text-center text-sm text-muted-foreground">
              No API keys found. Create one to get started.
            </div>
          ) : (
            apiKeys.map(key => (
              <div key={key.id} className="grid grid-cols-12 gap-2 p-4 border-b last:border-0 items-center text-sm">
                <div className="col-span-4 font-medium">{key.name}</div>
                <div className="col-span-4 flex items-center">
                  <code className="bg-muted p-1 rounded text-xs">{key.prefix}•••••••••••••</code>
                </div>
                <div className="col-span-3 text-muted-foreground">
                  {new Date(key.createdAt).toLocaleDateString()}
                  {key.lastUsed && (
                    <div className="text-xs">
                      Last used: {new Date(key.lastUsed).toLocaleDateString()}
                    </div>
                  )}
                </div>
                <div className="col-span-1 flex justify-end">
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                    onClick={() => deleteKey(key.id)}
                  >
                    <Trash className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
        
        <Separator className="my-6" />
        
        {/* Create new key form */}
        <div>
          <h3 className="text-md font-medium mb-4">Create a New API Key</h3>
          <div className="flex gap-4 items-end">
            <div className="flex-1">
              <Label htmlFor="key-name" className="mb-2 block">Key Name</Label>
              <Input
                id="key-name"
                placeholder="e.g. Production Key"
                value={newKeyName}
                onChange={(e) => setNewKeyName(e.target.value)}
              />
            </div>
            <Button onClick={createNewKey} disabled={isCreating || !newKeyName} className="mb-[1px]">
              {isCreating ? "Creating..." : "Create Key"}
            </Button>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Give your key a descriptive name to remember where it's being used.
          </p>
        </div>
      </Card>
      
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-4">API Documentation</h2>
        <p className="text-muted-foreground mb-4">
          Learn how to integrate with our API and automate your ad generation workflow.
        </p>
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="p-4 border border-border">
            <div className="flex flex-col h-full">
              <h3 className="font-medium mb-2">Quickstart Guide</h3>
              <p className="text-sm text-muted-foreground mb-4 flex-grow">
                Learn the basics of authenticating and making your first API request.
              </p>
              <Button variant="outline" disabled>Coming Soon</Button>
            </div>
          </Card>
          
          <Card className="p-4 border border-border">
            <div className="flex flex-col h-full">
              <h3 className="font-medium mb-2">API Reference</h3>
              <p className="text-sm text-muted-foreground mb-4 flex-grow">
                Complete documentation of all available endpoints and parameters.
              </p>
              <Button variant="outline" disabled>Coming Soon</Button>
            </div>
          </Card>
        </div>
      </Card>
      
      <Card className="p-4 border-green-200 bg-green-50">
        <div className="flex gap-3">
          <KeyRound className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-semibold text-green-800">Pro Plan Feature</h3>
            <p className="text-green-700 text-sm">
              API access is included with your Pro plan subscription. You can create up to 5 API keys.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
} 