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
  Users,
  Globe2
} from "lucide-react"
import Footer from "@/components/footer"

type DeveloperRoleType = "Lead" | "Member" | "Thread" | "Advisor" | "Contributor"

interface Developer {
  id: string
  name: string
  role: string
  roleType: DeveloperRoleType
  image: string
  rollNumber: string
  batch: string
  course: string
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
    image: "https://res.cloudinary.com/depbzbjfu/image/upload/v1762062848/portfolio/profile/file_xqk3hs.png",
    rollNumber: "235/UCS/039",
    batch: "2023-27",
    course: "B-Tech Computer Science",
    school: "SOICT",
    department: "CSE",
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
  }
]

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Hero Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-gradient-to-br from-primary to-secondary rounded-2xl mb-6 shadow-lg">
            <Code className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Development Team
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-2">
            Meet the creative minds behind the NSS Management System
          </p>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            NSS Cell, Gautam Buddha University
          </p>
        </div>

        {/* Team Stats: Only Team Members, Open Source, Support */}
        <div className="bg-card rounded-2xl border border-border p-8 mb-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-xl mb-4">
                <Users className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-2">{developers.length}</h3>
              <p className="text-muted-foreground">Team Members</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-xl mb-4">
                <Code className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-2">100%</h3>
              <p className="text-muted-foreground">Open Source</p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-xl mb-4">
                <Globe2 className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-2">24/7</h3>
              <p className="text-muted-foreground">Support</p>
            </div>
          </div>
        </div>
        
        {/* Developers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {developers.map((dev) => (
            <div
              key={dev.id}
              className="group bg-card rounded-2xl border border-border p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Developer Image */}
              <div className="relative mb-6">
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 p-1 group-hover:from-primary/30 group-hover:to-secondary/30 transition-all">
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
              {/* Developer Info */}
              <div className="text-center mb-2">
                <h3 className="text-xl font-bold text-foreground">{dev.name}</h3>
                <p className="text-sm text-primary font-medium mb-1">{dev.role}</p>
                <span className="inline-flex items-center gap-1 mb-2 text-xs text-gray-500 uppercase tracking-wider font-semibold">
                  {dev.roleType}
                </span>
                {/* Personal details section */}
                <div className="text-xs text-muted-foreground mb-2 mt-2 space-y-1">
                  <div>School: <span className="font-semibold">{dev.school}</span></div>
                  <div>Department: <span className="font-semibold">{dev.department}</span></div>
                  <div>Course: <span className="font-semibold">{dev.course}</span></div>
                  <div>Batch: <span className="font-semibold">{dev.batch}</span></div>
                  <div>Roll Number: <span className="font-semibold">{dev.rollNumber}</span></div>
                </div>
                {dev.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{dev.bio}</p>
                )}
              </div>
              {/* Social Links */}
              <div className="flex items-center justify-center gap-3 pt-4 border-t border-border mt-4">
                {dev.email && (
                  <a
                    href={`mailto:${dev.email}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-all group/link"
                    title="Email"
                  >
                    <Mail className="w-4 h-4 group-hover/link:scale-110 transition-transform" />
                  </a>
                )}
                {dev.github && (
                  <a
                    href={dev.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-muted hover:bg-gray-900 hover:text-white flex items-center justify-center transition-all group/link"
                    title="GitHub"
                  >
                    <Github className="w-4 h-4 group-hover/link:scale-110 transition-transform" />
                  </a>
                )}
                {dev.linkedin && (
                  <a
                    href={dev.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-muted hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all group/link"
                    title="LinkedIn"
                  >
                    <Linkedin className="w-4 h-4 group-hover/link:scale-110 transition-transform" />
                  </a>
                )}
                {dev.website && (
                  <a
                    href={dev.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-all group/link"
                    title="Website"
                  >
                    <Globe className="w-4 h-4 group-hover/link:scale-110 transition-transform" />
                  </a>
                )}
                {dev.twitter && (
                  <a
                    href={dev.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-muted hover:bg-blue-400 hover:text-white flex items-center justify-center transition-all group/link"
                    title="Twitter"
                  >
                    <Twitter className="w-4 h-4 group-hover/link:scale-110 transition-transform" />
                  </a>
                )}
                {dev.instagram && (
                  <a
                    href={dev.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-muted hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white flex items-center justify-center transition-all group/link"
                    title="Instagram"
                  >
                    <Instagram className="w-4 h-4 group-hover/link:scale-110 transition-transform" />
                  </a>
                )}
                {dev.facebook && (
                  <a
                    href={dev.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-muted hover:bg-blue-700 hover:text-white flex items-center justify-center transition-all group/link"
                    title="Facebook"
                  >
                    <Facebook className="w-4 h-4 group-hover/link:scale-110 transition-transform" />
                  </a>
                )}
              </div>
              {/* Responsibilities, Tech, Contributions */}
              <div className="mt-6 px-2 space-y-2 text-left text-xs text-gray-700">
                {dev.responsibilities && (
                  <>
                    <div className="font-semibold text-primary mb-1">Responsibilities</div>
                    <ul className="list-disc ml-5 mb-2">
                      {dev.responsibilities.map((task, idx) => (
                        <li key={task + idx}>{task}</li>
                      ))}
                    </ul>
                  </>
                )}
                {dev.technologies && (
                  <>
                    <div className="font-semibold text-primary mb-1">Technologies</div>
                    <div className="flex flex-wrap gap-2 mb-1">
                      {dev.technologies.map((tech, idx) => (
                        <span key={tech + idx} className="bg-primary/10 text-xs rounded px-2 py-0.5">{tech}</span>
                      ))}
                    </div>
                  </>
                )}
                {dev.contributions && (
                  <>
                    <div className="font-semibold text-primary mb-1">Key Contributions</div>
                    <ul className="list-disc ml-5">
                      {dev.contributions.map((cont, idx) => (
                        <li key={cont + idx}>{cont}</li>
                      ))}
                    </ul>
                  </>
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
      <Footer />
    </div>
  )
}
