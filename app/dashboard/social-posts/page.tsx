"use client"

import { useEffect, useState } from "react"
import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import {
  Share2,
  ArrowLeft,
  Loader2,
  CheckCircle,
  Star,
  Eye,
  Facebook,
  Instagram,
  Twitter,
  Linkedin,
  Youtube,
} from "lucide-react"

export default function SocialPostsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [socialPosts, setSocialPosts] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [viewingPost, setViewingPost] = useState<string | null>(null)
  const [totalPoints, setTotalPoints] = useState(0)

  useEffect(() => {
    if (status === "loading") return
    const user = session?.user as any
    if (!user) {
      router.replace("/login")
      return
    }
    fetchPosts()
  }, [session, status, router])

  const fetchPosts = async () => {
    try {
      setLoading(true)
      const res = await fetch("/api/volunteer/social-posts")
      const data = await res.json()
      if (data.success) {
        setSocialPosts(data.posts || [])
        setTotalPoints(data.totalPoints || 0)
      }
    } catch (error) {
      console.error("Error fetching posts:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading || status === "loading") {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="animate-spin w-8 h-8 text-primary" />
      </div>
    )
  }

  const platformIcons: any = {
    facebook: Facebook,
    instagram: Instagram,
    twitter: Twitter,
    linkedin: Linkedin,
    youtube: Youtube,
  }
  const platformColors: any = {
    facebook: "bg-blue-600 hover:bg-blue-700",
    instagram: "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600",
    twitter: "bg-black hover:bg-gray-900",
    linkedin: "bg-blue-700 hover:bg-blue-800",
    youtube: "bg-red-600 hover:bg-red-700",
  }
  const platformLabels: any = {
    facebook: "Facebook",
    instagram: "Instagram",
    twitter: "Twitter",
    linkedin: "LinkedIn",
    youtube: "YouTube",
  }

  return (
    <div className="p-4 md:p-6 max-w-7xl mx-auto space-y-6">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Link>

      <div>
        <h1 className="text-3xl font-bold text-foreground flex items-center">
          <Share2 className="w-8 h-8 mr-3 text-primary" />
          Social Media Posts
        </h1>
        <p className="text-muted-foreground mt-2">Engage with NSS posts and earn points</p>
      </div>

      {socialPosts.length === 0 ? (
        <div className="bg-card rounded-xl border border-border p-12 text-center">
          <Share2 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">No Posts Available</h3>
          <p className="text-muted-foreground">There are no social media posts at the moment.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {socialPosts.map((post) => {
            const platformLinks = post.platformLinks || {}
            const mainPlatforms = ["facebook", "instagram", "twitter", "linkedin"]
            const availableMainPlatforms = mainPlatforms.filter((p) => platformLinks[p])
            const likedPlatforms = post.likedPlatforms || []
            const allMainPlatformsLiked = availableMainPlatforms.every((p) => likedPlatforms.includes(p))

            return (
              <div
                key={post._id}
                className={`group relative border rounded-xl overflow-hidden transition-all duration-300 ${
                  allMainPlatformsLiked && availableMainPlatforms.length > 0
                    ? "border-green-500/50 bg-green-50/30 dark:bg-green-950/10 shadow-md"
                    : likedPlatforms.length > 0
                      ? "border-yellow-500/50 bg-yellow-50/30 dark:bg-yellow-950/10 shadow-sm"
                      : "border-primary/50 bg-gradient-to-r from-primary/5 to-secondary/5 shadow-sm hover:shadow-md"
                }`}
              >
                {/* Status Badge */}
                {allMainPlatformsLiked && availableMainPlatforms.length > 0 ? (
                  <div className="absolute top-3 right-3 z-10">
                    <div className="flex items-center gap-1 px-2 py-1 bg-green-500 text-white rounded-full text-xs font-medium shadow-md">
                      <CheckCircle className="w-3 h-3" />
                      Complete
                    </div>
                  </div>
                ) : likedPlatforms.length > 0 ? (
                  <div className="absolute top-3 right-3 z-10">
                    <div className="flex items-center gap-1 px-2 py-1 bg-yellow-500 text-white rounded-full text-xs font-medium shadow-md">
                      <Star className="w-3 h-3" />
                      {likedPlatforms.length}/{availableMainPlatforms.length}
                    </div>
                  </div>
                ) : (
                  <div className="absolute top-3 right-3 z-10">
                    <div className="flex items-center gap-1 px-2 py-1 bg-orange-500 text-white rounded-full text-xs font-medium animate-pulse shadow-md">
                      <Eye className="w-3 h-3" />
                      New
                    </div>
                  </div>
                )}

                {/* Post Content */}
                <div className="p-4">
                  <div className="mb-3">
                    <h3 className="font-semibold text-foreground mb-1">{post.title}</h3>
                    {post.description && (
                      <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{post.description}</p>
                    )}
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500" />
                        +2 points per platform • +10 points total when all completed
                      </span>
                    </div>
                  </div>

                  {/* Platform Buttons */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    {availableMainPlatforms.map((platform) => {
                      const PlatformIcon = platformIcons[platform] || Share2
                      const isLiked = likedPlatforms.includes(platform)
                      const isProcessing = viewingPost === `${post._id}-${platform}`

                      return (
                        <button
                          key={platform}
                          onClick={async (e) => {
                            e.preventDefault()
                            if (!isProcessing) {
                              setViewingPost(`${post._id}-${platform}`)
                              
                              try {
                                // Record click and auto-like (award points only if not already liked)
                                const res = await fetch("/api/volunteer/social-posts", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({ postId: post._id, platform, action: "like" }),
                                })
                                const data = await res.json()
                                if (data.success) {
                                  // Open the platform link
                                  window.open(platformLinks[platform], "_blank")
                                  
                                  // Update local state
                                  if (!isLiked && data.pointsEarned > 0) {
                                    setSocialPosts((prev) =>
                                      prev.map((p) =>
                                        p._id === post._id
                                          ? {
                                              ...p,
                                              clickedPlatforms: [...(p.clickedPlatforms || []), platform],
                                              likedPlatforms: [...(p.likedPlatforms || []), platform],
                                            }
                                          : p
                                      )
                                    )
                                    setTotalPoints(data.totalPoints)
                                    
                                    if (data.pointsAwarded) {
                                      alert(`🎉 Congratulations! You earned ${data.pointsEarned} points for completing all platforms! Total: ${data.totalPoints}`)
                                    } else {
                                      const remaining = availableMainPlatforms.length - (likedPlatforms.length + 1)
                                      if (remaining > 0) {
                                        alert(`✅ Great! You earned 2 points for ${platformLabels[platform]}. ${remaining} more platform${remaining > 1 ? 's' : ''} to go!`)
                                      } else {
                                        alert(`✅ Great! You earned 2 points for ${platformLabels[platform]}!`)
                                      }
                                    }
                                    await fetchPosts()
                                  }
                                }
                              } catch (error) {
                                console.error("Error recording platform like:", error)
                              } finally {
                                setViewingPost(null)
                              }
                            }
                          }}
                          disabled={isProcessing}
                          className={`flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-white font-medium text-sm transition-all ${
                            isLiked
                              ? `${platformColors[platform]} opacity-75 cursor-pointer`
                              : `${platformColors[platform]} hover:shadow-md active:scale-95`
                          } ${isProcessing ? "opacity-50" : ""}`}
                        >
                          {isProcessing ? (
                            <>
                              <Loader2 className="w-4 h-4 animate-spin" />
                              Processing...
                            </>
                          ) : (
                            <>
                              <PlatformIcon className="w-4 h-4" />
                              <span>{platformLabels[platform]}</span>
                              {isLiked && <CheckCircle className="w-4 h-4 ml-1" />}
                            </>
                          )}
                        </button>
                      )
                    })}
                  </div>

                  {/* Progress */}
                  {likedPlatforms.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="font-semibold text-foreground">
                          {likedPlatforms.length}/{availableMainPlatforms.length} platforms • {likedPlatforms.length * 2} points earned
                        </span>
                      </div>
                      <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-primary to-secondary h-2.5 rounded-full transition-all duration-500 flex items-center justify-end pr-1"
                          style={{ width: `${(likedPlatforms.length / availableMainPlatforms.length) * 100}%` }}
                        >
                          {allMainPlatformsLiked && (
                            <CheckCircle className="w-3 h-3 text-white" />
                          )}
                        </div>
                      </div>
                      {allMainPlatformsLiked && (
                        <div className="mt-2 p-2 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 border border-green-200 dark:border-green-800 rounded-lg">
                          <p className="text-xs text-green-700 dark:text-green-400 font-medium text-center flex items-center justify-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            All platforms completed! +10 points awarded
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

