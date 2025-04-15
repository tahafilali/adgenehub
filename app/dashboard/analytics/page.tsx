"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { 
  BarChart, 
  LineChart, 
  PieChart, 
  ArrowUpRight, 
  Calendar, 
  Users, 
  Globe, 
  MessageSquare, 
  Lock 
} from "lucide-react";

export default function AnalyticsPage() {
  const { user } = useAuth();
  const [dateRange, setDateRange] = useState("7days");
  
  // Check user's subscription tier
  const isPro = user?.subscriptionTier === "pro";
  const isStarter = user?.subscriptionTier === "starter";
  const isFree = !isPro && !isStarter;

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between gap-4 items-start">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-muted-foreground">
            Track your campaign performance and insights
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant={dateRange === "7days" ? "default" : "outline"} 
            onClick={() => setDateRange("7days")}
            size="sm"
          >
            Last 7 Days
          </Button>
          <Button 
            variant={dateRange === "30days" ? "default" : "outline"} 
            onClick={() => setDateRange("30days")}
            size="sm"
          >
            Last 30 Days
          </Button>
          {(isPro || isStarter) && (
            <Button 
              variant={dateRange === "90days" ? "default" : "outline"} 
              onClick={() => setDateRange("90days")}
              size="sm"
            >
              Last 90 Days
            </Button>
          )}
          {isPro && (
            <Button 
              variant={dateRange === "custom" ? "default" : "outline"} 
              onClick={() => setDateRange("custom")}
              size="sm"
            >
              Custom
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Impressions
              </p>
              <h3 className="font-bold text-2xl mt-1">12,543</h3>
            </div>
            <LineChart className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-4 text-xs text-muted-foreground flex items-center">
            <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" />
            <span className="text-green-500 font-medium">8.2%</span>
            <span className="ml-1">from last period</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Click-through Rate
              </p>
              <h3 className="font-bold text-2xl mt-1">3.8%</h3>
            </div>
            <BarChart className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-4 text-xs text-muted-foreground flex items-center">
            <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" />
            <span className="text-green-500 font-medium">1.2%</span>
            <span className="ml-1">from last period</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Conversions
              </p>
              <h3 className="font-bold text-2xl mt-1">284</h3>
            </div>
            <PieChart className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-4 text-xs text-muted-foreground flex items-center">
            <ArrowUpRight className="h-3 w-3 mr-1 text-green-500" />
            <span className="text-green-500 font-medium">12.5%</span>
            <span className="ml-1">from last period</span>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-sm font-medium text-muted-foreground">
                Cost per Conversion
              </p>
              <h3 className="font-bold text-2xl mt-1">$4.28</h3>
            </div>
            <Calendar className="h-5 w-5 text-muted-foreground" />
          </div>
          <div className="mt-4 text-xs text-muted-foreground flex items-center">
            <ArrowUpRight className="h-3 w-3 mr-1 text-red-500 rotate-180" />
            <span className="text-red-500 font-medium">2.1%</span>
            <span className="ml-1">from last period</span>
          </div>
        </Card>
      </div>

      <Tabs defaultValue="performance" className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="demographics" disabled={isFree}>
            Demographics
            {isFree && <Lock className="ml-1 h-3 w-3" />}
          </TabsTrigger>
          <TabsTrigger value="geographic" disabled={isFree}>
            Geographic
            {isFree && <Lock className="ml-1 h-3 w-3" />}
          </TabsTrigger>
          <TabsTrigger value="advanced" disabled={!isPro}>
            Advanced Analytics
            {!isPro && <Lock className="ml-1 h-3 w-3" />}
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="performance">
          <Card className="p-6">
            <h3 className="text-lg font-medium mb-4">Campaign Performance</h3>
            
            {/* Placeholder for performance chart */}
            <div className="h-80 bg-muted/20 rounded-md flex items-center justify-center mb-4">
              <p className="text-muted-foreground">Performance chart would appear here</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              <Card className="p-4">
                <h4 className="text-sm font-medium mb-2">Top Performing Ad</h4>
                <p className="text-muted-foreground text-sm mb-2">
                  "Experience the power of our premium product..."
                </p>
                <div className="text-xs flex justify-between">
                  <span>CTR: 4.2%</span>
                  <span>Impressions: 5,241</span>
                  <span>Conversions: 124</span>
                </div>
              </Card>
              
              <Card className="p-4">
                <h4 className="text-sm font-medium mb-2">Performance by Device</h4>
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Mobile</span>
                    <span className="text-xs font-medium">68%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full">
                    <div className="h-2 bg-primary rounded-full" style={{ width: "68%" }}></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Desktop</span>
                    <span className="text-xs font-medium">24%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full">
                    <div className="h-2 bg-primary rounded-full" style={{ width: "24%" }}></div>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-xs">Tablet</span>
                    <span className="text-xs font-medium">8%</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full">
                    <div className="h-2 bg-primary rounded-full" style={{ width: "8%" }}></div>
                  </div>
                </div>
              </Card>
            </div>
          </Card>
        </TabsContent>
        
        <TabsContent value="demographics">
          {isFree ? (
            <Card className="p-6">
              <div className="flex flex-col items-center justify-center py-10">
                <Users className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Demographic Analytics</h3>
                <p className="text-muted-foreground text-center mb-4 max-w-md">
                  Upgrade to Starter or Pro plan to access demographic data including age, gender, and interest breakdowns.
                </p>
                <Button asChild>
                  <Link href="/dashboard/billing">
                    Upgrade Plan
                  </Link>
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Demographic Breakdown</h3>
              
              {/* Placeholder for demographics chart */}
              <div className="h-80 bg-muted/20 rounded-md flex items-center justify-center mb-4">
                <p className="text-muted-foreground">Demographics visualization would appear here</p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <h4 className="text-sm font-medium mb-4">Age Distribution</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs">18-24</span>
                      <span className="text-xs font-medium">15%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div className="h-2 bg-blue-500 rounded-full" style={{ width: "15%" }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs">25-34</span>
                      <span className="text-xs font-medium">42%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div className="h-2 bg-blue-500 rounded-full" style={{ width: "42%" }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs">35-44</span>
                      <span className="text-xs font-medium">28%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div className="h-2 bg-blue-500 rounded-full" style={{ width: "28%" }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs">45+</span>
                      <span className="text-xs font-medium">15%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div className="h-2 bg-blue-500 rounded-full" style={{ width: "15%" }}></div>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <h4 className="text-sm font-medium mb-4">Gender Distribution</h4>
                  <div className="flex items-center justify-center h-32">
                    <div className="w-32 h-32 rounded-full border-8 border-purple-500 relative">
                      <div 
                        className="absolute top-0 left-0 w-32 h-32 rounded-full border-8 border-transparent border-t-blue-500 border-r-blue-500"
                        style={{ transform: "rotate(126deg)" }}
                      ></div>
                      <div className="absolute inset-0 flex items-center justify-center flex-col">
                        <span className="text-xs text-muted-foreground">Male</span>
                        <span className="font-bold">35%</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between mt-4 text-xs">
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-purple-500 rounded-full mr-1"></div>
                      <span>Female: 65%</span>
                    </div>
                    <div className="flex items-center">
                      <div className="w-2 h-2 bg-blue-500 rounded-full mr-1"></div>
                      <span>Male: 35%</span>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <h4 className="text-sm font-medium mb-4">Top Interests</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Technology</span>
                      <span className="text-xs font-medium">68%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div className="h-2 bg-green-500 rounded-full" style={{ width: "68%" }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Fitness</span>
                      <span className="text-xs font-medium">52%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div className="h-2 bg-green-500 rounded-full" style={{ width: "52%" }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Travel</span>
                      <span className="text-xs font-medium">43%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div className="h-2 bg-green-500 rounded-full" style={{ width: "43%" }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Finance</span>
                      <span className="text-xs font-medium">37%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div className="h-2 bg-green-500 rounded-full" style={{ width: "37%" }}></div>
                    </div>
                  </div>
                </Card>
              </div>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="geographic">
          {isFree ? (
            <Card className="p-6">
              <div className="flex flex-col items-center justify-center py-10">
                <Globe className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Geographic Analytics</h3>
                <p className="text-muted-foreground text-center mb-4 max-w-md">
                  Upgrade to Starter or Pro plan to access geographic data including country, city, and language breakdowns.
                </p>
                <Button asChild>
                  <Link href="/dashboard/billing">
                    Upgrade Plan
                  </Link>
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Geographic Distribution</h3>
              
              {/* Placeholder for map visualization */}
              <div className="h-80 bg-muted/20 rounded-md flex items-center justify-center mb-4">
                <p className="text-muted-foreground">Geographic map visualization would appear here</p>
              </div>
              
              <div className="grid md:grid-cols-3 gap-4">
                <Card className="p-4">
                  <h4 className="text-sm font-medium mb-4">Top Countries</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs">United States</span>
                      <span className="text-xs font-medium">42%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div className="h-2 bg-amber-500 rounded-full" style={{ width: "42%" }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs">United Kingdom</span>
                      <span className="text-xs font-medium">18%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div className="h-2 bg-amber-500 rounded-full" style={{ width: "18%" }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Canada</span>
                      <span className="text-xs font-medium">12%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div className="h-2 bg-amber-500 rounded-full" style={{ width: "12%" }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Australia</span>
                      <span className="text-xs font-medium">8%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div className="h-2 bg-amber-500 rounded-full" style={{ width: "8%" }}></div>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <h4 className="text-sm font-medium mb-4">Top Cities</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs">New York</span>
                      <span className="text-xs font-medium">12%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div className="h-2 bg-amber-500 rounded-full" style={{ width: "12%" }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs">London</span>
                      <span className="text-xs font-medium">9%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div className="h-2 bg-amber-500 rounded-full" style={{ width: "9%" }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Los Angeles</span>
                      <span className="text-xs font-medium">7%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div className="h-2 bg-amber-500 rounded-full" style={{ width: "7%" }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Toronto</span>
                      <span className="text-xs font-medium">6%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div className="h-2 bg-amber-500 rounded-full" style={{ width: "6%" }}></div>
                    </div>
                  </div>
                </Card>
                
                <Card className="p-4">
                  <h4 className="text-sm font-medium mb-4">Languages</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-xs">English</span>
                      <span className="text-xs font-medium">76%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div className="h-2 bg-amber-500 rounded-full" style={{ width: "76%" }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs">Spanish</span>
                      <span className="text-xs font-medium">9%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div className="h-2 bg-amber-500 rounded-full" style={{ width: "9%" }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs">French</span>
                      <span className="text-xs font-medium">6%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div className="h-2 bg-amber-500 rounded-full" style={{ width: "6%" }}></div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-xs">German</span>
                      <span className="text-xs font-medium">4%</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full">
                      <div className="h-2 bg-amber-500 rounded-full" style={{ width: "4%" }}></div>
                    </div>
                  </div>
                </Card>
              </div>
            </Card>
          )}
        </TabsContent>
        
        <TabsContent value="advanced">
          {!isPro ? (
            <Card className="p-6">
              <div className="flex flex-col items-center justify-center py-10">
                <MessageSquare className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">Advanced Analytics</h3>
                <p className="text-muted-foreground text-center mb-4 max-w-md">
                  Upgrade to the Pro plan to access advanced analytics including conversion path analysis, predictive insights, and custom reporting.
                </p>
                <Button asChild>
                  <Link href="/dashboard/billing">
                    Upgrade to Pro
                  </Link>
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="p-6">
              <h3 className="text-lg font-medium mb-4">Advanced Analytics (Pro Feature)</h3>
              
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-md font-medium mb-2">Conversion Path Analysis</h4>
                  <div className="h-60 bg-muted/20 rounded-md flex items-center justify-center mb-4">
                    <p className="text-muted-foreground">Conversion path visualization would appear here</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Understand how users navigate through your funnel from first impression to conversion
                  </p>
                </div>
                
                <div>
                  <h4 className="text-md font-medium mb-2">Predictive Performance</h4>
                  <div className="h-60 bg-muted/20 rounded-md flex items-center justify-center mb-4">
                    <p className="text-muted-foreground">Predictive analytics visualization would appear here</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    AI-powered predictions of campaign performance based on current trends and historical data
                  </p>
                </div>
                
                <div>
                  <h4 className="text-md font-medium mb-2">Attribution Modeling</h4>
                  <div className="h-60 bg-muted/20 rounded-md flex items-center justify-center mb-4">
                    <p className="text-muted-foreground">Attribution model visualization would appear here</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Compare different attribution models to understand which touchpoints drive conversions
                  </p>
                </div>
                
                <div>
                  <h4 className="text-md font-medium mb-2">Custom Cohort Analysis</h4>
                  <div className="h-60 bg-muted/20 rounded-md flex items-center justify-center mb-4">
                    <p className="text-muted-foreground">Cohort analysis visualization would appear here</p>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Track performance metrics across different user segments over time
                  </p>
                </div>
              </div>
              
              <div className="mt-6">
                <Button variant="outline">
                  Export Custom Report
                </Button>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      
      {isFree && (
        <Card className="p-4 bg-amber-50 border-amber-200">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            <div>
              <h3 className="font-semibold text-amber-800">
                Unlock full analytics capabilities
              </h3>
              <p className="text-amber-700">
                Upgrade to Starter or Pro plan to access demographic data, geographic insights, and advanced analytics.
              </p>
            </div>
            <Button asChild size="sm" className="bg-amber-600 hover:bg-amber-700">
              <Link href="/dashboard/billing">
                Compare Plans
              </Link>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
} 