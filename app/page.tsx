import Link from "next/link"
import {
  Shield,
  Users,
  Award,
  ArrowRight,
  CheckCircle2,
  Zap,
  Globe,
  Heart,
  Calendar,
  Building2,
  Target,
  Sparkles,
} from "lucide-react"
import Footer from "@/components/footer"
import PublicNavbar from "@/components/public-navbar"

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Reusable Public Navbar */}
      <PublicNavbar />

      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 px-4 bg-gradient-to-b from-blue-50/40 via-background to-background dark:from-blue-950/20 dark:via-background dark:to-background">
        {/* Subtle Background Pattern & Glow */}
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] sm:w-[800px] h-[350px] bg-gradient-to-r from-blue-500/10 via-indigo-500/10 to-amber-500/10 blur-[120px] pointer-events-none rounded-full"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          {/* Government & University Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white dark:bg-card border border-slate-200/90 dark:border-border shadow-xs text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-300 mb-6">
            <Shield className="w-4 h-4 text-primary" />
            <span>Ministry of Youth Affairs & Sports • Gautam Buddha University</span>
          </div>

          {/* NSS Emblem Badge */}
          <div className="relative inline-flex items-center justify-center mb-6">
            <div className="absolute -inset-2 bg-gradient-to-r from-blue-600 via-indigo-600 to-amber-500 rounded-full blur-md opacity-25"></div>
            <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white dark:bg-card p-2 border-2 border-slate-200/80 dark:border-border shadow-xl flex items-center justify-center hover:scale-105 transition-transform duration-300">
              <img
                src="/nssLogo.png"
                alt="NSS Emblem"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Main Title */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-3">
            National Service <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 via-indigo-600 to-primary dark:from-blue-400 dark:to-indigo-300">Scheme</span>
          </h1>

          {/* Hindi Title & University */}
          <div className="flex items-center justify-center gap-2 flex-wrap text-base sm:text-xl font-bold text-slate-700 dark:text-slate-300 mb-3">
            <span>राष्ट्रीय सेवा योजना</span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            <span>गौतम बुद्ध विश्वविद्यालय</span>
          </div>

          {/* Official Motto Ribbon */}
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-300 text-xs sm:text-sm font-bold tracking-wide uppercase mb-6 shadow-xs">
            <span>Motto:</span>
            <span className="font-extrabold">"NOT ME BUT YOU"</span>
            <span>•</span>
            <span>स्वयं से पहले आप</span>
          </div>

          {/* Subtitle Description */}
          <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 font-normal max-w-2xl mx-auto leading-relaxed mb-8">
            Dedicated to youth empowerment, community development, and nation-building through selfless voluntary service. Join over 600 active student volunteers across 6 specialized units at GBU.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3.5 sm:gap-4 justify-center items-center mb-10">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm sm:text-base shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              Start Registration
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/whos-who"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white dark:bg-card border-2 border-slate-200 dark:border-border text-slate-800 dark:text-slate-200 font-bold text-sm sm:text-base hover:bg-slate-50 dark:hover:bg-muted hover:border-primary transition-all shadow-xs"
            >
              <Users className="w-4 h-4 text-primary" />
              Meet 6 NSS Units & POs
            </Link>
            <Link
              href="/about-nss"
              className="text-xs sm:text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-primary transition-colors underline-offset-4 hover:underline sm:ml-2"
            >
              Learn More →
            </Link>
          </div>

          {/* Quick Highlight Micro Pills */}
          <div className="pt-6 border-t border-slate-200/60 dark:border-border/60 flex items-center justify-center gap-3 sm:gap-6 flex-wrap text-xs font-semibold text-slate-600 dark:text-slate-400">
            <div className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>240 Hours Community Service</span>
            </div>
            <div className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>Government 'B' & 'C' Certificates</span>
            </div>
            <div className="inline-flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              <span>6 Official Units at GBU</span>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="about" className="py-20 sm:py-24 bg-gradient-to-b from-slate-50/50 via-white to-slate-50/50 dark:from-muted/20 dark:via-background dark:to-muted/20 border-t border-slate-200/60 dark:border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-3">
              Core Pillars of NSS • GBU
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Why Join the National Service Scheme?
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium leading-relaxed mt-3">
              NSS provides students with hands-on community service, leadership training, experiential field projects, and official Government certification.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {/* Card 1 */}
            <div className="group relative bg-white dark:bg-card rounded-3xl p-7 sm:p-8 border border-slate-200/90 dark:border-border shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-rose-500 to-pink-500"></div>
              <div>
                <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400 mb-6 group-hover:scale-110 transition-transform shadow-xs">
                  <Heart className="w-7 h-7" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  Community Service & Impact
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Engage in life-saving blood donation drives, health checkups, environmental cleanliness (Swachh Bharat), and adopted village welfare projects across Greater Noida.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-border/60 flex items-center gap-1.5 text-xs font-bold text-rose-600 dark:text-rose-400">
                <CheckCircle2 className="w-4 h-4" />
                Direct Field Engagement
              </div>
            </div>

            {/* Card 2 */}
            <div className="group relative bg-white dark:bg-card rounded-3xl p-7 sm:p-8 border border-slate-200/90 dark:border-border shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
              <div>
                <div className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 mb-6 group-hover:scale-110 transition-transform shadow-xs">
                  <Zap className="w-7 h-7" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  Leadership Development
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Cultivate team management, public address, organizational acumen, and crisis management skills through 7-day special annual residential camping programs.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-border/60 flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                <CheckCircle2 className="w-4 h-4" />
                Special Camping & Youth Training
              </div>
            </div>

            {/* Card 3 */}
            <div className="group relative bg-white dark:bg-card rounded-3xl p-7 sm:p-8 border border-slate-200/90 dark:border-border shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 overflow-hidden flex flex-col justify-between">
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 to-orange-500"></div>
              <div>
                <div className="w-14 h-14 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-6 group-hover:scale-110 transition-transform shadow-xs">
                  <Award className="w-7 h-7" />
                </div>
                <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white mb-3">
                  Government Certification
                </h3>
                <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Earn official Ministry of Youth Affairs & Sports certificates that carry special weightage in university admissions, public sector jobs, and competitive examinations.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-border/60 flex items-center gap-1.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                <CheckCircle2 className="w-4 h-4" />
                Nationally Recognized Credentials
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 sm:py-20 bg-slate-50 dark:bg-muted/30 border-y border-slate-200/80 dark:border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">
              Impact by the Numbers
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              GBU NSS At a Glance
            </h3>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4 sm:gap-6">
            {/* Stat 1 */}
            <div className="relative bg-white dark:bg-card rounded-2xl p-6 border border-slate-200/90 dark:border-border shadow-xs hover:shadow-md transition-shadow text-center flex flex-col items-center justify-center group overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600"></div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-blue-600 dark:text-blue-400 tracking-tight mb-1">
                600+
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                Active Volunteers
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Across 6 NSS Units
              </div>
            </div>

            {/* Stat 2 */}
            <div className="relative bg-white dark:bg-card rounded-2xl p-6 border border-slate-200/90 dark:border-border shadow-xs hover:shadow-md transition-shadow text-center flex flex-col items-center justify-center group overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-600"></div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-emerald-600 dark:text-emerald-400 tracking-tight mb-1">
                100+
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                Activities Conducted
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Drives, Camps & Seminars
              </div>
            </div>

            {/* Stat 3 */}
            <div className="relative bg-white dark:bg-card rounded-2xl p-6 border border-slate-200/90 dark:border-border shadow-xs hover:shadow-md transition-shadow text-center flex flex-col items-center justify-center group overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-600"></div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-indigo-600 dark:text-indigo-400 tracking-tight mb-1">
                10+
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                Projects Completed
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Village & Social Outreach
              </div>
            </div>

            {/* Stat 4 */}
            <div className="relative bg-white dark:bg-card rounded-2xl p-6 border border-slate-200/90 dark:border-border shadow-xs hover:shadow-md transition-shadow text-center flex flex-col items-center justify-center group overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-amber-600"></div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-amber-600 dark:text-amber-400 tracking-tight mb-1">
                8
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                Schools
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Pan-University Coverage
              </div>
            </div>

            {/* Stat 5 */}
            <div className="relative bg-white dark:bg-card rounded-2xl p-6 border border-slate-200/90 dark:border-border shadow-xs hover:shadow-md transition-shadow text-center flex flex-col items-center justify-center group overflow-hidden col-span-2 sm:col-span-1">
              <div className="absolute top-0 left-0 right-0 h-1 bg-purple-600"></div>
              <div className="text-3xl sm:text-4xl lg:text-5xl font-black text-purple-600 dark:text-purple-400 tracking-tight mb-1">
                10+
              </div>
              <div className="text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200">
                Years of Service
              </div>
              <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                Dedicated Community Impact
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-secondary/10"></div>
        <div className="max-w-5xl mx-auto text-center px-4 relative z-10">
          <h2 className="text-4xl font-bold text-foreground mb-6">Ready to Serve the Nation?</h2>
          <p className="text-muted-foreground mb-10 text-lg max-w-2xl mx-auto leading-relaxed">
            Join thousands of students who are making a difference through the National Service Scheme. Start your
            journey today.
          </p>
          <Link
            href="/register"
            className="group inline-flex items-center px-12 py-4 bg-gradient-to-r from-primary to-secondary text-white rounded-xl hover:from-primary/90 hover:to-secondary/90 transition-all duration-300 font-semibold text-lg shadow-2xl hover:shadow-3xl hover:scale-105 active:scale-95"
          >
            Register Now
            <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform duration-300" />
          </Link>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
