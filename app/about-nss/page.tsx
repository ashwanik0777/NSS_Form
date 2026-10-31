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
} from "lucide-react"
import Footer from "@/components/footer"

export default function AboutNSSPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background text-foreground flex flex-col">
      {/* Top Header */}
      <header className="bg-white/90 dark:bg-card/90 backdrop-blur-md border-b border-slate-200/80 dark:border-border/60 sticky top-0 z-50 transition-colors">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 sm:h-20">
            {/* Logos */}
            <Link href="/" className="flex items-center gap-2.5 sm:gap-4 group">
              <img
                src="/1.png"
                alt="GBU Logo"
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-full shadow-xs bg-white p-0.5 border border-slate-200/80"
              />
              <img
                src="/nssLogo.png"
                alt="NSS Logo"
                className="w-10 h-10 sm:w-12 sm:h-12 object-contain rounded-full shadow-xs bg-white p-0.5 border border-slate-200/80"
              />
              <img
                src="/myBharatLogo.png"
                alt="My Bharat Logo"
                className="h-9 sm:h-11 w-auto object-contain hidden sm:block"
              />
              <div className="hidden md:block pl-2 border-l border-slate-200 dark:border-border">
                <span className="font-bold text-sm block leading-tight text-slate-900 dark:text-white">
                  National Service Scheme
                </span>
                <span className="text-xs text-slate-500 dark:text-muted-foreground block leading-tight">
                  Gautam Buddha University
                </span>
              </div>
            </Link>

            {/* Navigation */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              <Link
                href="/"
                className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-primary px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-muted transition-colors"
              >
                Home
              </Link>
              <Link
                href="/about-nss"
                className="text-xs sm:text-sm font-semibold text-primary bg-primary/10 px-2.5 py-1.5 rounded-lg transition-colors"
              >
                About NSS
              </Link>
              <Link
                href="/whos-who"
                className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-primary px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-muted transition-colors"
              >
                Who's Who
              </Link>
              <Link
                href="/login"
                className="text-xs sm:text-sm font-semibold px-3 py-1.5 sm:px-4 sm:py-2 border border-slate-300 dark:border-border rounded-lg hover:bg-slate-100 dark:hover:bg-muted transition-all"
              >
                Login
              </Link>
              <Link
                href="/register"
                className="text-xs sm:text-sm font-semibold px-3 py-1.5 sm:px-4 sm:py-2 bg-primary text-primary-foreground rounded-lg shadow-sm hover:bg-primary/90 transition-all"
              >
                Apply
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white py-14 sm:py-20 md:py-24 px-4 sm:px-6">
        <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:20px_20px]"></div>
        <div className="max-w-5xl mx-auto text-center relative z-10 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-medium text-blue-200 shadow-sm">
            <Shield className="w-4 h-4 text-amber-400" />
            Ministry of Youth Affairs & Sports, Government of India
          </div>

          <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight leading-tight">
            National Service Scheme <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-amber-300">(NSS)</span>
          </h1>

          <p className="text-xl sm:text-2xl md:text-3xl font-semibold text-amber-300">
            "NOT ME BUT YOU"
          </p>
          <p className="text-sm sm:text-base text-blue-100/90 max-w-2xl mx-auto leading-relaxed">
            राष्ट्रीय सेवा योजना - गौतम बुद्ध विश्वविद्यालय
          </p>

          <div className="pt-4 flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm shadow-lg hover:bg-primary/90 transition-all active:scale-95"
            >
              Enroll as Volunteer
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/whos-who"
              className="inline-flex items-center gap-2 px-5 py-2.5 sm:px-6 sm:py-3 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 text-white font-semibold text-sm transition-all"
            >
              View 6 NSS Units & POs
            </Link>
          </div>
        </div>
      </section>

      {/* Main Content Sections */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 flex-1 w-full space-y-16">
        {/* Key Quick Fact Pills */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-card border border-slate-200/80 dark:border-border/60 shadow-xs text-center">
            <Calendar className="w-6 h-6 text-primary mx-auto mb-2" />
            <span className="block text-2xl font-bold text-slate-900 dark:text-white">1969</span>
            <span className="text-xs text-slate-500 font-medium">Launched in Gandhiji's Centenary Year</span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-card border border-slate-200/80 dark:border-border/60 shadow-xs text-center">
            <Sun className="w-6 h-6 text-amber-500 mx-auto mb-2" />
            <span className="block text-2xl font-bold text-slate-900 dark:text-white">Konark Wheel</span>
            <span className="text-xs text-slate-500 font-medium">Symbolizes Continuous Social Progress</span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-card border border-slate-200/80 dark:border-border/60 shadow-xs text-center">
            <Award className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <span className="block text-2xl font-bold text-slate-900 dark:text-white">120+ Hours</span>
            <span className="text-xs text-slate-500 font-medium">Annual Community Service Work</span>
          </div>

          <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-card border border-slate-200/80 dark:border-border/60 shadow-xs text-center">
            <Users className="w-6 h-6 text-blue-500 mx-auto mb-2" />
            <span className="block text-2xl font-bold text-slate-900 dark:text-white">6 Units</span>
            <span className="text-xs text-slate-500 font-medium">Empowered at Gautam Buddha University</span>
          </div>
        </div>

        {/* Section 1: Introduction to NSS */}
        <section className="bg-white dark:bg-card rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-border/60 shadow-sm space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Overview</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white leading-tight">
                Introduction to the National Service Scheme
              </h2>
            </div>
          </div>

          <div className="prose prose-slate dark:prose-invert max-w-none text-slate-600 dark:text-slate-300 space-y-4 text-sm sm:text-base leading-relaxed">
            <p>
              The <strong>National Service Scheme</strong> (
              <a
                href="https://nss.gov.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-semibold inline-flex items-center gap-0.5"
              >
                NSS
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
              ) is a fundamental sector Scheme of the Government of India, Ministry of Youth Affairs & Sports, New Delhi. Popularly known as NSS, the scheme was launched in <strong>Gandhiji’s Centenary year in 1969</strong>. NSS is a voluntary association of youth in Colleges, Universities and at the +2 level, to take part in various government-led community service activities & programmes, from time to time.
            </p>

            <p>
              The sole objective of the NSS is to provide <strong>hands-on training experience to youth in delivering community service without any biases</strong>. NSS volunteers work to confirm that everyone who is needy gets help to improve their living standard and lead a life of dignity. Thus, we want{" "}
              <a
                href="https://www.gbu.ac.in/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline font-semibold inline-flex items-center gap-0.5"
              >
                GBU
                <ExternalLink className="w-3.5 h-3.5" />
              </a>{" "}
              students and faculty members/staff members to contribute meaningfully to the development of our country.
            </p>

            <p>
              The main objective of NSS is to inculcate the spirit of social service among students and to provide them with an opportunity to work for the welfare of the community. The program is designed to promote volunteerism among students and to create an awareness of the problems faced by society.
            </p>
          </div>
        </section>

        {/* Section 2: Motto and Logo of NSS */}
        <section className="bg-gradient-to-br from-blue-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-6 sm:p-10 shadow-lg relative overflow-hidden">
          <div className="absolute right-0 top-0 translate-x-10 -translate-y-10 w-96 h-96 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            {/* Logo Display */}
            <div className="lg:col-span-4 flex flex-col items-center text-center">
              <div className="w-40 h-40 sm:w-48 sm:h-48 rounded-full bg-white p-3 shadow-2xl border-4 border-amber-400/80 flex items-center justify-center">
                <img
                  src="/nssLogo.png"
                  alt="NSS Emblem - Konark Rath Wheel"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="mt-4 text-xs font-semibold text-blue-200 uppercase tracking-widest">
                The Official NSS Emblem
              </span>
              <p className="text-amber-300 text-sm font-bold mt-1">
                Rath Wheel of Konark Sun Temple
              </p>
            </div>

            {/* Explanation */}
            <div className="lg:col-span-8 space-y-5">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-amber-400">Philosophy</span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                  Motto and Logo of NSS
                </h2>
              </div>

              <div className="bg-white/10 backdrop-blur-md rounded-2xl p-5 border border-white/15">
                <h3 className="text-lg font-bold text-amber-300 flex items-center gap-2">
                  <Heart className="w-5 h-5 text-red-400" />
                  Motto: “NOT ME BUT YOU”
                </h3>
                <p className="text-xs sm:text-sm text-slate-200 mt-2 leading-relaxed">
                  The motto reflects the spirit of democratic living and upholds the need for selfless service. It underlines that the welfare of an individual is ultimately dependent on the welfare of society as a whole.
                </p>
              </div>

              <div className="space-y-3 text-xs sm:text-sm text-slate-200 leading-relaxed">
                <p>
                  <strong>The Rath Wheel of Konark:</strong> The NSS logo is based on the giant Rath Wheel of the world-famous Konark Sun Temple, Odisha, India. The wheel signifies the cycle of conception and conservation for continuity as well as change, and suggests the continuous striving of the NSS for progressive social change.
                </p>
                <p>
                  <strong>Colours of Motivation:</strong> The Navy Blue colour in the NSS logo provides depth and reflects the cosmos of which the NSS is a tiny part, ready to contribute its share. The Red colour provides motivation to the youth volunteers to be active, energetic, and dedicated towards nation-building social activities.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3: Dual Pillars & Camping Programs */}
        <section className="space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Structure</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
              Activities & Camping Programs
            </h2>
            <div className="w-16 h-1 bg-primary rounded-full mx-auto mt-2"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-white dark:bg-card p-6 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-border/60 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-950 flex items-center justify-center text-primary mb-4">
                  <Calendar className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  1. Regular Activities
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Conducted across semesters including weekly campus meetings, community service, digital literacy drives, campus cleanliness, and social service projects. Students are expected to complete a designated number of service hours annually.
                </p>
              </div>
              <span className="mt-4 pt-3 border-t border-slate-100 dark:border-border text-xs font-semibold text-primary inline-flex items-center gap-1">
                Ongoing Community Engagement <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>

            {/* Card 2 */}
            <div className="bg-white dark:bg-card p-6 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-border/60 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="w-12 h-12 rounded-xl bg-amber-100 dark:bg-amber-950 flex items-center justify-center text-amber-600 mb-4">
                  <Sun className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  2. 7-Day Special Camping
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  Special camping programs are held for a duration of 7 days in adopted rural/semi-urban areas. Volunteers engage directly with village communities in sanitation, tree plantation, health checkups, and awareness campaigns.
                </p>
              </div>
              <span className="mt-4 pt-3 border-t border-slate-100 dark:border-border text-xs font-semibold text-amber-600 inline-flex items-center gap-1">
                Immersive Rural Experience <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>

            {/* Card 3 */}
            <div className="bg-white dark:bg-card p-6 sm:p-7 rounded-2xl border border-slate-200/80 dark:border-border/60 shadow-xs flex flex-col justify-between hover:shadow-md transition-shadow">
              <div>
                <div className="w-12 h-12 rounded-xl bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 mb-4">
                  <Compass className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                  3. Integration & Adventure Camps
                </h3>
                <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  NSS organizes National Integration Camps (NICs) to bring youth from different states together. The scheme also conducts adventure, trekking, and leadership training camps to sharpen personality, teamwork, and resilience.
                </p>
              </div>
              <span className="mt-4 pt-3 border-t border-slate-100 dark:border-border text-xs font-semibold text-emerald-600 inline-flex items-center gap-1">
                National Integration & Adventure <CheckCircle2 className="w-4 h-4" />
              </span>
            </div>
          </div>
        </section>

        {/* Section 4: Benefits to NSS Volunteer */}
        <section className="bg-white dark:bg-card rounded-3xl p-6 sm:p-10 border border-slate-200/80 dark:border-border/60 shadow-sm space-y-8">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600">Personal Growth</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
              Benefits to an NSS Volunteer
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-1">
              Transformative exposure that shapes students into responsible citizens and visionary leaders
            </p>
            <div className="w-16 h-1 bg-emerald-500 rounded-full mx-auto mt-2"></div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-muted/40 border border-slate-200/70 dark:border-border/60 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 flex items-center justify-center mb-4 shadow-xs">
                <Target className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                A Skilful Social Leader
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Develops real-world problem-solving, public speaking, decision-making, and the confidence to take initiatives that uplift society.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-muted/40 border border-slate-200/70 dark:border-border/60 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-amber-100 dark:bg-amber-900/40 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4 shadow-xs">
                <Award className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                A Competent Administrator
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Gains hands-on experience in program planning, team management, coordination with university authorities, and community logistics.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 dark:bg-muted/40 border border-slate-200/70 dark:border-border/60 flex flex-col items-center text-center">
              <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-900/40 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 shadow-xs">
                <Heart className="w-7 h-7" />
              </div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">
                A Kind & Compassionate Person
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
                Cultivates deep empathy, humility, and an understanding of humanity, realizing that true fulfillment comes from selfless community service.
              </p>
            </div>
          </div>

          <div className="mt-8 p-4 sm:p-5 rounded-2xl bg-blue-50 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-900 text-center max-w-2xl mx-auto">
            <span className="text-xs sm:text-sm font-semibold text-blue-900 dark:text-blue-200">
              Upon successful completion of the required service hours and special camp, volunteers are awarded official government-recognized certificates recognizing their distinguished service.
            </span>
          </div>
        </section>

        {/* Section 5: Call to Action */}
        <section className="bg-gradient-to-r from-primary to-indigo-600 text-white rounded-3xl p-8 sm:p-12 text-center space-y-4 shadow-xl">
          <h2 className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight">
            Be the Change. Join NSS at Gautam Buddha University.
          </h2>
          <p className="text-xs sm:text-sm md:text-base text-blue-100 max-w-xl mx-auto">
            Step forward to make an enduring impact. Register online, get assigned to your academic unit, and embark on a rewarding journey of service.
          </p>
          <div className="pt-2 flex items-center justify-center gap-3">
            <Link
              href="/register"
              className="px-6 py-3 rounded-xl bg-white text-primary font-bold text-sm shadow-md hover:bg-slate-100 transition-all active:scale-95"
            >
              Apply for NSS Registration
            </Link>
            <Link
              href="/whos-who"
              className="px-6 py-3 rounded-xl bg-primary/20 border border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-all"
            >
              Meet the Leadership
            </Link>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
