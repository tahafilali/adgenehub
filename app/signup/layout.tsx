import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: "Sign Up - AdGenie",
  description: "Create your AdGenie account and start creating AI-powered ads today",
};

export default function SignupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 