import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Mail, MessageSquare, Phone, MapPin } from "lucide-react";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

export const metadata = {
  title: "Contact Us - AdGenie",
  description: "Get in touch with our team for support, sales inquiries, or partnerships",
};

export default function ContactPage() {
  return (
    <>
      <Header />
      <main className="container mx-auto py-10">
        <h1 className="text-3xl font-bold mb-6">Contact Us</h1>
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="text-center mb-16">
            <h1 className="text-4xl font-bold tracking-tight sm:text-5xl mb-4">
              Get in Touch
            </h1>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Have questions about AdGenie? Our team is here to help.
              Reach out and we&apos;ll get back to you as soon as possible.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="lg:col-span-2">
              <Card className="p-6 md:p-8">
                <h2 className="text-2xl font-bold mb-6">Send Us a Message</h2>
                <form className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label htmlFor="name" className="text-sm font-medium">
                        Name
                      </label>
                      <input
                        type="text"
                        id="name"
                        name="name"
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="Your name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <label htmlFor="email" className="text-sm font-medium">
                        Email
                      </label>
                      <input
                        type="email"
                        id="email"
                        name="email"
                        className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="subject" className="text-sm font-medium">
                      Subject
                    </label>
                    <input
                      type="text"
                      id="subject"
                      name="subject"
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="How can we help you?"
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="message" className="text-sm font-medium">
                      Message
                    </label>
                    <textarea
                      id="message"
                      name="message"
                      rows={5}
                      className="w-full px-3 py-2 border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                      placeholder="Tell us more about your inquiry..."
                      required
                    ></textarea>
                  </div>

                  <Button type="submit" className="w-full md:w-auto">
                    Send Message
                  </Button>
                </form>
              </Card>
            </div>

            <div className="lg:col-span-1">
              <Card className="p-6 md:p-8 mb-6">
                <h2 className="text-xl font-bold mb-6">Contact Information</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Mail className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Email</h3>
                      <p className="text-muted-foreground">support@adgenie.com</p>
                      <p className="text-muted-foreground">sales@adgenie.com</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <Phone className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Phone</h3>
                      <p className="text-muted-foreground">+1 (555) 123-4567</p>
                      <p className="text-muted-foreground">Mon-Fri: 9AM-6PM EST</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="bg-primary/10 p-2 rounded-full">
                      <MapPin className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-medium">Location</h3>
                      <p className="text-muted-foreground">123 AI Street</p>
                      <p className="text-muted-foreground">San Francisco, CA 94103</p>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6 md:p-8">
                <h2 className="text-xl font-bold mb-6">Live Chat Support</h2>
                <div className="flex items-start gap-3 mb-4">
                  <div className="bg-primary/10 p-2 rounded-full">
                    <MessageSquare className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-medium">Chat with Support</h3>
                    <p className="text-muted-foreground">
                      Our team is available for live chat during business hours.
                    </p>
                  </div>
                </div>
                <Button variant="outline" className="w-full">
                  Start Live Chat
                </Button>
              </Card>
            </div>
          </div>

          <div className="mt-16 max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">Frequently Asked Questions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-border rounded-lg p-6">
                <h3 className="font-semibold mb-2">How does the free trial work?</h3>
                <p className="text-muted-foreground">
                  Our 14-day free trial gives you full access to all features. No credit card required until you decide to continue.
                </p>
              </div>
              <div className="border border-border rounded-lg p-6">
                <h3 className="font-semibold mb-2">Can I cancel my subscription anytime?</h3>
                <p className="text-muted-foreground">
                  Yes, you can cancel your subscription at any time with no cancellation fees.
                </p>
              </div>
              <div className="border border-border rounded-lg p-6">
                <h3 className="font-semibold mb-2">Do you offer custom enterprise plans?</h3>
                <p className="text-muted-foreground">
                  Yes, we offer custom enterprise solutions. Contact our sales team to discuss your specific requirements.
                </p>
              </div>
              <div className="border border-border rounded-lg p-6">
                <h3 className="font-semibold mb-2">What platforms do you support?</h3>
                <p className="text-muted-foreground">
                  AdGenie supports all major advertising platforms including Google Ads, Facebook, Instagram, Twitter, and LinkedIn.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
} 