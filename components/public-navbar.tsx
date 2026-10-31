"use client"

import React, { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu, X } from "lucide-react"

export default function PublicNavbar() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const pathname = usePathname()

  const navLinks = [
    { label: "Home", href: "/" },
    { label: "About NSS", href: "/about-nss" },
    { label: "Who's Who", href: "/whos-who" },
  ]

  const isActive = (href: string) => {
    if (href === "/") {
      return pathname === "/"
    }
    return pathname?.startsWith(href)
  }

  return (
    <header className="bg-white/90 dark:bg-card/90 backdrop-blur-md border-b border-slate-200/80 dark:border-border/60 sticky top-0 z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-20">
          {/* Logos & University Title */}
          <Link href="/" className="flex items-center gap-2 sm:gap-3 shrink-0 group">
            <img
              src="/1.png"
              alt="GBU Logo"
              className="w-9 h-9 sm:w-11 sm:h-11 object-contain rounded-full shadow-xs bg-white p-0.5 border border-slate-200/80 shrink-0"
            />
            <img
              src="/nssLogo.png"
              alt="NSS Logo"
              className="w-9 h-9 sm:w-11 sm:h-11 object-contain rounded-full shadow-xs bg-white p-0.5 border border-slate-200/80 shrink-0"
            />
            <img
              src="/myBharatLogo.png"
              alt="My Bharat Logo"
              className="h-8 sm:h-10 w-auto object-contain hidden sm:block shrink-0"
            />
            <div className="hidden md:block pl-2.5 border-l border-slate-200 dark:border-border">
              <span className="font-bold text-sm block leading-tight text-slate-900 dark:text-white">
                National Service Scheme
              </span>
              <span className="text-xs text-slate-500 dark:text-muted-foreground block leading-tight">
                Gautam Buddha University
              </span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1.5 lg:gap-3">
            {navLinks.map((item) => {
              const active = isActive(item.href)
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`text-xs sm:text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ${
                    active
                      ? "text-primary bg-primary/10"
                      : "text-slate-700 dark:text-slate-200 hover:text-primary hover:bg-slate-100 dark:hover:bg-muted"
                  }`}
                >
                  {item.label}
                </Link>
              )
            })}
            <Link
              href="/login"
              className="text-xs sm:text-sm font-semibold px-3 py-1.5 sm:px-4 sm:py-2 border border-slate-300 dark:border-border rounded-lg hover:bg-slate-100 dark:hover:bg-muted transition-all ml-1"
            >
              Login
            </Link>
            <Link
              href="/register"
              className="text-xs sm:text-sm font-semibold px-3.5 py-1.5 sm:px-4 sm:py-2 bg-primary text-primary-foreground rounded-lg shadow-sm hover:bg-primary/90 transition-all active:scale-95"
            >
              Apply
            </Link>
          </nav>

          {/* Mobile Right Controls (Apply Pill + Hamburger) */}
          <div className="flex md:hidden items-center gap-2 shrink-0">
            <Link
              href="/register"
              className="text-xs font-semibold px-3 py-1.5 bg-primary text-primary-foreground rounded-lg shadow-xs active:scale-95 transition-transform"
            >
              Apply
            </Link>
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="w-9 h-9 rounded-xl flex items-center justify-center bg-slate-100 dark:bg-muted text-slate-800 dark:text-slate-200 hover:bg-slate-200 transition-colors focus:outline-hidden"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Slide-down Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200/80 dark:border-border/60 bg-white/98 dark:bg-card/98 px-4 py-3 space-y-1 shadow-lg animate-in slide-in-from-top-2 duration-200">
          {navLinks.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`block px-3 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  active
                    ? "text-primary bg-primary/10"
                    : "text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-muted"
                }`}
              >
                {item.label}
              </Link>
            )
          })}
          <Link
            href="/login"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-muted"
          >
            Portal Login
          </Link>
          <Link
            href="/register"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-sm font-semibold text-primary-foreground bg-primary text-center mt-2"
          >
            Apply Now (Register)
          </Link>
        </div>
      )}
    </header>
  )
}

