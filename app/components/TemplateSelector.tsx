import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

// Define template interface
interface Template {
  id: string;
  name: string;
  description: string;
  preview_text: string;
  category: string;
  tier: string;
}

interface TemplateSelectorProps {
  onSelectTemplate: (template: Template) => void;
  userTier?: string; // The user's current subscription tier
}

export function TemplateSelector({ onSelectTemplate, userTier = 'basic' }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTier, setSelectedTier] = useState<string>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [categories, setCategories] = useState<string[]>([]);

  // Fetch templates from the API
  useEffect(() => {
    const fetchTemplates = async () => {
      setLoading(true);
      try {
        // Build query params
        const params = new URLSearchParams();
        if (selectedTier !== 'all') {
          params.append('tier', selectedTier);
        }
        if (selectedCategory !== 'all') {
          params.append('category', selectedCategory);
        }
        
        const response = await fetch(`/api/templates?${params.toString()}`);
        if (!response.ok) {
          throw new Error('Failed to fetch templates');
        }
        
        const data = await response.json();
        
        // Filter templates by search term if provided
        let filteredTemplates = data.templates;
        if (searchTerm) {
          const term = searchTerm.toLowerCase();
          filteredTemplates = filteredTemplates.filter((template: Template) => 
            template.name.toLowerCase().includes(term) || 
            template.description.toLowerCase().includes(term) || 
            template.category.toLowerCase().includes(term)
          );
        }
        
        setTemplates(filteredTemplates);
        
        // Extract unique categories for the filter
        const uniqueCategories = Array.from(
          new Set(data.templates.map((t: Template) => t.category))
        ).filter(Boolean) as string[];
        
        setCategories(uniqueCategories);
        setError(null);
      } catch (err) {
        console.error('Error fetching templates:', err);
        setError('Failed to load templates. Please try again later.');
        setTemplates([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTemplates();
  }, [selectedTier, selectedCategory, searchTerm]);
  
  // Check if user has access to a template based on their subscription tier
  const hasAccess = (templateTier: string): boolean => {
    if (userTier === 'pro') return true; // Pro users have access to all tiers
    if (userTier === 'starter') return templateTier !== 'pro'; // Starter users have access to basic and starter
    return templateTier === 'basic'; // Basic users only have access to basic
  };
  
  // Format category name for display
  const formatCategory = (category: string): string => {
    return category
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  // Get tier color for badges
  const getTierColor = (tier: string): string => {
    switch (tier) {
      case 'basic':
        return 'bg-blue-100 text-blue-800';
      case 'starter':
        return 'bg-green-100 text-green-800';
      case 'pro':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="w-full">
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <Label htmlFor="search">Search Templates</Label>
          <Input
            id="search"
            placeholder="Search by name or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full"
          />
        </div>
        
        <div className="w-full sm:w-40">
          <Label htmlFor="tier-filter">Tier</Label>
          <Select value={selectedTier} onValueChange={setSelectedTier}>
            <SelectTrigger id="tier-filter">
              <SelectValue placeholder="Select tier" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tiers</SelectItem>
              <SelectItem value="basic">Basic</SelectItem>
              <SelectItem value="starter">Starter</SelectItem>
              <SelectItem value="pro">Pro</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="w-full sm:w-40">
          <Label htmlFor="category-filter">Category</Label>
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger id="category-filter">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {categories.map((category) => (
                <SelectItem key={category} value={category}>
                  {formatCategory(category)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      
      {loading && <div className="text-center py-10">Loading templates...</div>}
      
      {error && (
        <div className="text-center py-10 text-red-500">
          {error}
        </div>
      )}
      
      {!loading && !error && templates.length === 0 && (
        <div className="text-center py-10 text-gray-500">
          No templates found. Try adjusting your filters.
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <Card key={template.id} className="flex flex-col h-full">
            <CardHeader>
              <div className="flex justify-between items-start">
                <CardTitle className="text-lg">{template.name}</CardTitle>
                <Badge className={`${getTierColor(template.tier)}`}>
                  {template.tier.charAt(0).toUpperCase() + template.tier.slice(1)}
                </Badge>
              </div>
              <CardDescription>
                {template.category && (
                  <Badge variant="outline" className="mt-1">
                    {formatCategory(template.category)}
                  </Badge>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-grow">
              <p className="text-sm text-gray-600 mb-4">{template.description}</p>
              <div className="bg-gray-50 p-3 rounded-md">
                <p className="text-sm font-mono">{template.preview_text}</p>
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={() => onSelectTemplate(template)} 
                disabled={!hasAccess(template.tier)}
                className="w-full"
                variant={hasAccess(template.tier) ? "default" : "outline"}
              >
                {hasAccess(template.tier) 
                  ? "Use This Template" 
                  : `Upgrade to ${template.tier} to Use`}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      
      {!loading && templates.length > 0 && (
        <div className="mt-6 text-center text-sm text-gray-500">
          Showing {templates.length} templates
        </div>
      )}
    </div>
  );
} 