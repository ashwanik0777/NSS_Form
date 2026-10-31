"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import {
  Users,
  Mail,
  Phone,
  Building,
  Award,
  ArrowRight,
  Shield,
  GraduationCap,
  Sparkles,
  ChevronRight,
  ExternalLink,
} from "lucide-react"
import Footer from "@/components/footer"

interface Member {
  _id: string
  name: string
  designation: string
  category: "coordinator" | "officer" | "mentor" | "other"
  unitNo: string
  department?: string
  school?: string
  email?: string
  phone?: string
  photo?: string
  bio?: string
  order: number
}

const UNIT_TABS = [
  "All Units",
  "Unit 1",
  "Unit 2",
  "Unit 3",
  "Unit 4",
  "Unit 5",
  "Unit 6",
]

const UNIT_DESCRIPTIONS: Record<string, { school: string; theme: string }> = {
  "Unit 1": { school: "School of Information & Communication Technology (SOICT)", theme: "Technology & Digital Literacy Outreach" },
  "Unit 2": { school: "School of Engineering (SOE)", theme: "Clean Campus, Village Infrastructure & Technical Workshops" },
  "Unit 3": { school: "School of Biotechnology (SOBT)", theme: "Health, Blood Donation & Environmental Conservation" },
  "Unit 4": { school: "School of Management (SOM)", theme: "Financial Literacy, Leadership & Event Management" },
  "Unit 5": { school: "School of Humanities & Social Sciences (SOHSS)", theme: "Grassroots Surveys, Literacy & Village Adoption" },
  "Unit 6": { school: "School of Vocational Studies & Applied Sciences (SOVSAS)", theme: "Skill Development, Sustainability & Special Camps" },
}

export default function WhosWhoPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedUnit, setSelectedUnit] = useState("All Units")

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    setLoading(true)
    try {
      const res = await fetch("/api/whos-who")
      const data = await res.json()
      if (data.success && Array.isArray(data.members)) {
        setMembers(data.members)
      }
    } catch (error) {
      console.error("Failed to load leadership team:", error)
    } finally {
      setLoading(false)
    }
  }

  // Filter members
  const coordinatorMembers = members.filter(
    (m) => m.category === "coordinator" || m.unitNo === "All Units"
  )

  const unitMembers = members.filter(
    (m) => m.category !== "coordinator" && m.unitNo !== "All Units"
  )

  const filteredUnitMembers =
    selectedUnit === "All Units"
      ? unitMembers
      : unitMembers.filter((m) => m.unitNo === selectedUnit)

  // Group by unit
  const groupedByUnit: Record<string, Member[]> = {}
  UNIT_TABS.slice(1).forEach((unit) => {
    groupedByUnit[unit] = unitMembers.filter((m) => m.unitNo === unit)
  })

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-background text-foreground flex flex-col">
      {/* Header */}
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

            {/* Navigation links */}
            <div className="flex items-center gap-2 sm:gap-3">
              <Link
                href="/"
                className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-primary px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-muted transition-colors"
              >
                Home
              </Link>
              <Link
                href="/whos-who"
                className="text-xs sm:text-sm font-semibold text-primary bg-primary/10 px-2.5 py-1.5 rounded-lg transition-colors"
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
      <section className="relative overflow-hidden bg-gradient-to-b from-blue-900 via-indigo-900 to-slate-900 text-white py-12 sm:py-16 md:py-20 px-4 sm:px-6">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]"></div>
        <div className="max-w-5xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs sm:text-sm font-medium mb-4 text-blue-200">
            <Shield className="w-3.5 h-3.5 text-blue-400" />
            NSS Leadership & Organizational Hierarchy
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight mb-3">
            Who's Who in NSS GBU
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-blue-100/90 font-medium max-w-2xl mx-auto leading-relaxed">
            राष्ट्रीय सेवा योजना - संगठनात्मक ढाँचा
          </p>
          <p className="text-xs sm:text-sm md:text-base text-slate-300 max-w-2xl mx-auto mt-2 leading-relaxed">
            Meet the Program Coordinator, Unit Program Officers (POs), and Faculty Mentors steering the 6 NSS Units of Gautam Buddha University.
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 flex-1 w-full space-y-12">
        {/* Section 1: Program Coordinator & Central Leadership */}
        {coordinatorMembers.length > 0 && (
          <section className="space-y-6">
            <div className="text-center max-w-xl mx-auto">
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Leadership</span>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
                University NSS Cell
              </h2>
              <div className="w-16 h-1 bg-primary rounded-full mx-auto mt-2"></div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 justify-center max-w-4xl mx-auto">
              {coordinatorMembers.map((member) => (
                <div
                  key={member._id}
                  className="bg-white dark:bg-card rounded-2xl shadow-md border border-slate-200/80 dark:border-border/60 overflow-hidden flex flex-col items-center p-6 text-center hover:shadow-xl transition-all duration-300 md:col-span-2 lg:col-span-3 max-w-md mx-auto w-full group"
                >
                  <div className="relative mb-4">
                    <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-primary/20 p-1 shadow-md bg-gradient-to-tr from-primary to-blue-400">
                      {member.photo ? (
                        <img
                          src={member.photo}
                          alt={member.name}
                          className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 dark:bg-muted flex items-center justify-center rounded-full text-slate-400">
                          <Users className="w-12 h-12" />
                        </div>
                      )}
                    </div>
                    <span className="absolute bottom-0 right-0 px-2 py-0.5 bg-blue-600 text-white text-[11px] font-bold rounded-full shadow-xs">
                      Lead
                    </span>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-white leading-tight">
                    {member.name}
                  </h3>
                  <span className="inline-block mt-1 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">
                    {member.designation}
                  </span>

                  {(member.department || member.school) && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400 mt-3 font-medium">
                      <Building className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span>{member.department || member.school}</span>
                    </div>
                  )}

                  {member.bio && (
                    <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-3 italic line-clamp-3">
                      "{member.bio}"
                    </p>
                  )}

                  {member.email && (
                    <a
                      href={`mailto:${member.email}`}
                      className="mt-4 inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium px-3 py-1.5 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      {member.email}
                    </a>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Section 2: The 6 NSS Units */}
        <section className="space-y-6">
          <div className="text-center max-w-xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Units Hierarchy</span>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-1">
              6 NSS Units & Program Officers
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 dark:text-muted-foreground mt-1">
              Select a unit or browse all 6 official university units
            </p>
            <div className="w-16 h-1 bg-primary rounded-full mx-auto mt-2"></div>
          </div>

          {/* Unit Filter Tabs */}
          <div className="flex items-center justify-start sm:justify-center gap-1.5 sm:gap-2 overflow-x-auto pb-2 scrollbar-none">
            {UNIT_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedUnit(tab)}
                className={`px-3 sm:px-4 py-2 rounded-xl text-xs sm:text-sm font-semibold whitespace-nowrap transition-all duration-200 ${
                  selectedUnit === tab
                    ? "bg-primary text-primary-foreground shadow-sm scale-[1.02]"
                    : "bg-white dark:bg-card text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-muted border border-slate-200 dark:border-border"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Units Display */}
          {loading ? (
            <div className="py-16 text-center">
              <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
              <p className="text-sm text-slate-500">Loading leadership directory...</p>
            </div>
          ) : (
            <div className="space-y-10">
              {UNIT_TABS.slice(1).map((unitName) => {
                // If a specific unit is selected and it's not this one, skip
                if (selectedUnit !== "All Units" && selectedUnit !== unitName) {
                  return null
                }

                const membersInUnit = groupedByUnit[unitName] || []
                const unitInfo = UNIT_DESCRIPTIONS[unitName] || {
                  school: "Gautam Buddha University",
                  theme: "Youth & Community Development",
                }

                return (
                  <div
                    key={unitName}
                    className="bg-white dark:bg-card rounded-2xl shadow-sm border border-slate-200/80 dark:border-border/60 overflow-hidden"
                  >
                    {/* Unit Header Banner */}
                    <div className="px-5 py-4 sm:px-6 sm:py-5 bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 text-white flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                          <h3 className="text-lg sm:text-xl font-bold tracking-tight">
                            {unitName}
                          </h3>
                        </div>
                        <p className="text-xs text-blue-200 mt-0.5 font-medium">
                          {unitInfo.school}
                        </p>
                      </div>
                      <span className="self-start sm:self-auto text-[11px] sm:text-xs font-semibold px-2.5 py-1 rounded-full bg-white/10 border border-white/15 text-blue-100">
                        {unitInfo.theme}
                      </span>
                    </div>

                    {/* Member Cards Grid */}
                    <div className="p-5 sm:p-6">
                      {membersInUnit.length === 0 ? (
                        <div className="py-8 text-center text-slate-400 text-sm">
                          No officers assigned to this unit yet.
                        </div>
                      ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6">
                          {membersInUnit.map((member) => {
                            const isPO = member.category === "officer" || member.designation.toLowerCase().includes("officer")
                            return (
                              <div
                                key={member._id}
                                className={`rounded-xl p-5 border transition-all duration-300 hover:shadow-md flex flex-col justify-between ${
                                  isPO
                                    ? "bg-blue-50/50 dark:bg-blue-950/20 border-blue-200/80 dark:border-blue-900/60"
                                    : "bg-slate-50/60 dark:bg-card border-slate-200/70 dark:border-border/60"
                                }`}
                              >
                                <div>
                                  <div className="flex items-start gap-4">
                                    {/* Member Photo */}
                                    <div className="w-16 h-16 sm:w-18 sm:h-18 rounded-full overflow-hidden shrink-0 border-2 border-white shadow-sm bg-slate-200 dark:bg-muted">
                                      {member.photo ? (
                                        <img
                                          src={member.photo}
                                          alt={member.name}
                                          className="w-full h-full object-cover"
                                        />
                                      ) : (
                                        <div className="w-full h-full flex items-center justify-center text-slate-400 bg-slate-100 dark:bg-muted font-bold text-sm">
                                          {member.name.charAt(0)}
                                        </div>
                                      )}
                                    </div>

                                    {/* Meta */}
                                    <div className="min-w-0 flex-1">
                                      <span
                                        className={`inline-block text-[10px] sm:text-[11px] font-bold px-2 py-0.5 rounded-md mb-1 ${
                                          isPO
                                            ? "bg-blue-600 text-white"
                                            : "bg-emerald-600 text-white"
                                        }`}
                                      >
                                        {member.designation}
                                      </span>
                                      <h4 className="text-base font-bold text-slate-900 dark:text-white leading-tight truncate">
                                        {member.name}
                                      </h4>
                                      {(member.department || member.school) && (
                                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-0.5">
                                          {member.department || member.school}
                                        </p>
                                      )}
                                    </div>
                                  </div>

                                  {member.bio && (
                                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-3 line-clamp-2 italic">
                                      "{member.bio}"
                                    </p>
                                  )}
                                </div>

                                {/* Contact info */}
                                <div className="mt-4 pt-3 border-t border-slate-200/70 dark:border-border/50 flex flex-col gap-1.5">
                                  {member.email && (
                                    <a
                                      href={`mailto:${member.email}`}
                                      className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-primary transition-colors truncate"
                                    >
                                      <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                                      <span className="truncate">{member.email}</span>
                                    </a>
                                  )}
                                  {member.phone && (
                                    <a
                                      href={`tel:${member.phone}`}
                                      className="inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-primary transition-colors truncate"
                                    >
                                      <Phone className="w-3.5 h-3.5 text-primary shrink-0" />
                                      <span>{member.phone}</span>
                                    </a>
                                  )}
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}

