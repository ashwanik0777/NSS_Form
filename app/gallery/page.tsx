"use client"

import React, { useState, useEffect } from "react"
import PublicNavbar from "@/components/public-navbar"
import Footer from "@/components/footer"
import {
  Image as ImageIcon,
  Search,
  X,
  Calendar,
  Eye,
  Download,
  ExternalLink,
  ChevronLeft,
  ChevronRight,
  Filter,
  Sparkles,
  Loader2,
} from "lucide-react"

interface GalleryItem {
  _id: string
  title: string
  description?: string
  imageUrl: string
  category: string
  eventDate?: string
  isFeatured?: boolean
  createdAt: string
}

const CATEGORIES = [
  "All",
  "Events",
  "Camps",
  "Blood Donation",
  "Tree Plantation",
  "Orientation",
  "Social Awareness",
  "Celebrations",
  "Other",
]

export default function PublicGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [stats, setStats] = useState<Record<string, number>>({})
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Lightbox state
  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null)

  useEffect(() => {
    fetchGallery(page, selectedCategory, search)
  }, [page, selectedCategory])

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGallery(1, selectedCategory, search)
    }, 300)
    return () => clearTimeout(timer)
  }, [search])

  const fetchGallery = async (pageNum: number, cat: string, searchStr: string) => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        page: pageNum.toString(),
        limit: "24",
      })
      if (cat && cat !== "All") params.append("category", cat)
      if (searchStr.trim()) params.append("search", searchStr.trim())

      const res = await fetch(`/api/gallery?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setItems(data.items || [])
        setStats(data.stats || {})
        setTotalPages(data.pagination?.pages || 1)
        setTotalItems(data.pagination?.total || 0)
      }
    } catch (err) {
      console.error("Error loading public gallery:", err)
    } finally {
      setLoading(false)
    }
  }

  const activeLightboxItem = lightboxIndex !== null && items[lightboxIndex] ? items[lightboxIndex] : null

  const handleNextPhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex + 1) % items.length)
    }
  }

  const handlePrevPhoto = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (lightboxIndex !== null) {
      setLightboxIndex((lightboxIndex - 1 + items.length) % items.length)
    }
  }

  // Keyboard navigation for Lightbox
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (lightboxIndex === null) return
      if (e.key === "Escape") setLightboxIndex(null)
      if (e.key === "ArrowRight") setLightboxIndex((prev) => (prev !== null ? (prev + 1) % items.length : null))
      if (e.key === "ArrowLeft") setLightboxIndex((prev) => (prev !== null ? (prev - 1 + items.length) % items.length : null))
    }
    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [lightboxIndex, items.length])

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50/30 via-background to-background dark:from-blue-950/20 dark:via-background dark:to-background text-foreground flex flex-col justify-between">
      <div>
        <PublicNavbar />

        {/* Gallery Hero Banner */}
        <section className="relative overflow-hidden py-14 sm:py-20 px-4 border-b border-border/60">
          <div className="absolute inset-0 bg-[radial-gradient(#94a3b8_1px,transparent_1px)] dark:bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:24px_24px] opacity-25 pointer-events-none"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[250px] bg-blue-500/10 blur-[120px] pointer-events-none rounded-full"></div>

          <div className="max-w-4xl mx-auto text-center relative z-10 space-y-3">

            <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              Photo Gallery
            </h1>

          </div>
        </section>

        {/* Search Bar */}
        <section className="py-6 px-4 max-w-7xl mx-auto space-y-4">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-card border border-border p-3.5 sm:p-4 rounded-2xl shadow-xs">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search gallery photos by title or activity..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs sm:text-sm border border-border rounded-xl bg-background outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="text-xs text-muted-foreground font-medium shrink-0 pl-1">
              Showing <strong>{totalItems}</strong> photos
            </div>
          </div>

          {/* Photos Grid */}
          {loading ? (
            <div className="flex flex-col items-center justify-center py-24">
              <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
              <p className="text-xs text-muted-foreground">Loading photos from Cloudinary...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="bg-card border border-border rounded-3xl p-12 text-center space-y-3 my-8">
              <div className="w-14 h-14 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
                <ImageIcon className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-base text-foreground">No photos found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                No gallery pictures matching the selected filter were found. Try selecting "All" or searching for a different keyword.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5 pt-2">
              {items.map((item, idx) => (
                <div
                  key={item._id}
                  onClick={() => setLightboxIndex(idx)}
                  className="group relative bg-white dark:bg-card border border-slate-200/90 dark:border-border rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 cursor-pointer flex flex-col justify-between"
                >
                  {/* Photo Display */}
                  <div className="relative aspect-4/3 w-full overflow-hidden bg-slate-100 dark:bg-muted/40">
                    <img
                      src={item.imageUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      loading="lazy"
                    />

                    {/* Gradient overlay on hover */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3.5">
                      <span className="text-white text-xs font-semibold flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5" /> View Photo
                      </span>
                    </div>

                    {/* Category Pill */}
                    <div className="absolute top-2.5 left-2.5 pointer-events-none">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/20">
                        {item.category}
                      </span>
                    </div>
                  </div>

                  {/* Caption & Date */}
                  <div className="p-3.5 space-y-1.5 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-sm text-slate-900 dark:text-white leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1 leading-relaxed">
                          {item.description}
                        </p>
                      )}
                    </div>

                    <div className="pt-2 border-t border-slate-100 dark:border-border/60 flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
                      <Calendar className="w-3 h-3 text-primary" />
                      <span>
                        {new Date(item.eventDate || item.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {totalItems > 24 && (
            <div className="flex items-center justify-between pt-6 border-t border-border text-xs text-muted-foreground pb-8">
              <span>
                Showing {(page - 1) * 24 + 1}–{Math.min(page * 24, totalItems)} of {totalItems} photos
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page === 1}
                  className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-40"
                >
                  Previous
                </button>
                <span className="font-semibold text-foreground px-1">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-border bg-background hover:bg-muted disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* ── INTERACTIVE LIGHTBOX MODAL ─────────────────────────────────────── */}
      {activeLightboxItem && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-60 p-3 sm:p-6"
          onClick={() => setLightboxIndex(null)}
        >
          {/* Navigation Arrows */}
          {items.length > 1 && (
            <>
              <button
                onClick={handlePrevPhoto}
                className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all z-20"
                title="Previous Photo (Left Arrow)"
              >
                <ChevronLeft className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
              <button
                onClick={handleNextPhoto}
                className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 p-2.5 sm:p-3 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-md transition-all z-20"
                title="Next Photo (Right Arrow)"
              >
                <ChevronRight className="w-5 h-5 sm:w-6 sm:h-6" />
              </button>
            </>
          )}

          <div
            className="relative max-w-4xl w-full max-h-[92vh] flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-2xl z-10"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Top Bar */}
            <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-border bg-card">
              <div className="min-w-0 pr-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                  {activeLightboxItem.category}
                </span>
                <h3 className="font-bold text-foreground text-sm sm:text-base truncate mt-1">
                  {activeLightboxItem.title}
                </h3>
              </div>
              <button
                onClick={() => setLightboxIndex(null)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Photo View */}
            <div className="p-2 sm:p-4 bg-black/60 flex items-center justify-center overflow-hidden flex-1 max-h-[66vh]">
              <img
                src={activeLightboxItem.imageUrl}
                alt={activeLightboxItem.title}
                className="max-h-[66vh] w-auto max-w-full object-contain mx-auto rounded-lg shadow-lg"
              />
            </div>

            {/* Footer with Caption & Action Links */}
            <div className="p-3.5 sm:p-4 border-t border-border bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="text-muted-foreground flex-1">
                {activeLightboxItem.description && (
                  <p className="text-foreground text-xs leading-relaxed mb-1">
                    {activeLightboxItem.description}
                  </p>
                )}
                <span>
                  Captured on:{" "}
                  <strong>
                    {new Date(activeLightboxItem.eventDate || activeLightboxItem.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <a
                  href={activeLightboxItem.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 text-xs shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Original
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      <Footer />
    </div>
  )
}

