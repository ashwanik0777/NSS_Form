"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import AdminHeader from "@/components/admin/AdminHeader"
import ProtectedRoute from "@/components/auth/ProtectedRoute"
import {
  Share2,
  Plus,
  Edit,
  Trash2,
  Eye,
  Users,
  Loader2,
  X,
  Save,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
  TrendingUp,
  Award,
} from "lucide-react"

export default function SocialPostsPage() {
  const { data: session } = useSession()
  const [posts, setPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [editingPost, setEditingPost] = useState<any>(null)
  const [showStats, setShowStats] = useState(false)
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    platformLinks: {
      facebook: "",
      instagram: "",
      twitter: "",
      linkedin: "",
      youtube: "",
    },
    pointsReward: 2.5,
    isActive: true,
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchPosts()
  }, [])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/admin/social-posts?stats=true")
      const data = await res.json()
      if (data.success) {
        setPosts(data.posts || [])
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
      setError("Failed to fetch posts")
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError(null)

    try {
      if (!formData.title) {
        setError("Title is required")
        setSubmitting(false)
        return
      }

      // Check if at least one platform link is provided
      const hasLink = Object.values(formData.platformLinks).some((link) => link.trim() !== "")
      if (!hasLink) {
        setError("At least one platform link is required")
        setSubmitting(false)
        return
      }

      let response
      if (editingPost) {
        response = await fetch("/api/admin/social-posts", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ postId: editingPost._id, ...formData }),
        })
      } else {
        response = await fetch("/api/admin/social-posts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        })
      }

      const data = await response.json()

      if (!data.success) {
        setError(data.message || "Failed to save post")
        setSubmitting(false)
        return
      }

      setShowModal(false)
      setEditingPost(null)
      setFormData({
        title: "",
        description: "",
        platformLinks: {
          facebook: "",
          instagram: "",
          twitter: "",
          linkedin: "",
          youtube: "",
        },
        pointsReward: 2.5,
        isActive: true,
      })
      await fetchPosts()
      setSubmitting(false)
    } catch (error) {
      console.error("Error saving post:", error)
      setError("Failed to save post")
      setSubmitting(false)
    }
  }

  const handleEdit = (post: any) => {
    setEditingPost(post)
    setFormData({
      title: post.title || "",
      description: post.description || "",
      platformLinks: post.platformLinks || {
        facebook: "",
        instagram: "",
        twitter: "",
        linkedin: "",
        youtube: "",
      },
      pointsReward: post.pointsReward || 10,
      isActive: post.isActive !== undefined ? post.isActive : true,
    })
    setShowModal(true)
  }

  const handleDelete = async (postId: string) => {
    if (!confirm("Are you sure you want to delete this post? This action cannot be undone.")) {
      return
    }

    try {
      const response = await fetch(`/api/admin/social-posts?postId=${postId}`, {
        method: "DELETE",
      })

      const data = await response.json()

      if (!data.success) {
        alert(data.message || "Failed to delete post")
        return
      }

      await fetchPosts()
    } catch (error) {
      console.error("Error deleting post:", error)
      alert("Failed to delete post")
    }
  }

  const platformIcons: any = {
    facebook: Facebook,
    instagram: Instagram,
    twitter: Twitter,
    linkedin: Linkedin,
    youtube: Youtube,
  }

  const platformColors: any = {
    facebook: "bg-blue-600",
    instagram: "bg-gradient-to-r from-purple-500 to-pink-500",
    twitter: "bg-black",
    linkedin: "bg-blue-700",
    youtube: "bg-red-600",
  }

  if (loading) {
    return (
      <ProtectedRoute requiredRole="sub-admin">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin w-8 h-8 text-primary" />
        </div>
      </ProtectedRoute>
    )
  }

  return (
    <ProtectedRoute requiredRole="sub-admin">
      <AdminHeader title="Social Media Posts" subtitle="Manage NSS social media posts for volunteers" />

      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowStats(!showStats)}
              className="flex items-center gap-2 px-4 py-2 bg-muted hover:bg-muted/80 rounded-lg transition-colors"
            >
              <TrendingUp className="w-4 h-4" />
              {showStats ? "Hide Stats" : "Show Stats"}
            </button>
          </div>
          <button
            onClick={() => {
              setEditingPost(null)
              setFormData({
                title: "",
                description: "",
                platformLinks: {
                  facebook: "",
                  instagram: "",
                  twitter: "",
                  linkedin: "",
                  youtube: "",
                },
                pointsReward: 2.5,
                isActive: true,
              })
              setError(null)
              setShowModal(true)
            }}
            className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5 mr-2" />
            Add Post
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">{error}</div>
        )}

        {posts.length === 0 ? (
          <div className="bg-card rounded-xl border border-border p-12 text-center">
            <Share2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No Posts</h3>
            <p className="text-muted-foreground">Start by creating your first social media post</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => {
              const platformLinks = post.platformLinks || {}
              const availablePlatforms = Object.keys(platformLinks).filter((key) => platformLinks[key])
              return (
                <div
                  key={post._id}
                  className="bg-card rounded-xl border border-border p-6 hover:shadow-lg transition-all duration-300"
                >
                  {/* Platform Badges */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      {availablePlatforms.map((platform) => {
                        const PlatformIcon = platformIcons[platform] || Share2
                        return (
                          <div
                            key={platform}
                            className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs ${platformColors[platform] || "bg-primary"} text-white`}
                          >
                            <PlatformIcon className="w-3 h-3" />
                            <span className="capitalize">{platform}</span>
                          </div>
                        )
                      })}
                    </div>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        post.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {post.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>

                  {/* Post Content */}
                  <div className="mb-4">
                    <h3 className="font-semibold text-foreground mb-2 line-clamp-2">{post.title}</h3>
                    {post.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{post.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Award className="w-3 h-3 text-yellow-500" />
                      <span>{post.pointsReward} points reward</span>
                    </div>
                  </div>

                  {/* Stats */}
                  {showStats && (
                    <div className="mb-4 p-3 bg-muted/50 rounded-lg border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-sm">
                          <Eye className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Views</span>
                        </div>
                        <span className="font-semibold text-foreground">{post.viewCount || 0}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-muted-foreground" />
                          <span className="text-muted-foreground">Total Volunteers</span>
                        </div>
                        <span className="font-semibold text-foreground">{post.totalVolunteers || 0}</span>
                      </div>
                      {post.totalVolunteers > 0 && (
                        <div className="mt-2">
                          <div className="flex items-center justify-between text-xs mb-1">
                            <span className="text-muted-foreground">Engagement</span>
                            <span className="font-semibold text-primary">{post.viewPercentage || 0}%</span>
                          </div>
                          <div className="w-full bg-muted rounded-full h-2">
                            <div
                              className="bg-primary h-2 rounded-full transition-all"
                              style={{ width: `${post.viewPercentage || 0}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-4 border-t border-border">
                    <button
                      onClick={() => handleEdit(post)}
                      className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(post._id)}
                      className="flex items-center justify-center gap-2 px-3 py-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Add/Edit Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
            <div className="bg-card rounded-xl border border-border max-w-2xl w-full my-8 flex flex-col max-h-[90vh]">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-border sticky top-0 bg-card rounded-t-xl z-10">
                <h2 className="text-2xl font-bold text-foreground">
                  {editingPost ? "Edit Post" : "Add New Post"}
                </h2>
                <button
                  onClick={() => {
                    setShowModal(false)
                    setEditingPost(null)
                    setError(null)
                  }}
                  className="p-2 hover:bg-muted rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="overflow-y-auto flex-1 p-6">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
                    {error}
                  </div>
                )}

                <form id="post-form" onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter post title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="Enter post description"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Platform Links <span className="text-red-500">*</span>
                      <span className="text-xs text-muted-foreground ml-2">(At least one required)</span>
                    </label>
                    <div className="space-y-3">
                      <div>
                        <label className="flex items-center gap-2 mb-1 text-sm text-foreground">
                          <Facebook className="w-4 h-4 text-blue-600" />
                          Facebook
                        </label>
                        <input
                          type="url"
                          value={formData.platformLinks.facebook}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              platformLinks: { ...formData.platformLinks, facebook: e.target.value },
                            })
                          }
                          className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="https://facebook.com/..."
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 mb-1 text-sm text-foreground">
                          <Instagram className="w-4 h-4 text-pink-600" />
                          Instagram
                        </label>
                        <input
                          type="url"
                          value={formData.platformLinks.instagram}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              platformLinks: { ...formData.platformLinks, instagram: e.target.value },
                            })
                          }
                          className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="https://instagram.com/..."
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 mb-1 text-sm text-foreground">
                          <Twitter className="w-4 h-4 text-black" />
                          Twitter
                        </label>
                        <input
                          type="url"
                          value={formData.platformLinks.twitter}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              platformLinks: { ...formData.platformLinks, twitter: e.target.value },
                            })
                          }
                          className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="https://twitter.com/..."
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 mb-1 text-sm text-foreground">
                          <Linkedin className="w-4 h-4 text-blue-700" />
                          LinkedIn
                        </label>
                        <input
                          type="url"
                          value={formData.platformLinks.linkedin}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              platformLinks: { ...formData.platformLinks, linkedin: e.target.value },
                            })
                          }
                          className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="https://linkedin.com/..."
                        />
                      </div>
                      <div>
                        <label className="flex items-center gap-2 mb-1 text-sm text-foreground">
                          <Youtube className="w-4 h-4 text-red-600" />
                          YouTube <span className="text-xs text-muted-foreground">(Optional)</span>
                        </label>
                        <input
                          type="url"
                          value={formData.platformLinks.youtube}
                          onChange={(e) =>
                            setFormData({
                              ...formData,
                              platformLinks: { ...formData.platformLinks, youtube: e.target.value },
                            })
                          }
                          className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                          placeholder="https://youtube.com/..."
                        />
                      </div>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Points Reward (per platform click)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.1"
                      value={formData.pointsReward}
                      onChange={(e) =>
                        setFormData({ ...formData, pointsReward: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-4 py-2 border border-border rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                      placeholder="2.5"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Each platform click awards {formData.pointsReward} points (Total: {formData.pointsReward * 4} points for all 4 platforms)
                    </p>
                  </div>

                  <div>
                    <label className="flex items-center gap-2">
                      <input
                        type="checkbox"
                        checked={formData.isActive}
                        onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        className="w-4 h-4 text-primary rounded border-border focus:ring-2 focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-foreground">Active</span>
                    </label>
                  </div>
                </form>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-end gap-3 p-6 border-t border-border sticky bottom-0 bg-card rounded-b-xl">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false)
                    setEditingPost(null)
                    setError(null)
                  }}
                  className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  form="post-form"
                  disabled={submitting}
                  className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2 disabled:opacity-50"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {editingPost ? "Update Post" : "Create Post"}
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </ProtectedRoute>
  )
}

