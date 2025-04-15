import Link from "next/link";
import { Button } from "@/components/ui/button";
import { 
  Wand2, 
  BarChart3, 
  Target, 
  Sparkles, 
  RefreshCcw, 
  Users, 
  Code, 
  Zap
} from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Features - AdGenie",
  description: "Explore the powerful features of AdGenie's AI-powered ad creation platform",
};

export default function FeaturesPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Features</h1>
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
              Powerful Features for Better Ad Campaigns
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Discover how AdGenie helps you create, optimize, and manage your advertising with AI-powered tools.
            </p>
          </div>

          {/* Hero Feature */}
          <div className="bg-muted/50 rounded-xl p-8 md:p-12 mb-16">
            <div className="flex flex-col md:flex-row gap-8 items-center">
              <div className="md:w-1/2">
                <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary mb-4">
                  Core Technology
                </div>
                <h2 className="text-3xl font-bold mb-4">AI-Powered Ad Generation</h2>
                <p className="text-muted-foreground mb-6">
                  Our advanced AI analyzes your product, target audience, and marketing goals to generate 
                  tailored, high-converting ad copy and concepts in seconds. Say goodbye to creative blocks 
                  and hello to endless inspiration.
                </p>
                <Button asChild>
                  <Link href="/signup">Try It Free</Link>
                </Button>
              </div>
              <div className="md:w-1/2 bg-background rounded-xl p-6 shadow-md border border-border">
                <div className="aspect-video flex items-center justify-center bg-primary/5 rounded-lg">
                  <Wand2 className="h-20 w-20 text-primary opacity-80" />
                </div>
              </div>
            </div>
          </div>

          {/* Feature Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
            {/* Feature 1 */}
            <div className="bg-background p-8 rounded-xl border border-border hover:shadow-md transition-shadow">
              <div className="bg-primary/10 w-12 h-12 flex items-center justify-center rounded-lg mb-4">
                <BarChart3 className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Performance Analytics</h3>
              <p className="text-muted-foreground mb-4">
                Track every aspect of your ad campaigns with detailed analytics. Understand what's working, 
                what isn't, and how to optimize for better results and ROI.
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary"></span>
                  </div>
                  <span>Real-time performance tracking</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary"></span>
                  </div>
                  <span>Conversion rate optimization</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary"></span>
                  </div>
                  <span>Detailed ROI reporting</span>
                </li>
              </ul>
            </div>

            {/* Feature 2 */}
            <div className="bg-background p-8 rounded-xl border border-border hover:shadow-md transition-shadow">
              <div className="bg-primary/10 w-12 h-12 flex items-center justify-center rounded-lg mb-4">
                <Target className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Audience Targeting</h3>
              <p className="text-muted-foreground mb-4">
                Create ads that speak directly to your ideal customers. Our AI helps you identify and 
                target the right audience segments with messaging that resonates.
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary"></span>
                  </div>
                  <span>Demographic analysis</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary"></span>
                  </div>
                  <span>Behavior-based targeting</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary"></span>
                  </div>
                  <span>Custom audience creator</span>
                </li>
              </ul>
            </div>

            {/* Feature 3 */}
            <div className="bg-background p-8 rounded-xl border border-border hover:shadow-md transition-shadow">
              <div className="bg-primary/10 w-12 h-12 flex items-center justify-center rounded-lg mb-4">
                <Sparkles className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Smart Templates</h3>
              <p className="text-muted-foreground mb-4">
                Start with professionally designed templates optimized for different platforms and objectives. 
                Customize them with your brand elements for a consistent look and feel.
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary"></span>
                  </div>
                  <span>Platform-specific templates</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary"></span>
                  </div>
                  <span>Brand customization tools</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary"></span>
                  </div>
                  <span>One-click A/B variants</span>
                </li>
              </ul>
            </div>

            {/* Feature 4 */}
            <div className="bg-background p-8 rounded-xl border border-border hover:shadow-md transition-shadow">
              <div className="bg-primary/10 w-12 h-12 flex items-center justify-center rounded-lg mb-4">
                <RefreshCcw className="h-6 w-6 text-primary" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Continuous Optimization</h3>
              <p className="text-muted-foreground mb-4">
                Our AI doesn't just create ads—it learns and improves from performance data. Get recommendations 
                for optimizing underperforming ads and scaling what works.
              </p>
              <ul className="space-y-2 mb-4">
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary"></span>
                  </div>
                  <span>AI-driven improvement suggestions</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary"></span>
                  </div>
                  <span>Automated A/B testing</span>
                </li>
                <li className="flex items-start gap-2">
                  <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                    <span className="h-2.5 w-2.5 rounded-full bg-primary"></span>
                  </div>
                  <span>Performance trend analysis</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Additional Features List */}
          <div className="bg-muted/50 rounded-xl p-8 md:p-12 mb-16">
            <h2 className="text-2xl font-bold mb-8 text-center">Additional Powerful Features</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex flex-col items-center text-center p-4">
                <div className="bg-background w-14 h-14 flex items-center justify-center rounded-full mb-4 shadow-sm border border-border">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium mb-2">Team Collaboration</h3>
                <p className="text-sm text-muted-foreground">
                  Work together seamlessly with role-based permissions and shared workspaces.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center p-4">
                <div className="bg-background w-14 h-14 flex items-center justify-center rounded-full mb-4 shadow-sm border border-border">
                  <Code className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium mb-2">API Integration</h3>
                <p className="text-sm text-muted-foreground">
                  Connect AdGenie with your existing tools and workflows through our developer-friendly API.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center p-4">
                <div className="bg-background w-14 h-14 flex items-center justify-center rounded-full mb-4 shadow-sm border border-border">
                  <Zap className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium mb-2">One-Click Publishing</h3>
                <p className="text-sm text-muted-foreground">
                  Push your ads directly to major platforms with our integrated publishing tools.
                </p>
              </div>
              
              <div className="flex flex-col items-center text-center p-4">
                <div className="bg-background w-14 h-14 flex items-center justify-center rounded-full mb-4 shadow-sm border border-border">
                  <Sparkles className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-medium mb-2">Brand Voice Training</h3>
                <p className="text-sm text-muted-foreground">
                  Train our AI to write in your brand's unique voice and style for consistent messaging.
                </p>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Ad Strategy?</h2>
            <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
              Start creating high-performing ads that connect with your audience and drive results.
              Try AdGenie free for 14 days, no credit card required.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button asChild size="lg">
                <Link href="/signup">Start Free Trial</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/demo">Request Demo</Link>
              </Button>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
} 