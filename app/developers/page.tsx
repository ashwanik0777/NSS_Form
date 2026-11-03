"use client"

import {
  Github,
  Linkedin,
  Mail,
  Globe,
  Twitter,
  Instagram,
  Facebook,
  Code,
  CheckCircle2,
  Layers,
} from "lucide-react"
import PublicNavbar from "@/components/public-navbar"

type DeveloperRoleType = "Lead" | "Member" | "Thread" | "Advisor" | "Contributor"

interface Developer {
  id: string
  name: string
  role: string
  roleType: DeveloperRoleType
  image: string
  rollNumber: string
  batch: string
  program: string
  school: string
  department: string
  email?: string
  github?: string
  linkedin?: string
  website?: string
  twitter?: string
  instagram?: string
  facebook?: string
  bio?: string
  responsibilities?: string[]
  technologies?: string[]
  contributions?: string[]
}

const developers: Developer[] = [
  {
    id: "ashwanik0777",
    name: "Ashwani Kushwaha",
    role: "Full Stack Developer",
    roleType: "Lead",
    image: "https://res.cloudinary.com/depbzbjfu/image/upload/v1764331825/portfolio/profile/file_atjlei.jpg",
    rollNumber: "235/UCS/039",
    batch: "2023-27",
    program: "B-Tech CSE",
    school: "SOICT",
    department: "Computer Science and Engineering",
    email: "235ucs039@gbu.ac.in",
    github: "https://github.com/ashwanik0777",
    linkedin: "https://linkedin.com/in/ashwanik0777",
    website: "https://portfolio-ashwanik0777.vercel.app/",
    twitter: "https://twitter.com/ashwanik0777",
    bio: "Passionate about scalable web apps and open source. Led the end-to-end design, architecture, and implementation of the NSS Management System frontend & backend.",
    responsibilities: [
      "System architecture & project planning",
      "Frontend and backend core modules",
      "Interactive UI/UX design, user authentication",
      "Documentation & code review for open source community"
    ],
    technologies: [
      "Next.js",
      "React",
      "TypeScript",
      "TailwindCSS",
      "Node.js",
      "Prisma",
      "PostgreSQL"
    ],
    contributions: [
      "Designed a robust volunteer dashboard system with real-time updates",
      "Implemented secure authentication and role-based access control",
      "Optimized database schema for efficient data retrieval",
      "Deployed project and maintained documentation"
    ],
  },
  {
    id: "mayank-prabhakar",
    name: "Mayank Prabhakar",
    role: "Full Stack Developer",
    roleType: "Lead",
    image: "https://res.cloudinary.com/djltlifnp/image/upload/v1793476444/nss-uploads/leadership/e9v1qv1k0al0uh9sqnto.png",
    rollNumber: "255/UCS/033",
    batch: "2025-29",
    program: "B-Tech CSE",
    school: "SOICT",
    department: "Computer Science and Engineering",
    email: "255ucs033@gbu.ac.in",
    linkedin: "https://www.linkedin.com/in/i-mayank-prabhakar-/",
    website: "https://mayank-prabhakar.me/",
    instagram: "https://www.instagram.com/i.mayank.prabhakaR",
    bio: "Passionate developer focused on building scalable, performant, and interactive web applications for Gautam Buddha University.",
    responsibilities: [
      "Full-stack web application development",
      "UI/UX enhancement & mobile responsiveness",
      "Core feature architecture and implementation",
      "Performance optimization & accessibility"
    ],
    technologies: [
      "Next.js",
      "React",
      "TypeScript",
      "TailwindCSS",
      "Node.js",
      "MongoDB"
    ],
    contributions: [
      "Engineered responsive navigation and public leadership modules",
      "Optimized mobile viewport experiences and layout hierarchy",
      "Redesigned the whole website with modern official UI/UX",
      "Upgraded features and interactive dashboards for Admin and Volunteers"
    ],
  }
]

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      <PublicNavbar />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex-1 w-full">
        {/* Hero Section */}
        <div className="text-center mb-10 sm:mb-14">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-900 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-3">
            GBU NSS • Technical Cell
          </div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Development Team
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-400 font-medium max-w-xl mx-auto mt-2">
            The student engineers behind the official National Service Scheme portal at Gautam Buddha University.
          </p>
        </div>

        {/* Developers Grid */}
        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8 mb-16">
          {developers.map((dev) => (
            <div
              key={dev.id}
              className="group relative bg-white dark:bg-card rounded-3xl border border-slate-200/90 dark:border-border p-6 sm:p-8 shadow-md hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 overflow-hidden"
            >
              {/* Subtle Top Accent Ribbon */}
              <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-primary"></div>

              {/* Developer Image */}
              <div className="relative mb-5 text-center">
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-tr from-blue-600 to-indigo-500 p-1 shadow-lg group-hover:scale-105 transition-transform duration-300">
                  <div className="w-full h-full rounded-full bg-card overflow-hidden flex items-center justify-center">
                    {dev.image ? (
                      <img
                        src={dev.image}
                        alt={dev.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = "none"
                          const parent = target.parentElement
                          if (parent) {
                            parent.innerHTML = `<div class='w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary text-white text-3xl font-bold'>${dev.name.charAt(0)}</div>`
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary text-white text-3xl font-bold">
                        {dev.name.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Developer Header Info */}
              <div className="text-center">
                <h3 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                  {dev.name}
                </h3>
                <p className="text-sm font-semibold text-primary mt-0.5">
                  {dev.role}
                </p>
                <div className="mt-2 mb-4">
                  <span className="inline-flex items-center px-3 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                    {dev.roleType} Developer
                  </span>
                </div>

                {/* Structured Academic Details Card */}
                <div className="w-full bg-slate-50 dark:bg-muted/40 rounded-2xl p-4 my-4 text-xs border border-slate-200/80 dark:border-border/60 text-left space-y-2.5 shadow-xs">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 dark:text-muted-foreground font-medium">Program</span>
                    <span className="font-bold text-slate-800 dark:text-slate-100 text-right">{dev.program}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 dark:text-muted-foreground font-medium">School</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{dev.school}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 dark:text-muted-foreground font-medium">Department</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[200px]" title={dev.department}>{dev.department}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-slate-500 dark:text-muted-foreground font-medium">Batch</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{dev.batch}</span>
                  </div>
                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-slate-200/80 dark:border-border/60">
                    <span className="text-slate-600 dark:text-muted-foreground font-semibold">Roll Number</span>
                    <span className="font-mono font-bold text-xs text-primary bg-primary/10 px-2.5 py-0.5 rounded-lg border border-primary/20">
                      {dev.rollNumber}
                    </span>
                  </div>
                </div>

                {/* Bio (clean, no awkward ellipsis cutoff) */}
                {dev.bio && (
                  <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed text-center px-1 mb-4">
                    {dev.bio}
                  </p>
                )}
              </div>

              {/* Social Links */}
              <div className="flex items-center justify-center gap-2.5 pt-4 border-t border-slate-200/80 dark:border-border">
                {dev.email && (
                  <a
                    href={`mailto:${dev.email}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-muted hover:bg-primary hover:text-primary-foreground text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all hover:scale-110 shadow-xs"
                    title="Email"
                  >
                    <Mail className="w-4 h-4" />
                  </a>
                )}
                {dev.github && (
                  <a
                    href={dev.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-muted hover:bg-slate-900 hover:text-white text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all hover:scale-110 shadow-xs"
                    title="GitHub"
                  >
                    <Github className="w-4 h-4" />
                  </a>
                )}
                {dev.linkedin && (
                  <a
                    href={dev.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-muted hover:bg-blue-600 hover:text-white text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all hover:scale-110 shadow-xs"
                    title="LinkedIn"
                  >
                    <Linkedin className="w-4 h-4" />
                  </a>
                )}
                {dev.website && (
                  <a
                    href={dev.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-muted hover:bg-emerald-600 hover:text-white text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all hover:scale-110 shadow-xs"
                    title="Portfolio Website"
                  >
                    <Globe className="w-4 h-4" />
                  </a>
                )}
                {dev.twitter && (
                  <a
                    href={dev.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-muted hover:bg-sky-500 hover:text-white text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all hover:scale-110 shadow-xs"
                    title="Twitter"
                  >
                    <Twitter className="w-4 h-4" />
                  </a>
                )}
                {dev.instagram && (
                  <a
                    href={dev.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-muted hover:bg-gradient-to-tr hover:from-amber-500 hover:via-rose-500 hover:to-purple-600 hover:text-white text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all hover:scale-110 shadow-xs"
                    title="Instagram"
                  >
                    <Instagram className="w-4 h-4" />
                  </a>
                )}
                {dev.facebook && (
                  <a
                    href={dev.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-9 h-9 rounded-xl bg-slate-100 dark:bg-muted hover:bg-blue-700 hover:text-white text-slate-700 dark:text-slate-200 flex items-center justify-center transition-all hover:scale-110 shadow-xs"
                    title="Facebook"
                  >
                    <Facebook className="w-4 h-4" />
                  </a>
                )}
              </div>

              {/* Responsibilities, Tech, Contributions */}
              <div className="mt-6 pt-5 border-t border-slate-200/80 dark:border-border space-y-4 text-left">
                {dev.responsibilities && (
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-primary mb-2">
                      <Layers className="w-3.5 h-3.5" />
                      Responsibilities
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      {dev.responsibilities.map((task, idx) => (
                        <li key={task + idx} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0"></span>
                          <span>{task}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {dev.technologies && (
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-primary mb-2">
                      <Code className="w-3.5 h-3.5" />
                      Technologies
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {dev.technologies.map((tech, idx) => (
                        <span
                          key={tech + idx}
                          className="bg-slate-100 dark:bg-muted/80 text-slate-800 dark:text-slate-200 font-medium text-xs rounded-lg px-2.5 py-1 border border-slate-200 dark:border-border"
                        >
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {dev.contributions && (
                  <div>
                    <div className="flex items-center gap-1.5 font-bold text-xs uppercase tracking-wider text-primary mb-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      Key Contributions
                    </div>
                    <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                      {dev.contributions.map((cont, idx) => (
                        <li key={cont + idx} className="flex items-start gap-2">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{cont}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        {/* About Section */}
        <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-transparent rounded-2xl border border-primary/20 p-8 md:p-12">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-4 text-center">
            About the Project
          </h2>
          <p className="text-muted-foreground text-center max-w-3xl mx-auto leading-relaxed">
            The NSS Management System is a comprehensive platform designed to manage volunteer participation, events, and community projects for the National Service Scheme at Gautam Buddha University. Built with modern web technology, it empowers students and coordinators to organize, track, and celebrate NSS activities in a seamless digital environment.
          </p>
        </div>
      </main>
    </div>
  )
}
