"use client"

import React, { useState, useEffect, useRef } from "react"
import AdminHeader from "@/components/admin/AdminHeader"
import {
  Image as ImageIcon,
  Upload,
  Plus,
  Search,
  X,
  Trash2,
  Edit,
  ExternalLink,
  Calendar,
  Star,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Filter,
  Eye,
  EyeOff,
  Copy,
  Check,
  Sparkles,
  Layers,
  FileImage,
  Zap,
} from "lucide-react"

interface GalleryItem {
  _id: string
  title: string
  description?: string
  imageUrl: string
  publicId?: string
  category: string
  eventDate?: string
  isFeatured: boolean
  isVisible?: boolean
  tags?: string[]
  createdAt: string
}

interface UploadQueueItem {
  id: string
  file: File
  preview: string
  title: string
  caption: string
  status: "idle" | "uploading" | "success" | "error"
  errorMessage?: string
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

function getCleanFileName(filename: string): string {
  const withoutExt = filename.replace(/\.[^/.]+$/, "")
  const cleaned = withoutExt.replace(/[-_]/g, " ").replace(/\s+/g, " ").trim()
  return cleaned ? cleaned.charAt(0).toUpperCase() + cleaned.slice(1) : "NSS Photo"
}

export default function AdminGalleryPage() {
  const [items, setItems] = useState<GalleryItem[]>([])
  const [stats, setStats] = useState<Record<string, number>>({})
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [selectedCategory, setSelectedCategory] = useState("All")
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalItems, setTotalItems] = useState(0)

  // Upload modal state (supports both single & multi photo batch upload)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccessMsg, setUploadSuccessMsg] = useState<string | null>(null)
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([])
  const [eventBatchTitle, setEventBatchTitle] = useState("")
  const [uploadDescription, setUploadDescription] = useState("")
  const [uploadCategory, setUploadCategory] = useState("Events")
  const [uploadDate, setUploadDate] = useState(new Date().toISOString().split("T")[0])
  const [uploadFeatured, setUploadFeatured] = useState(false)
  const [uploadVisible, setUploadVisible] = useState(true)
  const [uploadProgress, setUploadProgress] = useState({ current: 0, total: 0 })
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Edit modal state
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null)
  const [editTitle, setEditTitle] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [editCategory, setEditCategory] = useState("Events")
  const [editDate, setEditDate] = useState("")
  const [editFeatured, setEditFeatured] = useState(false)
  const [editVisible, setEditVisible] = useState(true)
  const [savingEdit, setSavingEdit] = useState(false)

  // Bulk actions state
  const [bulkLoading, setBulkLoading] = useState(false)

  // Lightbox view state
  const [lightboxItem, setLightboxItem] = useState<GalleryItem | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => {
    fetchGallery(page, selectedCategory, search)
  }, [page, selectedCategory])

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchGallery(1, selectedCategory, search)
    }, 350)
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

      const res = await fetch(`/api/admin/gallery?${params.toString()}`)
      const data = await res.json()
      if (data.success) {
        setItems(data.items || [])
        setStats(data.stats || {})
        setTotalPages(data.pagination?.pages || 1)
        setTotalItems(data.pagination?.total || 0)
      }
    } catch (err) {
      console.error("Error loading gallery:", err)
    } finally {
      setLoading(false)
    }
  }

  // Handle multi-file or single-file select
  const handleFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    const newItems: UploadQueueItem[] = []
    const errors: string[] = []

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      if (!file.type.startsWith("image/")) {
        errors.push(`${file.name}: Not an image`)
        continue
      }

      if (file.size > 15 * 1024 * 1024) {
        errors.push(`${file.name}: Exceeds 15MB limit`)
        continue
      }

      const preview = URL.createObjectURL(file)
      const cleanName = getCleanFileName(file.name)
      const count = uploadQueue.length + newItems.length + 1
      const defaultTitle = eventBatchTitle.trim()
        ? `${eventBatchTitle.trim()} - #${count}`
        : cleanName

      newItems.push({
        id: `${Date.now()}-${i}-${Math.random().toString(36).substring(2, 7)}`,
        file,
        preview,
        title: defaultTitle,
        caption: "",
        status: "idle",
      })
    }

    if (errors.length > 0) {
      setUploadError(errors.join(" • "))
    } else {
      setUploadError(null)
    }

    setUploadQueue((prev) => [...prev, ...newItems])
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // Quick Action: Apply Event Batch Title to all photos with numbered suffix
  const handleApplyBatchTitleToAll = () => {
    if (!eventBatchTitle.trim()) {
      setUploadError("Please type an Event / Batch Title first")
      return
    }
    setUploadError(null)
    setUploadQueue((prev) =>
      prev.map((item, idx) => ({
        ...item,
        title: `${eventBatchTitle.trim()} - #${idx + 1}`,
      }))
    )
  }

  // Quick Action: Reset individual titles to clean file names
  const handleResetToFileNames = () => {
    setUploadQueue((prev) =>
      prev.map((item) => ({
        ...item,
        title: getCleanFileName(item.file.name),
      }))
    )
  }

  // Remove a single photo from upload queue
  const handleRemoveQueueItem = (id: string) => {
    setUploadQueue((prev) => {
      const target = prev.find((i) => i.id === id)
      if (target?.preview) {
        URL.revokeObjectURL(target.preview)
      }
      return prev.filter((i) => i.id !== id)
    })
  }

  // Update distinct title for a photo in queue
  const handleUpdateItemTitle = (id: string, newTitle: string) => {
    setUploadQueue((prev) =>
      prev.map((i) => (i.id === id ? { ...i, title: newTitle } : i))
    )
  }

  // Update distinct description/caption for a photo in queue
  const handleUpdateItemCaption = (id: string, newCaption: string) => {
    setUploadQueue((prev) =>
      prev.map((i) => (i.id === id ? { ...i, caption: newCaption } : i))
    )
  }

  // Submit Batch Upload
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (uploadQueue.length === 0) {
      setUploadError("Please choose at least one photo to upload")
      return
    }

    try {
      setUploading(true)
      setUploadError(null)
      setUploadSuccessMsg(null)
      setUploadProgress({ current: 0, total: uploadQueue.length })

      let successCount = 0
      let failCount = 0

      // Upload photos sequentially for rock-solid reliability & progress tracking
      for (let i = 0; i < uploadQueue.length; i++) {
        const item = uploadQueue[i]
        if (item.status === "success") {
          successCount++
          continue
        }

        // Set status to uploading
        setUploadQueue((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, status: "uploading" } : p))
        )

        try {
          const finalTitle =
            item.title.trim() ||
            (eventBatchTitle.trim() ? `${eventBatchTitle.trim()} - #${i + 1}` : getCleanFileName(item.file.name))
          const finalDescription = item.caption.trim() || uploadDescription.trim()

          const formData = new FormData()
          formData.append("file", item.file)
          formData.append("title", finalTitle)
          formData.append("description", finalDescription)
          formData.append("category", uploadCategory || "Other")
          formData.append("eventDate", uploadDate)
          formData.append("isFeatured", uploadFeatured ? "true" : "false")
          formData.append("isVisible", uploadVisible ? "true" : "false")

          const res = await fetch("/api/admin/gallery", {
            method: "POST",
            body: formData,
          })

          const data = await res.json()
          if (res.ok && data.success) {
            successCount++
            setUploadProgress({ current: successCount, total: uploadQueue.length })
            setUploadQueue((prev) =>
              prev.map((p) => (p.id === item.id ? { ...p, status: "success" } : p))
            )
          } else {
            failCount++
            setUploadQueue((prev) =>
              prev.map((p) =>
                p.id === item.id
                  ? { ...p, status: "error", errorMessage: data.message || "Failed" }
                  : p
              )
            )
          }
        } catch (itemErr: any) {
          failCount++
          setUploadQueue((prev) =>
            prev.map((p) =>
              p.id === item.id
                ? { ...p, status: "error", errorMessage: itemErr.message || "Network error" }
                : p
            )
          )
        }
      }

      if (successCount > 0) {
        await fetchGallery(1, selectedCategory, search)
      }

      if (failCount === 0) {
        setUploadSuccessMsg(`All ${successCount} photo(s) uploaded and saved successfully!`)
        setTimeout(() => {
          resetUploadForm()
          setShowUploadModal(false)
        }, 1200)
      } else {
        setUploadError(`${failCount} photo(s) failed to upload. You can retry the failed photos.`)
      }
    } catch (err: any) {
      console.error("Upload error:", err)
      setUploadError("Network error occurred during upload. Please try again.")
    } finally {
      setUploading(false)
    }
  }

  const resetUploadForm = () => {
    uploadQueue.forEach((item) => {
      if (item.preview) URL.revokeObjectURL(item.preview)
    })
    setUploadQueue([])
    setEventBatchTitle("")
    setUploadDescription("")
    setUploadCategory("Events")
    setUploadDate(new Date().toISOString().split("T")[0])
    setUploadFeatured(false)
    setUploadVisible(true)
    setUploadError(null)
    setUploadSuccessMsg(null)
    setUploadProgress({ current: 0, total: 0 })
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  // Toggle visible status individually
  const handleToggleVisibility = async (item: GalleryItem) => {
    try {
      const newVisible = item.isVisible === false ? true : false
      const res = await fetch("/api/admin/gallery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item._id, isVisible: newVisible }),
      })
      const data = await res.json()
      if (data.success) {
        setItems((prev) =>
          prev.map((i) => (i._id === item._id ? { ...i, isVisible: newVisible } : i))
        )
      }
    } catch (err) {
      console.error("Failed to toggle visibility:", err)
    }
  }

  // Bulk visibility: Show all or hide all at once
  const handleBulkVisibility = async (show: boolean) => {
    const actionText = show ? "show all photos publicly" : "hide all photos from the public gallery"
    if (!confirm(`Are you sure you want to ${actionText}?`)) {
      return
    }

    try {
      setBulkLoading(true)
      const res = await fetch("/api/admin/gallery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "bulkVisibility", isVisible: show }),
      })
      const data = await res.json()
      if (data.success) {
        await fetchGallery(page, selectedCategory, search)
      } else {
        alert(data.message || "Failed to update bulk visibility")
      }
    } catch (err) {
      alert("Error updating bulk visibility")
    } finally {
      setBulkLoading(false)
    }
  }

  // Toggle featured flag quickly
  const handleToggleFeatured = async (item: GalleryItem) => {
    try {
      const newFeatured = !item.isFeatured
      const res = await fetch("/api/admin/gallery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: item._id, isFeatured: newFeatured }),
      })
      const data = await res.json()
      if (data.success) {
        setItems((prev) =>
          prev.map((i) => (i._id === item._id ? { ...i, isFeatured: newFeatured } : i))
        )
      }
    } catch (err) {
      console.error("Failed to toggle featured:", err)
    }
  }

  // Open Edit Modal
  const handleOpenEdit = (item: GalleryItem) => {
    setEditingItem(item)
    setEditTitle(item.title)
    setEditDescription(item.description || "")
    setEditCategory(item.category || "Events")
    setEditDate(
      item.eventDate ? new Date(item.eventDate).toISOString().split("T")[0] : ""
    )
    setEditFeatured(item.isFeatured || false)
    setEditVisible(item.isVisible !== false)
  }

  // Save Edit
  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingItem) return

    try {
      setSavingEdit(true)
      const res = await fetch("/api/admin/gallery", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: editingItem._id,
          title: editTitle.trim(),
          description: editDescription.trim(),
          category: editCategory,
          eventDate: editDate,
          isFeatured: editFeatured,
          isVisible: editVisible,
        }),
      })
      const data = await res.json()
      if (data.success) {
        setEditingItem(null)
        await fetchGallery(page, selectedCategory, search)
      } else {
        alert(data.message || "Failed to update item")
      }
    } catch (err) {
      alert("Failed to update photo details")
    } finally {
      setSavingEdit(false)
    }
  }

  // Delete photo
  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete "${title}"? This will permanently delete the photo from Cloudinary and the gallery.`)) {
      return
    }

    try {
      const res = await fetch(`/api/admin/gallery?id=${id}`, {
        method: "DELETE",
      })
      const data = await res.json()
      if (data.success) {
        setItems((prev) => prev.filter((i) => i._id !== id))
        setTotalItems((prev) => Math.max(0, prev - 1))
      } else {
        alert(data.message || "Failed to delete photo")
      }
    } catch (err) {
      alert("Error deleting photo")
    }
  }

  // Copy Image Link
  const handleCopyLink = (url: string, id: string) => {
    navigator.clipboard.writeText(url)
    setCopiedId(id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  return (
    <div className="space-y-6">
      <AdminHeader
        title="Media Gallery"
        subtitle="Upload photos directly to Cloudinary and showcase events, camps, and activities across NSS"
        action={
          <button
            onClick={() => {
              resetUploadForm()
              setShowUploadModal(true)
            }}
            className="flex items-center gap-2 px-4 py-2.5 bg-primary text-primary-foreground font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-md active:scale-95 text-xs sm:text-sm"
          >
            <Plus className="w-4 h-4" />
            Upload Photos
          </button>
        }
      />

      <div className="p-4 sm:p-6 space-y-5 max-w-7xl mx-auto">
        {/* Top Summary Stats Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          <div className="bg-card border border-border rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Total Photos</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-foreground mt-1">{totalItems}</p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-600 flex items-center justify-center">
                <ImageIcon className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Featured</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-amber-600 mt-1">
                  {items.filter((i) => i.isFeatured).length}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-600 flex items-center justify-center">
                <Star className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Categories</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-emerald-600 mt-1">
                  {Object.keys(stats).filter((k) => k !== "All" && stats[k] > 0).length || CATEGORIES.length - 1}
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Filter className="w-5 h-5" />
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Storage</p>
                <p className="text-sm sm:text-base font-bold text-foreground mt-1 flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                  Cloudinary CDN
                </p>
              </div>
              <div className="w-10 h-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
            </div>
          </div>
        </div>

        {/* Filter and Search Bar */}
        <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-xs">
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            {/* Search Input */}
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search photo title, description, tags..."
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

            {/* Bulk Visibility Actions & Add Image */}
            <div className="flex items-center gap-1.5 shrink-0 flex-wrap">
              <button
                type="button"
                onClick={() => handleBulkVisibility(true)}
                disabled={bulkLoading || items.length === 0}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200/80 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 shrink-0"
                title="Make all gallery photos visible to website visitors"
              >
                <Eye className="w-3.5 h-3.5" />
                Show All Public
              </button>
              <button
                type="button"
                onClick={() => handleBulkVisibility(false)}
                disabled={bulkLoading || items.length === 0}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50 shrink-0"
                title="Hide all gallery photos from the public gallery"
              >
                <EyeOff className="w-3.5 h-3.5" />
                Hide All
              </button>

              <button
                onClick={() => {
                  resetUploadForm()
                  setShowUploadModal(true)
                }}
                className="inline-flex items-center justify-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-xl text-xs sm:text-sm font-semibold transition-colors shrink-0 shadow-xs"
              >
                <Upload className="w-4 h-4" />
                Upload Photos
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 pt-1 no-scrollbar">
            {CATEGORIES.map((cat) => {
              const count = cat === "All" ? totalItems : stats[cat] || 0
              const isSelected = selectedCategory === cat

              return (
                <button
                  key={cat}
                  onClick={() => {
                    setSelectedCategory(cat)
                    setPage(1)
                  }}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-primary text-primary-foreground shadow-xs"
                      : "bg-muted/40 hover:bg-muted text-muted-foreground border border-border"
                  }`}
                >
                  <span>{cat}</span>
                  {count > 0 && (
                    <span
                      className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                        isSelected
                          ? "bg-white/20 text-white"
                          : "bg-background text-muted-foreground border border-border"
                      }`}
                    >
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Gallery Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary mb-3" />
            <p className="text-xs text-muted-foreground">Loading gallery photos from Cloudinary...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-card border border-border rounded-2xl p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-muted/60 text-muted-foreground flex items-center justify-center mx-auto">
              <ImageIcon className="w-8 h-8" />
            </div>
            <div>
              <h3 className="font-bold text-base text-foreground">No photos found</h3>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {search || selectedCategory !== "All"
                  ? "Try adjusting your search query or switching to another category."
                  : "Your gallery is currently empty. Upload your first NSS activity photo to get started!"}
              </p>
            </div>
            <button
              onClick={() => {
                resetUploadForm()
                setShowUploadModal(true)
              }}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-xl hover:bg-primary/90 transition-all shadow-xs"
            >
              <Plus className="w-4 h-4" />
              Upload First Photo
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-5">
            {items.map((item) => (
              <div
                key={item._id}
                className="group bg-card border border-border rounded-2xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 hover:-translate-y-1 flex flex-col justify-between"
              >
                {/* Image & Badges */}
                <div className="relative aspect-4/3 w-full overflow-hidden bg-muted/30 cursor-pointer" onClick={() => setLightboxItem(item)}>
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-3">
                    <span className="text-white text-xs font-semibold flex items-center gap-1">
                      <Eye className="w-3.5 h-3.5" /> Click to view full
                    </span>
                  </div>

                  {/* Top Bar Badges */}
                  <div className="absolute top-2.5 left-2.5 right-2.5 flex items-center justify-between gap-1.5 pointer-events-none">
                    <div className="flex items-center gap-1">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-black/60 backdrop-blur-md text-white border border-white/20">
                        {item.category || "General"}
                      </span>

                      {/* Visibility Quick Toggle */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation()
                          handleToggleVisibility(item)
                        }}
                        className={`pointer-events-auto px-2 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-md transition-all flex items-center gap-1 ${
                          item.isVisible === false
                            ? "bg-rose-500/90 text-white shadow-xs"
                            : "bg-emerald-600/90 text-white shadow-xs"
                        }`}
                        title={item.isVisible === false ? "Hidden from public (Click to make visible)" : "Visible publicly (Click to hide)"}
                      >
                        {item.isVisible === false ? (
                          <>
                            <EyeOff className="w-3 h-3" /> Hidden
                          </>
                        ) : (
                          <>
                            <Eye className="w-3 h-3" /> Visible
                          </>
                        )}
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        handleToggleFeatured(item)
                      }}
                      className={`pointer-events-auto p-1.5 rounded-md backdrop-blur-md transition-all ${
                        item.isFeatured
                          ? "bg-amber-500 text-white shadow-md scale-105"
                          : "bg-black/50 hover:bg-black/80 text-white/70 hover:text-white"
                      }`}
                      title={item.isFeatured ? "Featured (Click to unfeature)" : "Click to feature on homepage"}
                    >
                      <Star className={`w-3.5 h-3.5 ${item.isFeatured ? "fill-white" : ""}`} />
                    </button>
                  </div>
                </div>

                {/* Content Details */}
                <div className="p-3.5 flex-1 flex flex-col justify-between space-y-2">
                  <div>
                    <h4 className="font-bold text-foreground text-sm leading-snug line-clamp-1 group-hover:text-primary transition-colors">
                      {item.title}
                    </h4>
                    {item.description ? (
                      <p className="text-xs text-muted-foreground line-clamp-2 mt-1 leading-relaxed">
                        {item.description}
                      </p>
                    ) : (
                      <p className="text-xs text-muted-foreground/60 italic mt-1">No description provided</p>
                    )}
                  </div>

                  <div className="pt-2 border-t border-border/50 flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-primary" />
                      {new Date(item.eventDate || item.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>

                    {/* Quick action buttons */}
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleCopyLink(item.imageUrl, item._id)}
                        className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted rounded-lg transition-colors"
                        title="Copy Cloudinary Image URL"
                      >
                        {copiedId === item._id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>

                      <button
                        onClick={() => handleOpenEdit(item)}
                        className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        title="Edit Details"
                      >
                        <Edit className="w-3.5 h-3.5" />
                      </button>

                      <button
                        onClick={() => handleDelete(item._id, item.title)}
                        className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                        title="Delete Photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalItems > 24 && (
          <div className="flex items-center justify-between pt-4 border-t border-border text-xs text-muted-foreground">
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
      </div>

      {/* ── UPLOAD MODAL (BATCH / MULTI-PHOTO & SINGLE PHOTO) ────────────────── */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4 overflow-y-auto">
          <div className="bg-card border border-border rounded-3xl max-w-3xl w-full my-6 shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 sm:p-5 border-b border-border shrink-0">
              <div className="space-y-0.5">
                <h3 className="font-bold text-base sm:text-lg text-foreground flex items-center gap-2">
                  <Layers className="w-5 h-5 text-primary" />
                  Upload Photos to Gallery
                </h3>
                <p className="text-xs text-muted-foreground">
                  Select one or multiple photos at once. Set a common event title or customize individual captions.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  if (!uploading) {
                    resetUploadForm()
                    setShowUploadModal(false)
                  }
                }}
                disabled={uploading}
                className="p-1.5 rounded-xl hover:bg-muted text-muted-foreground hover:text-foreground disabled:opacity-40"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-4 sm:p-6 space-y-5 overflow-y-auto flex-1">
              {/* Success Notification */}
              {uploadSuccessMsg && (
                <div className="p-3.5 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-700 dark:text-emerald-300 text-xs font-semibold flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
                  <span>{uploadSuccessMsg}</span>
                </div>
              )}

              {/* Error Notification */}
              {uploadError && (
                <div className="p-3.5 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* Progress Bar during upload */}
              {uploading && (
                <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-primary">
                    <span className="flex items-center gap-2">
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Uploading photos to Cloudinary CDN...
                    </span>
                    <span>
                      {uploadProgress.current} / {uploadProgress.total} ({Math.round((uploadProgress.current / Math.max(1, uploadProgress.total)) * 100)}%)
                    </span>
                  </div>
                  <div className="w-full bg-primary/10 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-primary h-2 rounded-full transition-all duration-300"
                      style={{
                        width: `${Math.round((uploadProgress.current / Math.max(1, uploadProgress.total)) * 100)}%`,
                      }}
                    ></div>
                  </div>
                </div>
              )}

              {/* ── SECTION 1: EVENT / BATCH DETAILS ─────────────────────── */}
              <div className="bg-muted/30 border border-border rounded-2xl p-4 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    Event / Batch Information
                  </h4>
                  <span className="text-[11px] text-muted-foreground">Applied to all photos in this batch</span>
                </div>

                {/* Event Batch Title */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Event / Batch Title
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Swachh Bharat Cleanliness Drive, Blood Donation Camp 2026..."
                    value={eventBatchTitle}
                    onChange={(e) => setEventBatchTitle(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-border rounded-xl bg-background outline-none focus:ring-2 focus:ring-primary focus:border-transparent font-medium"
                  />

                  {/* Quick batch naming shortcuts */}
                  {uploadQueue.length > 0 && eventBatchTitle.trim() && (
                    <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                      <button
                        type="button"
                        onClick={handleApplyBatchTitleToAll}
                        className="inline-flex items-center gap-1.5 text-[11px] px-2.5 py-1 bg-primary/10 hover:bg-primary/20 text-primary font-semibold rounded-lg transition-colors"
                      >
                        <Zap className="w-3 h-3 shrink-0" />
                        Apply "{eventBatchTitle.trim()}" to all ({uploadQueue.length}) photos (#1, #2...)
                      </button>
                      <button
                        type="button"
                        onClick={handleResetToFileNames}
                        className="inline-flex items-center gap-1 text-[11px] px-2.5 py-1 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground font-medium rounded-lg transition-colors"
                      >
                        Reset to original file names
                      </button>
                    </div>
                  )}
                </div>

                {/* Category & Event Date */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Category <span className="text-muted-foreground font-normal">(Optional)</span>
                    </label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm border border-border rounded-xl bg-background outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    >
                      <option value="Other">General / Other</option>
                      {CATEGORIES.filter((c) => c !== "All" && c !== "Other").map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-foreground mb-1">
                      Event Date
                    </label>
                    <input
                      type="date"
                      value={uploadDate}
                      onChange={(e) => setUploadDate(e.target.value)}
                      className="w-full px-3.5 py-2 text-xs sm:text-sm border border-border rounded-xl bg-background outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </div>

                {/* Default Description */}
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">
                    Event Description / Notes <span className="text-muted-foreground font-normal">(Optional fallback)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Short highlight about the activity, unit participation, or key moments..."
                    value={uploadDescription}
                    onChange={(e) => setUploadDescription(e.target.value)}
                    className="w-full px-3.5 py-2 text-xs sm:text-sm border border-border rounded-xl bg-background outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
                  />
                </div>

                {/* Visibility & Featured Switches */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                  <div className="p-3 bg-card rounded-xl border border-border flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Eye className="w-3.5 h-3.5 text-emerald-600" />
                        Show Publicly
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Visible on website gallery
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={uploadVisible}
                      onChange={(e) => setUploadVisible(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                    />
                  </div>

                  <div className="p-3 bg-card rounded-xl border border-border flex items-center justify-between">
                    <div>
                      <p className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                        <Star className="w-3.5 h-3.5 text-amber-500" />
                        Feature in Highlights
                      </p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        Pin to homepage showcase
                      </p>
                    </div>
                    <input
                      type="checkbox"
                      checked={uploadFeatured}
                      onChange={(e) => setUploadFeatured(e.target.checked)}
                      className="w-4 h-4 rounded text-primary focus:ring-primary cursor-pointer"
                    />
                  </div>
                </div>
              </div>

              {/* ── SECTION 2: PHOTOS SELECTION & DISTINCT CAPTIONS ─────────── */}
              <div className="space-y-3">
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFilesSelect}
                  className="hidden"
                />

                {/* Drag & Drop Area if no photos selected yet */}
                {uploadQueue.length === 0 ? (
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="border-2 border-dashed border-border hover:border-primary/60 bg-muted/20 hover:bg-muted/40 rounded-3xl p-8 text-center cursor-pointer transition-all space-y-3 group"
                  >
                    <div className="w-14 h-14 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                      <Upload className="w-7 h-7" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-foreground">
                        Click to browse or drop photos here
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                        You can select <strong>multiple photos at a time</strong>. JPG, PNG, WebP up to 15MB each.
                      </p>
                    </div>
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-card border border-border text-foreground text-xs font-semibold rounded-xl shadow-2xs">
                      <Plus className="w-3.5 h-3.5 text-primary" />
                      Select Multiple Photos
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Header bar for selected photos */}
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">
                          Selected Photos ({uploadQueue.length})
                        </span>
                        <span className="text-[11px] text-muted-foreground">
                          • {uploadQueue.filter((i) => i.status === "success").length} uploaded
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                          className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary rounded-xl transition-colors disabled:opacity-40"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          Add More Photos
                        </button>
                        <button
                          type="button"
                          onClick={resetUploadForm}
                          disabled={uploading}
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors disabled:opacity-40"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Clear All
                        </button>
                      </div>
                    </div>

                    {/* Scrollable list of selected photos with distinct captions */}
                    <div className="max-h-72 sm:max-h-80 overflow-y-auto space-y-2 pr-1 border border-border/70 rounded-2xl p-2 bg-muted/10">
                      {uploadQueue.map((item, idx) => (
                        <div
                          key={item.id}
                          className={`p-2.5 rounded-xl border flex items-center gap-3 transition-all ${
                            item.status === "success"
                              ? "bg-emerald-500/5 border-emerald-500/30"
                              : item.status === "error"
                              ? "bg-red-500/5 border-red-500/30"
                              : item.status === "uploading"
                              ? "bg-primary/5 border-primary/30"
                              : "bg-card border-border hover:border-border/80 shadow-2xs"
                          }`}
                        >
                          {/* Thumbnail */}
                          <div className="relative w-14 h-14 rounded-lg overflow-hidden border border-border/80 shrink-0 bg-muted">
                            <img
                              src={item.preview}
                              alt="Thumbnail"
                              className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-0 inset-x-0 bg-black/60 text-[9px] text-white text-center font-bold">
                              #{idx + 1}
                            </div>
                          </div>

                          {/* Editable Distinct Caption & Details */}
                          <div className="flex-1 min-w-0 space-y-1.5">
                            <div className="flex items-center justify-between gap-2">
                              <span className="text-[11px] font-semibold text-foreground truncate max-w-[200px]" title={item.file.name}>
                                {item.file.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground shrink-0 font-mono">
                                {(item.file.size / (1024 * 1024)).toFixed(1)} MB
                              </span>
                            </div>

                            <input
                              type="text"
                              disabled={uploading || item.status === "success"}
                              placeholder={`Title / Caption (e.g. ${eventBatchTitle || 'Photo caption'})...`}
                              value={item.title}
                              onChange={(e) => handleUpdateItemTitle(item.id, e.target.value)}
                              className="w-full px-2.5 py-1 text-xs border border-border rounded-lg bg-background outline-none focus:ring-1 focus:ring-primary font-medium"
                            />

                            <input
                              type="text"
                              disabled={uploading || item.status === "success"}
                              placeholder="Optional short subtitle or note..."
                              value={item.caption}
                              onChange={(e) => handleUpdateItemCaption(item.id, e.target.value)}
                              className="w-full px-2.5 py-0.5 text-[11px] border border-border/60 rounded-lg bg-background/50 outline-none text-muted-foreground focus:text-foreground"
                            />
                          </div>

                          {/* Status / Remove Action */}
                          <div className="shrink-0 flex items-center justify-center pl-1">
                            {item.status === "uploading" ? (
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                            ) : item.status === "success" ? (
                              <div className="text-emerald-600 flex items-center gap-1 text-[11px] font-bold">
                                <CheckCircle2 className="w-4 h-4" />
                              </div>
                            ) : item.status === "error" ? (
                              <div className="text-red-500" title={item.errorMessage || "Upload failed"}>
                                <AlertTriangle className="w-4 h-4" />
                              </div>
                            ) : (
                              <button
                                type="button"
                                onClick={() => handleRemoveQueueItem(item.id)}
                                disabled={uploading}
                                className="p-1.5 text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors"
                                title="Remove photo"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* ── FOOTER ACTIONS ─────────────────────────────────────────── */}
              <div className="pt-3 flex items-center justify-between gap-2 border-t border-border shrink-0">
                <button
                  type="button"
                  onClick={() => {
                    if (!uploading) {
                      resetUploadForm()
                      setShowUploadModal(false)
                    }
                  }}
                  disabled={uploading}
                  className="px-4 py-2 border border-border rounded-xl text-xs font-semibold hover:bg-muted disabled:opacity-40"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={uploading || uploadQueue.length === 0}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-primary text-primary-foreground font-bold rounded-xl hover:bg-primary/90 text-xs sm:text-sm shadow-md disabled:opacity-50 transition-all cursor-pointer"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Uploading ({uploadProgress.current}/{uploadProgress.total})...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      Upload {uploadQueue.length > 0 ? `${uploadQueue.length} Photo${uploadQueue.length !== 1 ? "s" : ""}` : "Photos"} to Gallery
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── EDIT MODAL ──────────────────────────────────────────────────────── */}
      {editingItem && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center z-50 p-3 sm:p-4">
          <div className="bg-card border border-border rounded-2xl max-w-md w-full shadow-2xl flex flex-col overflow-hidden max-h-[92vh]">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="font-bold text-sm sm:text-base text-foreground flex items-center gap-2">
                <Edit className="w-4 h-4 text-primary" />
                Edit Photo Details
              </h3>
              <button
                onClick={() => setEditingItem(null)}
                className="p-1 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="p-4 sm:p-5 space-y-3.5 overflow-y-auto">
              <div className="aspect-16/9 rounded-xl overflow-hidden border border-border bg-muted/30">
                <img
                  src={editingItem.imageUrl}
                  alt={editingItem.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Title</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs sm:text-sm border border-border rounded-xl bg-background outline-none focus:ring-2 focus:ring-primary"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Category</label>
                  <select
                    value={editCategory}
                    onChange={(e) => setEditCategory(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-border rounded-xl bg-background outline-none focus:ring-2 focus:ring-primary"
                  >
                    {CATEGORIES.filter((c) => c !== "All").map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-foreground mb-1">Event Date</label>
                  <input
                    type="date"
                    value={editDate}
                    onChange={(e) => setEditDate(e.target.value)}
                    className="w-full px-3 py-1.5 text-xs border border-border rounded-xl bg-background outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1">Description</label>
                <textarea
                  rows={2}
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs border border-border rounded-xl bg-background outline-none focus:ring-2 focus:ring-primary resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-muted/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editVisible}
                    onChange={(e) => setEditVisible(e.target.checked)}
                    className="w-4 h-4 rounded text-primary"
                  />
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Eye className="w-3 h-3 text-emerald-600" /> Show Publicly
                  </span>
                </label>

                <label className="flex items-center gap-2 p-2.5 rounded-xl border border-border bg-muted/30 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editFeatured}
                    onChange={(e) => setEditFeatured(e.target.checked)}
                    className="w-4 h-4 rounded text-primary"
                  />
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> Featured
                  </span>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-border">
                <button
                  type="button"
                  onClick={() => setEditingItem(null)}
                  className="px-3.5 py-1.5 border border-border rounded-xl text-xs hover:bg-muted"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingEdit}
                  className="px-4 py-1.5 bg-primary text-primary-foreground font-semibold rounded-xl text-xs hover:bg-primary/90 flex items-center gap-1"
                >
                  {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Save Changes"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── LIGHTBOX MODAL ──────────────────────────────────────────────────── */}
      {lightboxItem && (
        <div
          className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-60 p-3 sm:p-6"
          onClick={() => setLightboxItem(null)}
        >
          <div
            className="relative max-w-4xl w-full max-h-[92vh] flex flex-col bg-card border border-border rounded-2xl overflow-hidden shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-3.5 sm:p-4 border-b border-border bg-card">
              <div className="min-w-0 pr-3">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-primary/10 text-primary border border-primary/20">
                  {lightboxItem.category}
                </span>
                <h3 className="font-bold text-foreground text-sm sm:text-base truncate mt-1">
                  {lightboxItem.title}
                </h3>
              </div>
              <button
                onClick={() => setLightboxItem(null)}
                className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Large Image Preview */}
            <div className="p-2 sm:p-4 bg-black/40 flex items-center justify-center overflow-hidden flex-1 max-h-[65vh]">
              <img
                src={lightboxItem.imageUrl}
                alt={lightboxItem.title}
                className="max-h-[65vh] w-auto max-w-full object-contain mx-auto rounded-lg"
              />
            </div>

            {/* Footer with Caption & Action Links */}
            <div className="p-3.5 sm:p-4 border-t border-border bg-card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
              <div className="text-muted-foreground flex-1">
                {lightboxItem.description && <p className="text-foreground text-xs leading-relaxed mb-1">{lightboxItem.description}</p>}
                <span>
                  Captured on:{" "}
                  <strong>
                    {new Date(lightboxItem.eventDate || lightboxItem.createdAt).toLocaleDateString("en-IN", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </strong>
                </span>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <button
                  onClick={() => handleCopyLink(lightboxItem.imageUrl, lightboxItem._id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg hover:bg-muted text-xs font-medium"
                >
                  {copiedId === lightboxItem._id ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" /> Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" /> Copy URL
                    </>
                  )}
                </button>
                <a
                  href={lightboxItem.imageUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground font-semibold rounded-lg hover:bg-primary/90 text-xs shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Full Image
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

