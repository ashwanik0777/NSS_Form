"use client"

import React, { useEffect, useState } from "react"
import Link from "next/link"
import {
  Users,
  Mail,
  Shield,
  Award,
  ChevronDown,
  Sparkles,
  ArrowDown,
  Building2,
  ExternalLink,
} from "lucide-react"
import Footer from "@/components/footer"
import PublicNavbar from "@/components/public-navbar"

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

// Initial data with uploaded photos so the page renders instantly with zero loading delay
const INITIAL_MEMBERS: Member[] = [
  {
    _id: "coord-initial",
    name: "Dr. Nagendra Singh",
    designation: "NSS Program Coordinator",
    category: "coordinator",
    unitNo: "All Units",
    email: "nss@gbu.ac.in",
    photo: "https://res.cloudinary.com/djltlifnp/image/upload/v1793475303/nss-uploads/leadership/kduefts31mubwbbhaurg.jpg",
    order: 1,
  },
  {
    _id: "unit-1-initial",
    name: "Dr. Gaurav Kumar",
    designation: "Program Officer (PO)",
    category: "officer",
    unitNo: "Unit 1",
    photo: "https://res.cloudinary.com/djltlifnp/image/upload/v1793475321/nss-uploads/leadership/xvz7erf7icyzhyqerwl3.jpg",
    order: 2,
  },
  {
    _id: "unit-2-initial",
    name: "Dr. Bhaswati Banerjee",
    designation: "Program Officer (PO)",
    category: "officer",
    unitNo: "Unit 2",
    photo: "https://res.cloudinary.com/djltlifnp/image/upload/v1793475374/nss-uploads/leadership/tdzfsqlinqjg3vzvtgjt.jpg",
    order: 3,
  },
  {
    _id: "unit-3-initial",
    name: "Dr. Rahul Kapoor",
    designation: "Program Officer (PO)",
    category: "officer",
    unitNo: "Unit 3",
    photo: "https://res.cloudinary.com/djltlifnp/image/upload/v1793475407/nss-uploads/leadership/ye3wtwpycnaj6epcc531.jpg",
    order: 4,
  },
  {
    _id: "unit-4-initial",
    name: "Dr. Rakesh Kumar",
    designation: "Program Officer (PO)",
    category: "officer",
    unitNo: "Unit 4",
    photo: "https://res.cloudinary.com/djltlifnp/image/upload/v1793475415/nss-uploads/leadership/n6nz7uvgr4cxzqne5big.jpg",
    order: 5,
  },
  {
    _id: "unit-5-initial",
    name: "Dr. Shrutee Kanwar",
    designation: "Program Officer (PO)",
    category: "officer",
    unitNo: "Unit 5",
    photo: "https://res.cloudinary.com/djltlifnp/image/upload/v1793475421/nss-uploads/leadership/ar3tlypgbkl2d3aomx69.jpg",
    order: 6,
  },
  {
    _id: "unit-6-initial",
    name: "Dr. Samar Raqshin",
    designation: "Program Officer (PO)",
    category: "officer",
    unitNo: "Unit 6",
    photo: "https://res.cloudinary.com/djltlifnp/image/upload/v1793475431/nss-uploads/leadership/airz009h1ahqkqkubi1x.jpg",
    order: 7,
  },
]

// Fixed 6 Units Structure with Official Program Officers
const OFFICIAL_POS = [
  { unitNo: "Unit 1", unitNum: "01", fallbackName: "Dr. Gaurav Kumar", color: "from-blue-600 to-indigo-600" },
  { unitNo: "Unit 2", unitNum: "02", fallbackName: "Dr. Bhaswati Banerjee", color: "from-indigo-600 to-purple-600" },
  { unitNo: "Unit 3", unitNum: "03", fallbackName: "Dr. Rahul Kapoor", color: "from-violet-600 to-blue-600" },
  { unitNo: "Unit 4", unitNum: "04", fallbackName: "Dr. Rakesh Kumar", color: "from-sky-600 to-blue-600" },
  { unitNo: "Unit 5", unitNum: "05", fallbackName: "Dr. Shrutee Kanwar", color: "from-teal-600 to-emerald-600" },
  { unitNo: "Unit 6", unitNum: "06", fallbackName: "Dr. Samar Raqshin", color: "from-emerald-600 to-teal-600" },
]

export default function WhosWhoPage() {
  const [members, setMembers] = useState<Member[]>(INITIAL_MEMBERS)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchMembers()
  }, [])

  const fetchMembers = async () => {
    try {
      const res = await fetch("/api/whos-who")
      const data = await res.json()
      if (data.success && Array.isArray(data.members) && data.members.length > 0) {
        setMembers(data.members)
      }
    } catch (error) {
      console.error("Failed to load leadership team:", error)
    }
  }

  // Find Coordinator
  const coordinator =
    members.find(
      (m) => m.category === "coordinator" || m.designation.toLowerCase().includes("coordinator")
    ) || {
      _id: "coord-default",
      name: "Dr. Nagendra Singh",
      designation: "NSS Program Coordinator",
      category: "coordinator" as const,
      unitNo: "All Units",
      email: "nss@gbu.ac.in",
      photo: "",
      order: 1,
    }

  // Build the 6 POs
  const pos = OFFICIAL_POS.map((u) => {
    const dbMember = members.find(
      (m) =>
        m.unitNo === u.unitNo &&
        (m.category === "officer" || m.designation.toLowerCase().includes("officer"))
    )
    return {
      ...u,
      _id: dbMember?._id || u.unitNo,
      name: dbMember?.name || u.fallbackName,
      designation: "Program Officer (PO)",
      email: dbMember?.email || "",
      photo: dbMember?.photo || "",
    }

  })

  return (
    <div className="min-h-screen bg-slate-50/80 dark:bg-background text-foreground flex flex-col font-sans selection:bg-blue-500/20">
      {/* Reusable Public Navbar */}
      <PublicNavbar />

      {/* Hero Banner with Subtle Dot Grid */}
      <section className="relative overflow-hidden bg-white dark:bg-card border-b border-slate-200/80 dark:border-border/60 py-10 sm:py-14 px-4 text-center">
        <div className="absolute inset-0 opacity-40 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:20px_20px] pointer-events-none"></div>
        <div className="max-w-3xl mx-auto relative z-10 space-y-2">

          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            NSS Leadership
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium">
            Program Coordinator & Unit Program Officers
          </p>

        </div>
      </section>

      {/* Organizational Leadership Chart Canvas */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16 flex-1 w-full">
        <div className="flex flex-col items-center">
          {/* LEVEL 1: Program Coordinator (The Apex Card) */}
          <div className="relative group w-full max-w-md">
            {/* Outer Glow */}
            <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 rounded-3xl blur-sm opacity-25 group-hover:opacity-40 transition-opacity"></div>

            <div className="relative bg-white dark:bg-card border-2 border-blue-600/30 dark:border-blue-500/40 rounded-3xl shadow-xl p-6 sm:p-8 flex flex-col items-center text-center">
              {/* Crown/Apex Tag */}
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-blue-600 text-white text-[11px] font-extrabold uppercase tracking-wider shadow-sm mb-4">
                <Shield className="w-3.5 h-3.5 text-amber-300" />
                NSS Program Coordinator
              </span>

              {/* Coordinator Avatar */}
              <div className="relative mb-3">
                <div className="w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden border-4 border-white dark:border-card shadow-lg bg-gradient-to-tr from-blue-600 to-indigo-500 p-1">
                  {coordinator.photo ? (
                    <img
                      src={coordinator.photo}
                      alt={coordinator.name}
                      className="w-full h-full object-cover rounded-full"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 dark:bg-muted flex items-center justify-center rounded-full text-slate-500">
                      <Users className="w-12 h-12" />
                    </div>
                  )}
                </div>
                <span className="absolute bottom-1 right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-card shadow-xs" title="Active Head"></span>
              </div>

              {/* Name */}
              <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 dark:text-white tracking-tight mt-1">
                {coordinator.name}
              </h2>

              {coordinator.email && (
                <a
                  href={`mailto:${coordinator.email}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-xs text-blue-600 dark:text-blue-400 hover:underline font-semibold px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {coordinator.email}
                </a>
              )}
            </div>
          </div>

          {/* Tree Stem / Connector Stem */}
          <div className="flex flex-col items-center">
            {/* Vertical line from Coordinator */}
            <div className="w-0.5 h-8 sm:h-12 bg-gradient-to-b from-blue-600 to-blue-400"></div>

            {/* Central Junction Hub */}
            <div className="w-7 h-7 rounded-full bg-white dark:bg-card border-2 border-blue-500 shadow-sm flex items-center justify-center text-blue-600">
              <ArrowDown className="w-3.5 h-3.5" />
            </div>

            {/* Vertical line continuing down */}
            <div className="w-0.5 h-6 bg-blue-400 hidden lg:block"></div>
          </div>

          {/* Desktop Horizontal Connecting Beam (Shows on Desktop) */}
          <div className="hidden lg:block w-full max-w-5xl relative">
            {/* Horizontal Bar linking the units */}
            <div className="h-0.5 bg-blue-300 dark:bg-blue-900 w-full rounded-full"></div>

            {/* Dropdown markers for each column */}
            <div className="grid grid-cols-6 w-full">
              {pos.map((p) => (
                <div key={p.unitNo} className="flex flex-col items-center">
                  <div className="w-0.5 h-6 bg-blue-300 dark:bg-blue-900"></div>
                  <div className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-2 ring-blue-200 dark:ring-blue-950"></div>
                </div>
              ))}
            </div>
          </div>

          {/* Section Tag for Units */}
          <div className="mt-4 mb-8 text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
              Unit Program Officers
            </span>
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200 mt-0.5">
              The 6 NSS Units
            </h3>
          </div>

          {/* LEVEL 2: The 6 Unit Program Officers Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 w-full">
            {pos.map((officer) => (
              <div
                key={officer.unitNo}
                className="group relative bg-white dark:bg-card border border-slate-200/90 dark:border-border/70 rounded-2xl shadow-xs hover:shadow-xl hover:border-blue-400/80 transition-all duration-300 p-6 flex flex-col items-center text-center overflow-hidden hover:-translate-y-1"
              >
                {/* Subtle Top Accent Ribbon */}
                <div className={`absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r ${officer.color}`}></div>

                {/* Unit Badge (e.g. Unit 01, Unit 02) */}
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 dark:bg-muted text-slate-700 dark:text-slate-300 text-xs font-mono font-bold mb-4 border border-slate-200/60 dark:border-border">
                  <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                  NSS {officer.unitNo}
                </div>

                {/* Officer Portrait */}
                <div className="w-24 h-24 rounded-full overflow-hidden border-2 border-slate-200/80 dark:border-border p-1 bg-white dark:bg-muted shadow-sm mb-3.5 group-hover:border-blue-500 transition-colors">
                  {officer.photo ? (
                    <img
                      src={officer.photo}
                      alt={officer.name}
                      className="w-full h-full object-cover rounded-full group-hover:scale-105 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-100 dark:bg-muted flex items-center justify-center rounded-full text-slate-500 font-bold text-lg">
                      {officer.name.replace(/dr\.?\s*/i, "").charAt(0)}
                    </div>
                  )}
                </div>

                {/* Officer Name */}
                <h4 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
                  {officer.name}
                </h4>

                {/* Contact / Email */}
                {officer.email ? (
                  <a
                    href={`mailto:${officer.email}`}
                    className="mt-3 inline-flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 hover:text-primary transition-colors truncate max-w-full"
                  >
                    <Mail className="w-3.5 h-3.5 text-primary shrink-0" />
                    <span className="truncate">{officer.email}</span>
                  </a>
                ) : (
                  <div className="h-2"></div>
                )}
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  )
}
