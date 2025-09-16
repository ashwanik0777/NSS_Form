"use client"

import { useState } from "react"
import AdminHeader from "@/components/admin/AdminHeader"
import { Calendar, Plus, MapPin, Users, Clock } from "lucide-react"

interface Event {
  id: string
  title: string
  description: string
  date: string
  time: string
  location: string
  participants: number
  maxParticipants: number
  status: "upcoming" | "ongoing" | "completed" | "cancelled"
}

export default function EventsPage() {
  const [events] = useState<Event[]>([
    {
      id: "1",
      title: "Community Cleanliness Drive",
      description: "Join us for a community-wide cleanliness initiative in the local park area.",
      date: "2024-01-15",
      time: "09:00",
      location: "Central Park, Lucknow",
      participants: 45,
      maxParticipants: 100,
      status: "upcoming",
    },
    {
      id: "2",
      title: "Blood Donation Camp",
      description: "Annual blood donation camp in collaboration with local hospitals.",
      date: "2024-01-20",
      time: "10:00",
      location: "Medical College, Lucknow",
      participants: 78,
      maxParticipants: 150,
      status: "upcoming",
    },
    {
      id: "3",
      title: "Tree Plantation Drive",
      description: "Environmental conservation activity - planting trees in rural areas.",
      date: "2024-01-10",
      time: "08:00",
      location: "Village Mohanlalganj",
      participants: 120,
      maxParticipants: 120,
      status: "completed",
    },
  ])

  const [showCreateModal, setShowCreateModal] = useState(false)

  const getStatusBadge = (status: string) => {
    const statusStyles = {
      upcoming: "bg-blue-100 text-blue-800 border-blue-200",
      ongoing: "bg-green-100 text-green-800 border-green-200",
      completed: "bg-gray-100 text-gray-800 border-gray-200",
      cancelled: "bg-red-100 text-red-800 border-red-200",
    }

    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded-full border ${statusStyles[status as keyof typeof statusStyles]}`}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    )
  }

  return (
    <>
      <AdminHeader title="Events" subtitle="Manage NSS events and activities" />

      <div className="p-6">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-blue-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Events</p>
                <p className="text-2xl font-bold text-foreground">{events.length}</p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center">
              <Clock className="w-8 h-8 text-green-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Upcoming</p>
                <p className="text-2xl font-bold text-foreground">
                  {events.filter((e) => e.status === "upcoming").length}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center">
              <Users className="w-8 h-8 text-orange-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Total Participants</p>
                <p className="text-2xl font-bold text-foreground">
                  {events.reduce((sum, e) => sum + e.participants, 0)}
                </p>
              </div>
            </div>
          </div>
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-purple-500" />
              <div className="ml-4">
                <p className="text-sm font-medium text-muted-foreground">Completed</p>
                <p className="text-2xl font-bold text-foreground">
                  {events.filter((e) => e.status === "completed").length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Header Actions */}
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-xl font-semibold text-foreground">All Events</h2>
            <p className="text-muted-foreground">Manage and organize NSS events</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </button>
        </div>

        {/* Events Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {events.map((event) => (
            <div
              key={event.id}
              className="bg-card rounded-lg border border-border p-6 hover:shadow-lg transition-shadow"
            >
              <div className="flex justify-between items-start mb-4">
                <h3 className="text-lg font-semibold text-foreground">{event.title}</h3>
                {getStatusBadge(event.status)}
              </div>

              <p className="text-muted-foreground text-sm mb-4 line-clamp-2">{event.description}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4 mr-2" />
                  {new Date(event.date).toLocaleDateString("en-IN")} at {event.time}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <MapPin className="w-4 h-4 mr-2" />
                  {event.location}
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <Users className="w-4 h-4 mr-2" />
                  {event.participants}/{event.maxParticipants} participants
                </div>
              </div>

              <div className="w-full bg-muted rounded-full h-2 mb-4">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(event.participants / event.maxParticipants) * 100}%` }}
                ></div>
              </div>

              <div className="flex space-x-2">
                <button className="flex-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors">
                  View Details
                </button>
                <button className="px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors">
                  Edit
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Create Event Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-border">
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-foreground">Create New Event</h3>
                  <button
                    onClick={() => setShowCreateModal(false)}
                    className="p-2 hover:bg-muted rounded-lg transition-colors"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6">
                <form className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Event Title</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter event title"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Description</label>
                    <textarea
                      rows={3}
                      className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter event description"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Date</label>
                      <input
                        type="date"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Time</label>
                      <input
                        type="time"
                        className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Location</label>
                    <input
                      type="text"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter event location"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Max Participants</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-border rounded-lg bg-input text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                      placeholder="Enter maximum participants"
                    />
                  </div>

                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowCreateModal(false)}
                      className="px-4 py-2 text-sm font-medium text-foreground border border-border rounded-lg hover:bg-muted transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                    >
                      Create Event
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  )
}
