"use client"

import Link from "next/link"
import { ArrowLeft, Github, Linkedin, Mail, Globe, Twitter, Instagram, Facebook, Code, Users } from "lucide-react"
import Footer from "@/components/footer"

interface Developer {
  name: string
  role: string
  image: string
  email?: string
  github?: string
  linkedin?: string
  website?: string
  twitter?: string
  instagram?: string
  facebook?: string
  bio?: string
}

const developers: Developer[] = [
  {
    name: "Developer Name 1",
    role: "Full Stack Developer",
    image: "/developers/dev1.jpg",
    email: "developer1@gbu.ac.in",
    github: "https://github.com/developer1",
    linkedin: "https://linkedin.com/in/developer1",
    website: "https://developer1.dev",
    twitter: "https://twitter.com/developer1",
    bio: "Passionate about building scalable web applications and contributing to open source projects.",
  },
  {
    name: "Developer Name 2",
    role: "Frontend Developer",
    image: "/developers/dev2.jpg",
    email: "developer2@gbu.ac.in",
    github: "https://github.com/developer2",
    linkedin: "https://linkedin.com/in/developer2",
    website: "https://developer2.dev",
    instagram: "https://instagram.com/developer2",
    bio: "UI/UX enthusiast with expertise in modern frontend frameworks and design systems.",
  },
  {
    name: "Developer Name 3",
    role: "Backend Developer",
    image: "/developers/dev3.jpg",
    email: "developer3@gbu.ac.in",
    github: "https://github.com/developer3",
    linkedin: "https://linkedin.com/in/developer3",
    website: "https://developer3.dev",
    bio: "Specialized in building robust APIs and database architectures for enterprise applications.",
  },
  {
    name: "Developer Name 4",
    role: "Full Stack Developer",
    image: "/developers/dev4.jpg",
    email: "developer4@gbu.ac.in",
    github: "https://github.com/developer4",
    linkedin: "https://linkedin.com/in/developer4",
    twitter: "https://twitter.com/developer4",
    bio: "Full-stack developer with expertise in cloud computing and DevOps practices.",
  },
]

export default function DevelopersPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
    

      {/* Main Content */}
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
            Meet the talented developers behind the NSS Management System
          </p>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            NSS Cell, Gautam Buddha University
          </p>
        </div>

 {/* Team Stats */}
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
                <Globe className="w-8 h-8 text-primary" />
              </div>
              <h3 className="text-3xl font-bold text-foreground mb-2">24/7</h3>
              <p className="text-muted-foreground">Support</p>
            </div>
          </div>
        </div>
        
        {/* Developers Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {developers.map((developer, index) => (
            <div
              key={index}
              className="group bg-card rounded-2xl border border-border p-6 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
            >
              {/* Developer Image */}
              <div className="relative mb-6">
                <div className="w-32 h-32 mx-auto rounded-full bg-gradient-to-br from-primary/20 to-secondary/20 p-1 group-hover:from-primary/30 group-hover:to-secondary/30 transition-all">
                  <div className="w-full h-full rounded-full bg-card overflow-hidden flex items-center justify-center">
                    {developer.image ? (
                      <img
                        src={developer.image}
                        alt={developer.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = "none"
                          const parent = target.parentElement
                          if (parent) {
                            parent.innerHTML = `<div class="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary text-white text-3xl font-bold">${developer.name.charAt(0)}</div>`
                          }
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-secondary text-white text-3xl font-bold">
                        {developer.name.charAt(0)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Developer Info */}
              <div className="text-center mb-4">
                <h3 className="text-xl font-bold text-foreground mb-1">{developer.name}</h3>
                <p className="text-sm text-primary font-medium mb-3">{developer.role}</p>
                {developer.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">{developer.bio}</p>
                )}
              </div>

              {/* Social Links */}
              <div className="flex items-center justify-center gap-3 pt-4 border-t border-border">
                {developer.email && (
                  <a
                    href={`mailto:${developer.email}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-all group/link"
                    title="Email"
                  >
                    <Mail className="w-4 h-4 group-hover/link:scale-110 transition-transform" />
                  </a>
                )}
                {developer.github && (
                  <a
                    href={developer.github}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-muted hover:bg-gray-900 hover:text-white flex items-center justify-center transition-all group/link"
                    title="GitHub"
                  >
                    <Github className="w-4 h-4 group-hover/link:scale-110 transition-transform" />
                  </a>
                )}
                {developer.linkedin && (
                  <a
                    href={developer.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-muted hover:bg-blue-600 hover:text-white flex items-center justify-center transition-all group/link"
                    title="LinkedIn"
                  >
                    <Linkedin className="w-4 h-4 group-hover/link:scale-110 transition-transform" />
                  </a>
                )}
                {developer.website && (
                  <a
                    href={developer.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-muted hover:bg-primary hover:text-primary-foreground flex items-center justify-center transition-all group/link"
                    title="Website"
                  >
                    <Globe className="w-4 h-4 group-hover/link:scale-110 transition-transform" />
                  </a>
                )}
                {developer.twitter && (
                  <a
                    href={developer.twitter}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-muted hover:bg-blue-400 hover:text-white flex items-center justify-center transition-all group/link"
                    title="Twitter"
                  >
                    <Twitter className="w-4 h-4 group-hover/link:scale-110 transition-transform" />
                  </a>
                )}
                {developer.instagram && (
                  <a
                    href={developer.instagram}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-muted hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:text-white flex items-center justify-center transition-all group/link"
                    title="Instagram"
                  >
                    <Instagram className="w-4 h-4 group-hover/link:scale-110 transition-transform" />
                  </a>
                )}
                {developer.facebook && (
                  <a
                    href={developer.facebook}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-10 h-10 rounded-lg bg-muted hover:bg-blue-700 hover:text-white flex items-center justify-center transition-all group/link"
                    title="Facebook"
                  >
                    <Facebook className="w-4 h-4 group-hover/link:scale-110 transition-transform" />
                  </a>
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
            The NSS Management System is a comprehensive platform designed to streamline volunteer management, 
            event coordination, and community engagement for the National Service Scheme at Gautam Buddha University. 
            Built with modern web technologies, this system provides a seamless experience for volunteers, 
            administrators, and coordinators to manage NSS activities efficiently.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  )
}

