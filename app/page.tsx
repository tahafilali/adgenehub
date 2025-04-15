import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Zap, BarChart3, Target, ArrowRight } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export default function Home() {
  return (
    <>
      <Header />
      <div className="flex flex-col min-h-screen">
        {/* Hero Section */}
        <section className="py-20 md:py-28 bg-gradient-to-b from-background to-muted/30">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center gap-12">
              <div className="md:w-1/2 space-y-6">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight">
                  Create AI-Powered Ads That <span className="text-primary bg-primary/10 px-2 py-1 rounded">Convert</span>
                </h1>
                <p className="text-xl text-muted-foreground">
                  AdGenie helps marketers create high-performing ad campaigns in minutes, not days. Our AI understands your audience and crafts messaging that drives results.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 pt-4">
                  <Button size="lg" asChild>
                    <Link href="/signup">
                      Start Free Trial
                    </Link>
                  </Button>
                  <Button size="lg" variant="outline" asChild>
                    <Link href="/features">
                      See How It Works
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="md:w-1/2">
                <div className="bg-background border border-border p-6 rounded-lg shadow-lg">
                  <div className="aspect-video bg-muted rounded-md flex items-center justify-center">
                    <p className="text-2xl font-bold text-primary/40">AdGenie Dashboard</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="py-16 bg-muted/50">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
              <div className="space-y-2">
                <p className="text-4xl font-bold text-primary">85%</p>
                <p className="text-sm text-muted-foreground">Time Saved</p>
              </div>
              <div className="space-y-2">
                <p className="text-4xl font-bold text-primary">10x</p>
                <p className="text-sm text-muted-foreground">Ad Variations</p>
              </div>
              <div className="space-y-2">
                <p className="text-4xl font-bold text-primary">32%</p>
                <p className="text-sm text-muted-foreground">Higher CTR</p>
              </div>
              <div className="space-y-2">
                <p className="text-4xl font-bold text-primary">2,500+</p>
                <p className="text-sm text-muted-foreground">Happy Users</p>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Powerful Features for Better Ads</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Our AI-powered platform generates high-converting ad copy for any platform, saving you time and boosting performance.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-background p-6 rounded-lg border border-border hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">AI-Powered Generation</h3>
                <p className="text-muted-foreground">
                  Create compelling ad copy, headlines, and descriptions tailored to your specific audience and goals.
                </p>
              </div>
              
              <div className="bg-background p-6 rounded-lg border border-border hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Target className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Audience Targeting</h3>
                <p className="text-muted-foreground">
                  Optimize your messaging for specific demographic segments and customer personas.
                </p>
              </div>
              
              <div className="bg-background p-6 rounded-lg border border-border hover:shadow-md transition-shadow">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <BarChart3 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-xl font-bold mb-2">Performance Analytics</h3>
                <p className="text-muted-foreground">
                  Track campaign metrics and get AI-powered recommendations to improve performance.
                </p>
              </div>
            </div>
            
            <div className="text-center mt-10">
              <Button variant="outline" asChild>
                <Link href="/features" className="flex items-center gap-2">
                  Explore All Features <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted by Marketers</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                See what our customers are saying about AdGenie
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="bg-background p-6 rounded-lg border border-border">
                <div className="flex items-center gap-2 text-amber-400 mb-4">
                  ★★★★★
                </div>
                <blockquote className="text-muted-foreground mb-4">
                  &quot;AdGenie has transformed our ad creation process. We&apos;re creating more engaging ads in a fraction of the time it used to take us.&quot;
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">JD</div>
                  <div>
                    <p className="font-medium">Jessica Davis</p>
                    <p className="text-sm text-muted-foreground">Marketing Director, TechFlow</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-background p-6 rounded-lg border border-border">
                <div className="flex items-center gap-2 text-amber-400 mb-4">
                  ★★★★★
                </div>
                <blockquote className="text-muted-foreground mb-4">
                  &quot;We&apos;ve seen a 27% increase in click-through rates since switching to AdGenie. The AI consistently produces better ad copy than our team did manually.&quot;
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">MR</div>
                  <div>
                    <p className="font-medium">Michael Rodriguez</p>
                    <p className="text-sm text-muted-foreground">Founder, GrowthBoost</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-background p-6 rounded-lg border border-border">
                <div className="flex items-center gap-2 text-amber-400 mb-4">
                  ★★★★★
                </div>
                <blockquote className="text-muted-foreground mb-4">
                  &quot;As a small business owner, AdGenie has been a game-changer. I can now run professional ad campaigns without needing to hire a marketing agency.&quot;
                </blockquote>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">SK</div>
                  <div>
                    <p className="font-medium">Sarah Kim</p>
                    <p className="text-sm text-muted-foreground">Owner, Bloom Boutique</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-primary/5">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Transform Your Ad Campaigns?</h2>
              <p className="text-lg text-muted-foreground mb-8">
                Join thousands of marketers who are saving time and improving results with AdGenie&apos;s AI-powered platform.
              </p>
              <div className="flex flex-col sm:flex-row justify-center gap-4">
                <Button size="lg" className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700" asChild>
                  <Link href="/signup">Start Your Free Trial</Link>
                </Button>
                <Button size="lg" variant="outline" asChild>
                  <Link href="/pricing">View Pricing</Link>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                No credit card required. 14-day free trial.
              </p>
            </div>
          </div>
        </section>

        {/* Logos Section */}
        <section className="py-12 border-t border-border">
          <div className="container mx-auto px-4">
            <p className="text-center text-sm text-muted-foreground mb-8">
              TRUSTED BY INNOVATIVE COMPANIES
            </p>
            <div className="flex flex-wrap justify-center gap-8 md:gap-16 opacity-60">
              {/* Simple placeholder logos */}
              <div className="h-8 w-24 bg-muted rounded"></div>
              <div className="h-8 w-24 bg-muted rounded"></div>
              <div className="h-8 w-24 bg-muted rounded"></div>
              <div className="h-8 w-24 bg-muted rounded"></div>
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
}
