"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import { Users, Mail, Shield, Award } from "lucide-react"
import Footer from "@/components/footer"

interface Member {
  _id: string
  name: string
  designation: string
  category: "coordinator" | "officer" | "mentor" | "other"
  unitNo: string
  email?: string
  phone?: string
  photo?: string
  order: number
}

export default function WhosWhoPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [loading, setLoading] = useState(true)

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

  // Get coordinator
  const coordinator = members.find(
    (m) => m.category === "coordinator" || m.designation.toLowerCase().includes("coordinator")
  )

  // Get unit program officers (Unit 1 to Unit 6)
  const unitOfficers = [1, 2, 3, 4, 5, 6].map((num) => {
    const unitTag = `Unit ${num}`
    const found = members.find(
      (m) => m.unitNo === unitTag && (m.category === "officer" || m.designation.toLowerCase().includes("officer"))
    )
    return {
      unitNumber: num,
      unitLabel: `Unit ${num}`,
      member: found,
    }
  })

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="bg-white/95 dark:bg-card/90 backdrop-blur-md border-b border-slate-200/80 dark:border-border/60 sticky top-0 z-50">
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
            <div className="flex items-center gap-1.5 sm:gap-3">
              <Link
                href="/"
                className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-primary px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-muted transition-colors"
              >
                Home
              </Link>
              <Link
                href="/about-nss"
                className="text-xs sm:text-sm font-semibold text-slate-700 dark:text-slate-200 hover:text-primary px-2.5 py-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-muted transition-colors"
              >
                About NSS
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

      {/* Hero Header - Clean, Light & Airy (No dark heavy strips) */}
      <section className="bg-gradient-to-b from-blue-50/60 via-slate-50 to-slate-50 dark:from-muted/20 dark:via-background dark:to-background border-b border-slate-200/60 py-10 sm:py-14 px-4 text-center">
        <div className="max-w-3xl mx-auto space-y-2.5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100/70 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-xs font-semibold">
            <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            Gautam Buddha University • NSS Leadership
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Who's Who in NSS
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium">
            राष्ट्रीय सेवा योजना - संगठनात्मक ढाँचा
          </p>
          <p className="text-xs sm:text-sm text-slate-500 max-w-lg mx-auto">
            Program Coordinator and the Program Officers (POs) for the 6 Units of Gautam Buddha University.
          </p>
        </div>
      </section>

      {/* Main Body */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 flex-1 w-full space-y-12">
        {loading ? (
          <div className="py-20 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full mx-auto mb-3"></div>
            <p className="text-sm text-slate-500">Loading leadership directory...</p>
          </div>
        ) : (
          <>
            {/* 1. NSS Program Coordinator (Clean, Elegant Profile Card) */}
            {coordinator && (
              <section className="space-y-4">
                <div className="text-center">
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">Head of NSS</span>
                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-0.5">
                    NSS Program Coordinator
                  </h2>
                  <div className="w-12 h-1 bg-primary rounded-full mx-auto mt-2"></div>
                </div>

                <div className="max-w-md mx-auto bg-white dark:bg-card rounded-2xl shadow-xs border border-slate-200/80 dark:border-border/60 p-6 sm:p-8 text-center flex flex-col items-center hover:shadow-md transition-shadow">
                  <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-2 border-slate-200 dark:border-border p-1 shadow-sm bg-white dark:bg-muted mb-4">
                    {coordinator.photo ? (
                      <img
                        src={coordinator.photo}
                        alt={coordinator.name}
                        className="w-full h-full object-cover rounded-full"
                      />
                    ) : (
                      <div className="w-full h-full bg-slate-100 dark:bg-muted flex items-center justify-center rounded-full text-slate-400">
                        <Users className="w-12 h-12" />
                      </div>
                    )}
                  </div>

                  <h3 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">
                    {coordinator.name}
                  </h3>
                  <span className="mt-1 px-3.5 py-1 rounded-full text-xs font-semibold bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200/60 dark:border-blue-900">
                    {coordinator.designation}
                  </span>
                  <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-2 font-medium">
                    National Service Scheme (NSS) • Gautam Buddha University
                  </p>

                  {coordinator.email && (
                    <a
                      href={`mailto:${coordinator.email}`}
                      className="mt-4 inline-flex items-center gap-1.5 text-xs text-primary hover:underline font-medium px-3 py-1.5 rounded-lg bg-primary/5 hover:bg-primary/10 transition-colors"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      {coordinator.email}
                    </a>
                  )}
                </div>
              </section>
            )}

            {/* 2. Program Officers for the 6 Units (Clean 6-Card Grid without any blue strips) */}
            <section className="space-y-6 pt-4">
              <div className="text-center">
                <span className="text-xs font-bold uppercase tracking-wider text-primary">Unit Officers</span>
                <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mt-0.5">
                  Program Officers (6 NSS Units)
                </h2>
                <div className="w-12 h-1 bg-primary rounded-full mx-auto mt-2"></div>
              </div>

              {/* Clean 6-Unit Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {unitOfficers.map(({ unitNumber, unitLabel, member }) => (
                  <div
                    key={unitLabel}
                    className="bg-white dark:bg-card rounded-2xl shadow-xs border border-slate-200/80 dark:border-border/60 p-6 flex flex-col items-center text-center hover:shadow-md transition-shadow group"
                  >
                    {/* Unit Pill Badge */}
                    <span className="inline-block px-3 py-1 rounded-full bg-slate-100 dark:bg-muted text-slate-700 dark:text-slate-300 text-xs font-bold mb-4 border border-slate-200/80 dark:border-border">
                      NSS {unitLabel}
                    </span>

                    {/* Member Photo */}
                    <div className="w-24 h-24 rounded-full overflow-hidden border border-slate-200 dark:border-border p-1 bg-white dark:bg-muted shadow-xs mb-4">
                      {member?.photo ? (
                        <img
                          src={member.photo}
                          alt={member.name}
                          className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-100 dark:bg-muted flex items-center justify-center rounded-full text-slate-400 font-bold text-lg">
                          {member?.name ? member.name.replace(/dr\.?\s*/i, "").charAt(0) : "P"}
                        </div>
                      )}
                    </div>

                    {/* Officer Name & Designation */}
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                      {member ? member.name : `Program Officer, ${unitLabel}`}
                    </h3>

                    <p className="text-xs font-semibold text-primary mt-1">
                      Program Officer (PO)
                    </p>

                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                      NSS {unitLabel} • Gautam Buddha University
                    </p>

                    {/* Email if available */}
                    {member?.email ? (
                      <a
                        href={`mailto:${member.email}`}
                        className="mt-4 inline-flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-300 hover:text-primary transition-colors"
                      >
                        <Mail className="w-3.5 h-3.5 text-primary" />
                        <span>{member.email}</span>
                      </a>
                    ) : (
                      <div className="h-4 mt-4"></div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          </>
        )}
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
