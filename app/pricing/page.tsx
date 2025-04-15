import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Pricing - AdGenie",
  description: "Choose the right plan for your advertising needs",
};

export default function PricingPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Pricing</h1>
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
            Simple, Transparent Pricing
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that works best for your advertising needs.
            All plans include core features with different usage limits.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Free Plan */}
          <Card className="flex flex-col p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-4">
              <h3 className="text-lg font-medium">Free</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold">$0</span>
                <span className="ml-1 text-muted-foreground">/month</span>
              </div>
            </div>
            <p className="text-muted-foreground mb-6">
              Perfect for getting started with AI-generated ads.
            </p>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span>5 AI ad generations/month</span>
              </li>
              <li className="flex gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Basic ad templates</span>
              </li>
              <li className="flex gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Community support</span>
              </li>
            </ul>
            <Button asChild className="w-full" variant="outline">
              <Link href="/signup">Get Started</Link>
            </Button>
          </Card>

          {/* Starter Plan */}
          <Card className="flex flex-col p-6 border border-border shadow-md relative bg-secondary/10 hover:shadow-lg transition-shadow">
            <div className="absolute -top-4 right-4">
              <span className="bg-primary text-primary-foreground text-xs font-semibold px-3 py-1 rounded-full">
                Popular
              </span>
            </div>
            <div className="mb-4">
              <h3 className="text-lg font-medium">Starter</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold">$29</span>
                <span className="ml-1 text-muted-foreground">/month</span>
              </div>
            </div>
            <p className="text-muted-foreground mb-6">
              Great for small businesses and marketing teams.
            </p>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span>50 AI ad generations/month</span>
              </li>
              <li className="flex gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span>All ad templates</span>
              </li>
              <li className="flex gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Campaign analytics</span>
              </li>
              <li className="flex gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Email support</span>
              </li>
              <li className="flex gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Ad performance tracking</span>
              </li>
            </ul>
            <Button asChild className="w-full">
              <Link href="/signup?plan=starter">Start Free Trial</Link>
            </Button>
          </Card>

          {/* Pro Plan */}
          <Card className="flex flex-col p-6 border border-border shadow-sm hover:shadow-md transition-shadow">
            <div className="mb-4">
              <h3 className="text-lg font-medium">Pro</h3>
              <div className="mt-4 flex items-baseline">
                <span className="text-4xl font-bold">$99</span>
                <span className="ml-1 text-muted-foreground">/month</span>
              </div>
            </div>
            <p className="text-muted-foreground mb-6">
              For agencies and growing businesses with advanced needs.
            </p>
            <ul className="space-y-3 mb-8 flex-1">
              <li className="flex gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Unlimited AI ad generations</span>
              </li>
              <li className="flex gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Custom brand voice training</span>
              </li>
              <li className="flex gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Advanced analytics dashboard</span>
              </li>
              <li className="flex gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Priority support</span>
              </li>
              <li className="flex gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span>Multi-user accounts</span>
              </li>
              <li className="flex gap-2">
                <Check className="h-5 w-5 text-primary flex-shrink-0" />
                <span>API access</span>
              </li>
            </ul>
            <Button asChild className="w-full" variant="outline">
              <Link href="/signup?plan=pro">Start Free Trial</Link>
            </Button>
          </Card>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold mb-4">Need a custom solution?</h2>
          <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
            We offer custom plans for larger teams and enterprise clients.
            Contact us to discuss your specific requirements.
          </p>
          <Button asChild variant="outline">
            <Link href="/contact">Contact Sales</Link>
          </Button>
        </div>
      </main>
      <Footer />
    </>
  );
} 