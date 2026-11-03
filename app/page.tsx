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
  Image as ImageIcon,
} from "lucide-react"
import Footer from "@/components/footer"
import PublicNavbar from "@/components/public-navbar"
import dbConnect from "@/lib/mongodb"
import Gallery from "@/models/Gallery"

async function getFeaturedGallery() {
  try {
    await dbConnect()
    const items = await Gallery.find()
      .select("title category imageUrl eventDate createdAt")
      .sort({ isFeatured: -1, createdAt: -1 })
      .limit(4)
      .lean()
    return items
  } catch {
    return []
  }
}

export default async function HomePage() {
  const galleryItems = await getFeaturedGallery()

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

          {/* Main Title - Uniform Color for National Service Scheme */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.1] mb-3">
            National Service Scheme
          </h1>

          {/* Hindi Title & University */}
          <div className="flex items-center justify-center gap-2 flex-wrap text-base sm:text-xl font-bold text-slate-700 dark:text-slate-300 mb-3">
            <span>राष्ट्रीय सेवा योजना</span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            <span>गौतम बुद्ध विश्वविद्यालय</span>
          </div>

          {/* Official Motto Ribbon */}
          <div className="inline-flex items-center px-4 py-1 rounded-full bg-amber-500/[0.07] border border-amber-500/20 text-slate-800 dark:text-slate-200 text-xs sm:text-sm font-bold tracking-wider uppercase mb-6">
            <span>"NOT ME BUT YOU"</span>
          </div>

          {/* Subtitle Description */}
          <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 font-normal max-w-2xl mx-auto leading-relaxed mb-8">
            Dedicated to youth empowerment, community development, and nation-building through selfless voluntary service. Join over 600 active student volunteers across 6 specialized units at GBU.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col sm:flex-row gap-3.5 sm:gap-4 justify-center items-center">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold text-sm sm:text-base shadow-lg shadow-primary/25 hover:bg-primary/90 hover:shadow-xl hover:scale-105 active:scale-95 transition-all"
            >
              Start Registration
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/about-nss"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white dark:bg-card border-2 border-slate-200 dark:border-border text-slate-800 dark:text-slate-200 font-bold text-sm sm:text-base hover:bg-slate-50 dark:hover:bg-muted hover:border-primary transition-all shadow-xs"
            >
              Learn More
              <ArrowRight className="w-4 h-4 text-primary" />
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="about" className="py-20 sm:py-24 bg-gradient-to-b from-slate-50/50 via-white to-slate-50/50 dark:from-muted/20 dark:via-background dark:to-muted/20 border-t border-slate-200/60 dark:border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-3">
              Core Benefits of NSS
            </div>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              Why Join the National Service Scheme?
            </h2>

          </div>

          {/* 5 Core Benefits Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
            {/* Card 1: Hands-on Community Service */}
            <div className="group relative bg-white dark:bg-card rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-border shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-rose-500 to-pink-500"></div>
              <div className="flex items-start gap-3.5 mb-2.5">
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 border border-rose-200/80 dark:border-rose-900 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                  <Heart className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug pt-1">
                  Hands-on Community Service
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Engage directly in impactful local initiatives across Greater Noida, including life-saving blood donation drives, health checkups, and Swachh Bharat environmental cleanliness campaigns.
              </p>
            </div>

            {/* Card 2: Leadership Development */}
            <div className="group relative bg-white dark:bg-card rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-border shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-600 to-indigo-600"></div>
              <div className="flex items-start gap-3.5 mb-2.5">
                <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900 flex items-center justify-center text-blue-600 dark:text-blue-400 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug pt-1">
                  Leadership Development
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Build essential real-world skills like team management, public speaking, organizational acumen, and crisis management.
              </p>
            </div>

            {/* Card 3: Special Residential Camping */}
            <div className="group relative bg-white dark:bg-card rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-border shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-teal-500 to-emerald-600"></div>
              <div className="flex items-start gap-3.5 mb-2.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200/80 dark:border-emerald-900 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug pt-1">
                  Special Residential Camping
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Participate in immersive 7-day annual residential camping programs designed for intensive youth training and community bonding.
              </p>
            </div>
          </div>

          {/* Cards 4 & 5 Centered */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-5 mt-4 sm:mt-5 max-w-4xl mx-auto">
            {/* Card 4: Government Certification */}
            <div className="group relative bg-white dark:bg-card rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-border shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
              <div className="flex items-start gap-3.5 mb-2.5">
                <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200/80 dark:border-amber-900 flex items-center justify-center text-amber-600 dark:text-amber-400 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                  <Award className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug pt-1">
                  Government Certification
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Earn official credentials from the Ministry of Youth Affairs & Sports, Government of India.
              </p>
            </div>

            {/* Card 5: Academic & Career Weightage */}
            <div className="group relative bg-white dark:bg-card rounded-2xl p-5 sm:p-6 border border-slate-200/90 dark:border-border shadow-xs hover:shadow-lg transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 to-purple-600"></div>
              <div className="flex items-start gap-3.5 mb-2.5">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/80 dark:border-indigo-900 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:scale-105 transition-transform shadow-2xs">
                  <Target className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white leading-snug pt-1">
                  Academic & Career Weightage
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Use your nationally recognized certificates to gain an edge in university admissions, public sector job applications, and competitive examinations.
              </p>
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

            </div>
          </div>
        </div>
      </section>

      {/* 6 NSS Units Overview */}
      <section className="py-20 sm:py-24 bg-white dark:bg-card border-t border-slate-200/60 dark:border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2">
                Operational Structure • GBU
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                6 NSS Units
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium mt-1">
                Guided by NSS Program Coordinator Dr. Nagendra Singh and 6 Unit Program Officers.
              </p>
            </div>
            <Link
              href="/whos-who"
              className="inline-flex items-center gap-2 text-sm font-bold text-primary hover:underline group shrink-0"
            >
              <span>View Hierarchy & Contact Details</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { unit: "Unit 1", po: "Dr. Gaurav Kumar", color: "from-blue-600 to-indigo-600" },
              { unit: "Unit 2", po: "Dr. Bhaswati Banerjee", color: "from-indigo-600 to-purple-600" },
              { unit: "Unit 3", po: "Dr. Rahul Kapoor", color: "from-purple-600 to-blue-600" },
              { unit: "Unit 4", po: "Dr. Rakesh Kumar", color: "from-emerald-600 to-teal-600" },
              { unit: "Unit 5", po: "Dr. Shrutee Kanwar", color: "from-teal-600 to-emerald-600" },
              { unit: "Unit 6", po: "Dr. Samar Raqshin", color: "from-blue-600 to-cyan-600" },
            ].map((item) => (
              <div
                key={item.unit}
                className="relative bg-slate-50/70 dark:bg-muted/40 rounded-2xl p-5 border border-slate-200/80 dark:border-border/60 hover:border-primary/50 transition-all hover:-translate-y-0.5 group overflow-hidden"
              >
                <div className={`absolute top-0 left-0 right-0 h-1 bg-gradient-to-r ${item.color}`}></div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    {item.unit}
                  </span>
                  <span className="w-2 h-2 rounded-full bg-emerald-500" title="Active Unit"></span>
                </div>
                <h4 className="text-lg font-bold text-slate-900 dark:text-white group-hover:text-primary transition-colors">
                  {item.po}
                </h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Program Officer (PO)
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Program Curriculum / Structure */}
      <section className="py-20 sm:py-24 bg-gradient-to-b from-slate-50/50 via-white to-slate-50/50 dark:from-muted/20 dark:via-background dark:to-muted/20 border-t border-slate-200/60 dark:border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-3">
              Official Scheme Guidelines
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
              2-Year NSS Service Framework
            </h2>
            <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium mt-2">
              Volunteers complete 240 hours of hands-on community engagement over two years to qualify for the National Certificate.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-white dark:bg-card rounded-2xl p-6 sm:p-7 border border-slate-200/90 dark:border-border shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center font-black text-xl mb-4 border border-blue-200/60 dark:border-blue-900">
                  120
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Regular Activities / Year
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Weekly community service sessions, campus cleanliness, literacy classes, tree plantation, and blood donation assistance across the university.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-border/60 text-xs font-semibold text-slate-500">
                120 hrs × 2 Years = 240 Total Hours
              </div>
            </div>

            <div className="bg-white dark:bg-card rounded-2xl p-6 sm:p-7 border border-slate-200/90 dark:border-border shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-black text-xl mb-4 border border-emerald-200/60 dark:border-emerald-900">
                  7
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Special Annual Camping Days
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  A mandatory 7-day residential village immersion camp focusing on rural health, sanitation, socio-economic surveys, and community infrastructure.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-border/60 text-xs font-semibold text-slate-500">
                Adopted Villages in Greater Noida
              </div>
            </div>

            <div className="bg-white dark:bg-card rounded-2xl p-6 sm:p-7 border border-slate-200/90 dark:border-border shadow-xs flex flex-col justify-between">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center font-black text-xl mb-4 border border-amber-200/60 dark:border-amber-900">
                  A/B
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  Government NSS Certificate
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                  Official certificates issued by Ministry of Youth Affairs & Sports, awarding academic weightage and special preference in competitive recruitment.
                </p>
              </div>
              <div className="mt-5 pt-3 border-t border-slate-100 dark:border-border/60 text-xs font-semibold text-slate-500">
                Signed by Vice Chancellor & Coordinator
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Photo Gallery Showcase */}
      <section className="py-20 sm:py-24 bg-white dark:bg-card border-t border-slate-200/60 dark:border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-2">
                Visual Showcase • GBU NSS
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                Photo Gallery Highlights
              </h2>
              <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium mt-1">
                Recent moments of community impact, special camps, and volunteer drives.
              </p>
            </div>
            <Link
              href="/gallery"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border-2 border-slate-200 dark:border-border hover:border-primary text-xs sm:text-sm font-bold text-slate-800 dark:text-slate-200 hover:text-primary transition-all group shrink-0 shadow-2xs"
            >
              <span>Explore Full Gallery</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform text-primary" />
            </Link>
          </div>

          {galleryItems && galleryItems.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              {galleryItems.map((photo: any) => (
                <Link
                  key={photo._id.toString()}
                  href="/gallery"
                  className="group relative bg-slate-50 dark:bg-muted/40 rounded-2xl overflow-hidden border border-slate-200/80 dark:border-border/60 shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 block"
                >
                  <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-100 dark:bg-muted/60">
                    <img
                      src={photo.imageUrl}
                      alt={photo.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <div className="absolute top-2.5 left-2.5">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/20">
                        {photo.category}
                      </span>
                    </div>
                  </div>
                  <div className="p-3.5 space-y-1">
                    <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-primary transition-colors">
                      {photo.title}
                    </h3>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-primary" />
                      {new Date(photo.eventDate || photo.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="bg-slate-50 dark:bg-muted/20 border border-slate-200/80 dark:border-border/60 rounded-3xl p-10 text-center space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto">
                <ImageIcon className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-base text-slate-900 dark:text-white">NSS Photo Gallery</h3>
              <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 max-w-md mx-auto">
                Browse our high-resolution photo archives of special camps, tree plantations, blood donation drives, and official convocations.
              </p>
              <Link
                href="/gallery"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground text-xs sm:text-sm font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-xs"
              >
                Open Photo Gallery
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Official Enrollment CTA Section */}
      <section className="py-16 sm:py-20 bg-white dark:bg-background border-t border-slate-200/80 dark:border-border/60">
        <div className="max-w-4xl mx-auto px-4 text-center space-y-6">
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Ready to Serve the Nation?
          </h2>

          <div className="pt-1">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 px-8 py-3.5 sm:px-9 sm:py-4 bg-primary text-primary-foreground font-bold text-sm sm:text-base rounded-xl shadow-md shadow-primary/20 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all"
            >
              <span>Enroll as Volunteer</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  )
}
