"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter, usePathname } from "next/navigation"
import Link from "next/link"
import VolunteerSidebar from "@/components/volunteer/VolunteerSidebar"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import { Loader2, Menu } from "lucide-react"

export default function VolunteerDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { data: session, status } = useSession()
  const router = useRouter()
  const pathname = usePathname()
  const [checkingProfile, setCheckingProfile] = useState(true)
  const [mobileOpen, setMobileOpen] = useState(false)

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false)
  }, [pathname])

  // Prevent body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => {
      document.body.style.overflow = ""
    }
  }, [mobileOpen])

  useEffect(() => {
    // Immediate logging to track lifecycle
    console.log("Layout Effect Run. Status:", status, "Session User:", session?.user);

    if (status === "loading") return
    
    // Handle unauthenticated state immediately to prevent hanging
    if (status === "unauthenticated" || !session) {
      console.log("User unauthenticated in Layout, stopping profile check.");
      setCheckingProfile(false);
      return;
    }

    const user = session?.user as any
    // Extra safety
    if (!user) {
       console.log("Authenticated but no user object, stopping check.");
       setCheckingProfile(false);
       return;
    }
    
    // Allow access to profile page always
    if (pathname === "/dashboard/profile") {
      setCheckingProfile(false)
      return
    }
    
    // Check profile completion for other pages
    const checkProfile = async () => {
      console.log("Checking profile for user:", user);
      
      if (!user || !user.id) {
         setCheckingProfile(false)
         return
      }

      try {
        console.log("Fetching profile completion status...");
        const res = await fetch("/api/volunteer/profile")
        const data = await res.json()
        console.log("Profile data received:", data);
        
        if (data.success) { 
             if (data.completion && data.completion.percent < 100) {
                 console.log("Profile incomplete, redirecting to /dashboard/profile");
                 router.push("/dashboard/profile")
                 return
             }
             
             if (data.completion && data.completion.percent === 100) {
                 console.log("Profile complete. Checking projects...");
                 const projectRes = await fetch("/api/volunteer/projects")
                 const projectData = await projectRes.json()
                 
                 // If no project selected and not on projects page, redirect to projects
                 if (!projectData.selectedProject && pathname !== "/dashboard/projects") {
                   console.log("No project selected, redirecting to /dashboard/projects");
                   router.push("/dashboard/projects")
                   return
                 }
             }
        }
      } catch (error) {
        console.error("Error checking profile:", error)
      } finally {
        console.log("Finished checking profile, setting checkingProfile = false");
        setCheckingProfile(false)
      }
    }
    
    // Safety timeout - IF profile check hangs, force show dashboard after 5s
    const timer = setTimeout(() => {
        if (checkingProfile) {
            console.warn("Profile check timed out, forcing dashboard render.");
            setCheckingProfile(false);
        }
    }, 5000); // 5 seconds timeout

    checkProfile()
    
    return () => clearTimeout(timer);
  }, [session, status, pathname, router])

  const getVolunteerPageTitle = (path: string) => {
    if (path === "/dashboard") return "Dashboard"
    if (path.startsWith("/dashboard/profile")) return "Complete Profile"
    if (path.startsWith("/dashboard/projects")) return "NSS Projects"
    if (path.startsWith("/dashboard/application")) return "My Application"
    if (path.startsWith("/dashboard/id-card")) return "ID Card"
    if (path.startsWith("/dashboard/events")) return "Events & Activities"
    if (path.startsWith("/dashboard/meetings")) return "Meetings"
    if (path.startsWith("/dashboard/grievances")) return "Grievances"
    if (path.startsWith("/dashboard/reports")) return "Reports & Issues"
    if (path.startsWith("/dashboard/tasks")) return "Tasks"
    if (path.startsWith("/dashboard/settings")) return "Settings"
    if (path.startsWith("/dashboard/change-password")) return "Change Password"
    if (path.startsWith("/dashboard/social-posts")) return "Social Media"
    return "Volunteer Portal"
  }

  if (status === "loading" || checkingProfile) {
    console.log("Dashboard Layout Rendering Loader. Status:", status, "CheckingProfile:", checkingProfile);
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
        <p className="text-muted-foreground animate-pulse">Loading Dashboard...</p>
        <div className="text-xs text-muted-foreground/50">
           Status: {status} | Checking: {checkingProfile.toString()}
        </div>
      </div>
    )
  }

  return (
    <ProtectedRoute requiredRole="volunteer">
      <div className="flex h-screen bg-background overflow-hidden">
        {/* Volunteer Sidebar */}
        <VolunteerSidebar
          mobileOpen={mobileOpen}
          onClose={() => setMobileOpen(false)}
        />

        <div className="flex-1 flex flex-col overflow-hidden min-w-0">
          {/* Universal Mobile Header for Volunteers (below lg) */}
          <header className="lg:hidden flex items-center justify-between px-3.5 py-3 bg-card border-b border-border shadow-xs z-30 shrink-0 sticky top-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <button
                onClick={() => setMobileOpen(true)}
                className="w-9 h-9 rounded-xl flex items-center justify-center bg-muted hover:bg-muted/80 text-foreground transition-all duration-150 active:scale-95 shrink-0"
                aria-label="Open volunteer navigation menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 min-w-0">
                <img src="/nssLogo.png" alt="NSS Logo" className="w-7 h-7 object-contain shrink-0" />
                <div className="min-w-0">
                  <span className="font-bold text-sm text-foreground block leading-tight truncate">
                    NSS Volunteer
                  </span>
                  <span className="text-[11px] text-muted-foreground font-medium block leading-tight truncate">
                    {getVolunteerPageTitle(pathname)}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/dashboard/profile"
                className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-muted transition-colors"
                title="My Profile"
              >
                <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shadow-xs">
                  {session?.user?.name ? session.user.name.charAt(0).toUpperCase() : "V"}
                </div>
              </Link>
            </div>
          </header>

          <main className="flex-1 overflow-y-auto scroll-smooth overscroll-contain">{children}</main>
        </div>
      </div>
    </ProtectedRoute>
  )
}
