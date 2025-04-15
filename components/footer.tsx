import Link from "next/link"

export function Footer() {
  return (
    <footer className="border-t py-6 md:py-10">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <div className="text-center text-sm md:text-left">
          <p className="text-muted-foreground">
            &copy; {new Date().getFullYear()} AdGenie. All rights reserved.
          </p>
        </div>
        <div className="flex gap-4">
          <Link href="/terms" className="text-sm text-muted-foreground underline underline-offset-4">
            Terms
          </Link>
          <Link href="/privacy" className="text-sm text-muted-foreground underline underline-offset-4">
            Privacy
          </Link>
          <Link href="/about" className="text-sm text-muted-foreground underline underline-offset-4">
            About
          </Link>
        </div>
      </div>
    </footer>
  )
} 