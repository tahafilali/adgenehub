"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { useAuth } from "@/context/auth-context"
import { User, LogOut } from "lucide-react"

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false)
  const { user, signOut } = useAuth()

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10)
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleDashboardClick = () => {
    // Use direct navigation instead of Link to avoid middleware issues
    window.location.href = '/dashboard'
  }

  return (
    <header className={`sticky top-0 z-50 w-full transition-all duration-300 ${isScrolled ? 'bg-background/95 backdrop-blur-sm shadow-sm' : 'bg-background'}`}>
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="font-bold text-2xl">
        AdGeneHub
        </Link>
        
        <nav className="hidden md:flex gap-8 font-medium">
          <Link href="/features" className="hover:text-primary transition-colors">
            Features
          </Link>
          <Link href="/pricing" className="hover:text-primary transition-colors">
            Pricing
          </Link>
          <Link href="/contact" className="hover:text-primary transition-colors">
            Contact
          </Link>
        </nav>
        
        <div className="flex items-center space-x-3 md:space-x-4">
          <ModeToggle />
          
          {user ? (
            <>
              <Button 
                variant="outline" 
                className="flex items-center gap-2"
                onClick={handleDashboardClick}
              >
                <User className="h-4 w-4" />
                Dashboard
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="text-muted-foreground hover:text-foreground"
                onClick={() => signOut()}
                title="Sign out"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </>
          ) : (
            <>
              <Link href="/login">
                <Button variant="outline" className="btn-hover">
                  Log in
                </Button>
              </Link>
              <Link href="/signup" className="hidden sm:block">
                <Button className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 btn-hover">
                  Sign up
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
} 