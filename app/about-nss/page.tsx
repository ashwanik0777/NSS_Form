"use client"

import React from "react"
import Link from "next/link"
import {
  Shield,
  Heart,
  Award,
  Users,
  Compass,
  Calendar,
  Sparkles,
  ArrowRight,
  ExternalLink,
  Target,
  GraduationCap,
  CheckCircle2,
  Sun,
  Flame,
  Check,
  Building2,
  BookOpen,
} from "lucide-react"
import Footer from "@/components/footer"
import PublicNavbar from "@/components/public-navbar"

export default function AboutNSSPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50/70 via-white to-slate-50/70 dark:from-background dark:via-background dark:to-muted/20 text-foreground flex flex-col">
      {/* Reusable Public Navbar */}
      <PublicNavbar />

      {/* Hero Section - Clean, Light & Prestigious Institutional Look */}
      <section className="relative overflow-hidden py-14 sm:py-20 px-4 bg-gradient-to-b from-blue-50/60 via-white to-slate-50/50 dark:from-blue-950/20 dark:via-background dark:to-background border-b border-slate-200/80 dark:border-border/60">
        {/* Subtle Background Pattern & Glows */}
        <div className="absolute inset-0 opacity-30 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none"></div>
        <div className="absolute -top-20 -left-20 w-80 h-80 bg-amber-500/10 blur-[90px] rounded-full pointer-events-none"></div>
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-blue-500/10 blur-[90px] rounded-full pointer-events-none"></div>

        <div className="max-w-4xl mx-auto text-center relative z-10 space-y-4">
          {/* Government Ministry Badge */}


          {/* NSS Emblem Badge */}
          <div className="relative inline-flex items-center justify-center my-2">
            <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-white dark:bg-card p-2 border-2 border-amber-400/80 dark:border-amber-400 shadow-xl flex items-center justify-center hover:scale-105 transition-transform duration-300">
              <img
                src="/nssLogo.png"
                alt="NSS Emblem - Konark Rath Wheel"
                className="w-full h-full object-contain"
              />
            </div>
          </div>

          {/* Main Title */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white leading-[1.15]">
            National Service Scheme <span className="text-primary">(NSS)</span>
          </h1>

          {/* Hindi Title & University */}
          <div className="flex items-center justify-center gap-2 flex-wrap text-base sm:text-lg font-bold text-slate-700 dark:text-slate-300">
            <span>राष्ट्रीय सेवा योजना</span>
            <span className="w-1.5 h-1.5 rounded-full bg-primary"></span>
            <span>गौतम बुद्ध विश्वविद्यालय</span>
          </div>

          {/* Official Motto Ribbon */}
          <div className="inline-flex items-center gap-2 px-4 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-900 dark:text-amber-300 text-xs sm:text-sm font-extrabold tracking-wider uppercase">
            <span>"NOT ME BUT YOU"</span>
            <span>•</span>
            <span>स्वयं से पहले आप</span>
          </div>

          {/* Subtitle Description */}
          <p className="text-sm sm:text-base md:text-lg text-slate-600 dark:text-slate-400 max-w-2xl mx-auto leading-relaxed pt-1">
            Fostering the spirit of selfless voluntary service, civic responsibility, and holistic nation-building among youth at Gautam Buddha University.
          </p>

          {/* Action CTAs */}
          <div className="pt-3 flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm shadow-md shadow-primary/20 hover:bg-primary/90 hover:scale-105 active:scale-95 transition-all"
            >
              Enroll as Volunteer
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/whos-who"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white dark:bg-card border-2 border-slate-200 dark:border-border hover:border-primary text-slate-800 dark:text-slate-200 font-bold text-sm shadow-xs hover:bg-slate-50 dark:hover:bg-muted transition-all"
            >
              <Users className="w-4 h-4 text-primary" />
              <span>View 6 NSS Units & POs</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Area */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 flex-1 w-full space-y-12 sm:space-y-16">
        {/* Key Quick Fact Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-5">
          <div className="relative bg-white dark:bg-card rounded-2xl p-5 border border-slate-200/90 dark:border-border/60 shadow-xs text-center overflow-hidden hover:shadow-md transition-shadow">
            <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600"></div>
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-primary flex items-center justify-center mx-auto mb-2 border border-blue-200/60 dark:border-blue-900">
              <Calendar className="w-5 h-5" />
            </div>
            <span className="block text-2xl font-black text-slate-900 dark:text-white">1969</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-tight">
              Launched in Gandhiji's Centenary Year
            </span>
          </div>

          <div className="relative bg-white dark:bg-card rounded-2xl p-5 border border-slate-200/90 dark:border-border/60 shadow-xs text-center overflow-hidden hover:shadow-md transition-shadow">
            <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mx-auto mb-2 border border-amber-200/60 dark:border-amber-900">
              <Sun className="w-5 h-5" />
            </div>
            <span className="block text-2xl font-black text-slate-900 dark:text-white">Konark Wheel</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-tight">
              Symbol of Continuous Social Progress
            </span>
          </div>

          <div className="relative bg-white dark:bg-card rounded-2xl p-5 border border-slate-200/90 dark:border-border/60 shadow-xs text-center overflow-hidden hover:shadow-md transition-shadow">
            <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mx-auto mb-2 border border-emerald-200/60 dark:border-emerald-900">
              <Award className="w-5 h-5" />
            </div>
            <span className="block text-2xl font-black text-slate-900 dark:text-white">240 Hours</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-tight">
              Community Service over 2 Academic Years
            </span>
          </div>

          <div className="relative bg-white dark:bg-card rounded-2xl p-5 border border-slate-200/90 dark:border-border/60 shadow-xs text-center overflow-hidden hover:shadow-md transition-shadow">
            <div className="absolute top-0 left-0 right-0 h-1 bg-indigo-500"></div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mx-auto mb-2 border border-indigo-200/60 dark:border-indigo-900">
              <Users className="w-5 h-5" />
            </div>
            <span className="block text-2xl font-black text-slate-900 dark:text-white">6 Units</span>
            <span className="text-xs text-slate-500 dark:text-slate-400 font-medium leading-tight">
              Guided by Dedicated Program Officers
            </span>
          </div>
        </div>

        {/* Section 1: Introduction to NSS */}
        <section className="bg-white dark:bg-card rounded-3xl p-6 sm:p-10 border border-slate-200/90 dark:border-border/60 shadow-xs space-y-6">
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-primary border border-blue-200/70 dark:border-blue-900 shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Overview</span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white leading-tight">
                Introduction to the National Service Scheme
              </h2>
            </div>
          </div>

          {/* Highlight Quote Box */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/70 via-indigo-50/40 to-slate-50 dark:from-blue-950/40 dark:via-muted/20 dark:to-background border-l-4 border-primary text-slate-800 dark:text-slate-200">
            <p className="text-sm sm:text-base font-semibold leading-relaxed italic">
              "The central objective of NSS is to provide youth with direct community service experience without any bias, ensuring dignity, social justice, and progress for every section of society."
            </p>
          </div>

          <div className="text-slate-600 dark:text-slate-300 space-y-4 text-sm sm:text-base leading-relaxed font-normal">
            <p>
              The <strong>National Service Scheme (NSS)</strong> is a central sector scheme administered by the{" "}
              <strong>Ministry of Youth Affairs & Sports, Government of India</strong>. Launched during Mahatma Gandhi’s Centenary Year in <strong>1969</strong>, NSS has grown into one of the world's largest youth volunteer organizations, mobilizing millions of university and college students toward constructive nation-building.
            </p>

            <p>
              At <strong>Gautam Buddha University (GBU), Greater Noida</strong>, NSS acts as a dynamic bridge between students and the broader social reality of surrounding rural and semi-urban communities. Volunteers actively participate in blood donation camps, environmental cleanups, tree plantations, literacy drives, and rural sanitation campaigns.
            </p>

            <p>
              Through this continuous service, students develop leadership acumen, emotional maturity, democratic tolerance, and an empathetic perspective toward the socio-economic challenges of our country.
            </p>
          </div>
        </section>

        {/* Section 2: Motto and Logo of NSS - Clean & Elegant Light Theme */}
        <section className="bg-white dark:bg-card rounded-3xl p-6 sm:p-10 border border-slate-200/90 dark:border-border/60 shadow-xs relative overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Logo Display Card */}
            <div className="lg:col-span-5 flex flex-col items-center text-center p-6 rounded-2xl bg-gradient-to-b from-amber-50/60 via-slate-50/60 to-blue-50/50 dark:from-amber-950/20 dark:via-muted/20 dark:to-background border border-amber-200/80 dark:border-amber-900/40 shadow-xs">
              <div className="w-36 h-36 sm:w-44 sm:h-44 rounded-full bg-white dark:bg-card p-3 shadow-xl border-4 border-amber-400 flex items-center justify-center hover:scale-105 transition-transform duration-300">
                <img
                  src="/nssLogo.png"
                  alt="NSS Emblem - Konark Rath Wheel"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="mt-4 text-xs font-bold text-primary uppercase tracking-widest">
                The Official NSS Emblem
              </span>
              <p className="text-slate-900 dark:text-white text-base font-extrabold mt-0.5">
                Konark Sun Temple Rath Wheel
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs">
                Odisha, India • 24 Spokes representing 24 hours of relentless service
              </p>
            </div>

            {/* Explanation Column */}
            <div className="lg:col-span-7 space-y-4 sm:space-y-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Philosophical Foundation
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-0.5">
                  Motto and Logo Symbolism
                </h2>
              </div>

              {/* Motto Box */}
              <div className="bg-amber-50/80 dark:bg-amber-950/30 rounded-2xl p-4 sm:p-5 border border-amber-200/90 dark:border-amber-900/50 space-y-1.5">
                <h3 className="text-base sm:text-lg font-bold text-amber-900 dark:text-amber-300 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-rose-500" />
                  Motto: “NOT ME BUT YOU” (स्वयं से पहले आप)
                </h3>
                <p className="text-xs sm:text-sm text-slate-700 dark:text-slate-300 leading-relaxed font-normal">
                  The motto reflects the essence of democratic living and selfless public duty. It underscores that an individual's welfare is inextricably intertwined with the welfare of society as a whole.
                </p>
              </div>

              {/* Explanatory Cards */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-muted/30 border border-slate-200/80 dark:border-border/60">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-1">
                    The Rath Wheel of Konark:
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    The NSS logo is inspired by the monumental chariot wheel of the world-renowned Konark Sun Temple in Odisha. The wheel represents the cyclical harmony of creation, conservation, and continuous striving for social change.
                  </p>
                </div>

                <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-muted/30 border border-slate-200/80 dark:border-border/60">
                  <h4 className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white mb-1">
                    Significance of the Colors:
                  </h4>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                    <strong>Navy Blue</strong> represents the vast cosmos, of which NSS is a modest yet proactive contributor. <strong>Red</strong> signifies youthful dynamism, boundless enthusiasm, and heartfelt compassion for nation-building.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Activities & Camping Programs */}
        <section className="space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Structure</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              Activities & Camping Framework
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              A comprehensive dual-track program designed for balanced personal growth and social impact
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {/* Card 1 */}
            <div className="relative bg-white dark:bg-card p-6 rounded-2xl border border-slate-200/90 dark:border-border/60 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-blue-600"></div>
              <div>
                <div className="w-11 h-11 rounded-xl bg-blue-50 dark:bg-blue-950/60 flex items-center justify-center text-primary mb-3.5 border border-blue-200/70 dark:border-blue-900">
                  <Calendar className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">
                  1. Regular Activities
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  Conducted year-round across university semesters, including weekly meetings, campus cleanliness, literacy campaigns, tree plantation drives, and health awareness events.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-border/60 text-xs font-semibold text-primary flex items-center justify-between">
                <span>120 Hours / Academic Year</span>
                <CheckCircle2 className="w-4 h-4 text-primary" />
              </div>
            </div>

            {/* Card 2 */}
            <div className="relative bg-white dark:bg-card p-6 rounded-2xl border border-slate-200/90 dark:border-border/60 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-amber-500"></div>
              <div>
                <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-950/60 flex items-center justify-center text-amber-600 dark:text-amber-400 mb-3.5 border border-amber-200/70 dark:border-amber-900">
                  <Sun className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">
                  2. 7-Day Special Camp
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  An intensive 7-day annual residential immersion camp in adopted villages around Greater Noida. Volunteers work directly with villagers in community development and sanitation.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-border/60 text-xs font-semibold text-amber-600 dark:text-amber-400 flex items-center justify-between">
                <span>Residential Village Immersion</span>
                <CheckCircle2 className="w-4 h-4 text-amber-500" />
              </div>
            </div>

            {/* Card 3 */}
            <div className="relative bg-white dark:bg-card p-6 rounded-2xl border border-slate-200/90 dark:border-border/60 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow overflow-hidden">
              <div className="absolute top-0 left-0 right-0 h-1 bg-emerald-500"></div>
              <div>
                <div className="w-11 h-11 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 flex items-center justify-center text-emerald-600 dark:text-emerald-400 mb-3.5 border border-emerald-200/70 dark:border-emerald-900">
                  <Compass className="w-5 h-5" />
                </div>
                <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-2">
                  3. Integration & Adventure
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed font-normal">
                  Opportunities to represent GBU in National Integration Camps (NIC), Pre-Republic Day Camps, disaster relief teams, and state/national adventure expeditions.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-border/60 text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center justify-between">
                <span>National Representation</span>
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
              </div>
            </div>
          </div>
        </section>

        {/* Section 4: Benefits to an NSS Volunteer */}
        <section className="bg-white dark:bg-card rounded-3xl p-6 sm:p-10 border border-slate-200/90 dark:border-border/60 shadow-xs space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Personal Transformation
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white mt-1">
              Core Benefits for Volunteers
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Shaping students into empathetic leaders, skilled organizers, and responsible global citizens
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-muted/30 border border-slate-200/80 dark:border-border/60 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-primary border border-blue-200/60 dark:border-blue-900 flex items-center justify-center mb-3.5 shadow-2xs">
                <Target className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5">
                A Visionary Social Leader
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Develops practical problem-solving capabilities, public speaking, group dynamics, and crisis handling in real-world scenarios.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-muted/30 border border-slate-200/80 dark:border-border/60 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/60 dark:border-amber-900 flex items-center justify-center mb-3.5 shadow-2xs">
                <Award className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5">
                A Competent Administrator
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Gains hands-on experience in project planning, institutional coordination, budget management, and logistics execution.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-muted/30 border border-slate-200/80 dark:border-border/60 flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-900 flex items-center justify-center mb-3.5 shadow-2xs">
                <Heart className="w-6 h-6" />
              </div>
              <h3 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white mb-1.5">
                A Compassionate Citizen
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed font-normal">
                Builds genuine social empathy, breaks socio-economic barriers, and understands the dignity of honest collective labor.
              </p>
            </div>
          </div>

          {/* Certificate Notice Pill */}
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-blue-50/80 via-emerald-50/50 to-slate-50 dark:from-blue-950/30 dark:via-emerald-950/20 dark:to-background border border-blue-200/80 dark:border-blue-900/60 text-center max-w-2xl mx-auto">
            <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200 leading-relaxed block">
              🎖️ <strong>Official Certification:</strong> Upon completing 240 hours of service and the 7-day special camp, volunteers earn government certificates signed by university authorities, conferring academic and career preference.
            </span>
          </div>
        </section>

        {/* Section 5: Clean, Light & Inviting Enrollment CTA */}
        <section className="relative rounded-3xl overflow-hidden bg-white dark:bg-card p-8 sm:p-12 text-center border border-slate-200/90 dark:border-border/60 shadow-xs space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200/80 dark:border-blue-900 text-xs font-semibold text-primary">
            <Sparkles className="w-3.5 h-3.5 text-primary" />
            <span>Admissions Open for GBU Volunteers</span>
          </div>

          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Ready to Begin Your NSS Journey?
          </h2>

          <p className="text-xs sm:text-sm md:text-base text-slate-600 dark:text-slate-400 max-w-xl mx-auto leading-relaxed font-normal">
            Step forward to make an enduring impact. Register online, get assigned to your academic unit, and embark on a rewarding journey of service.
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3.5">
            <Link
              href="/register"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-md shadow-primary/20 hover:scale-105 active:scale-95 transition-all"
            >
              <span>Apply for NSS Registration</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/whos-who"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl bg-white dark:bg-card hover:bg-slate-50 dark:hover:bg-muted border-2 border-slate-200 dark:border-border hover:border-primary text-slate-800 dark:text-slate-200 font-bold text-sm transition-all shadow-2xs"
            >
              <Users className="w-4 h-4 text-primary" />
              <span>Meet the Leadership & POs</span>
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
