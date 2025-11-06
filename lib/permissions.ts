// Define all available permissions
export const PERMISSIONS = {
  // Application Management
  "applications.view": "View applications",
  "applications.review": "Review and approve/reject applications",
  "applications.edit": "Edit application details",
  "applications.delete": "Delete applications",
  "applications.export": "Export application data",
  "applications.stats": "View application statistics and filters",

  // User Management
  "users.view": "View users",
  "users.create": "Create new users (sub-admin)",
  "users.edit": "Edit user details",
  "users.delete": "Delete users",
  "users.permissions": "Manage user permissions",

  // Project Management
  "projects.view": "View projects",
  "projects.create": "Create new projects",
  "projects.edit": "Edit project details",
  "projects.delete": "Delete projects",
  "projects.assign": "Assign volunteers to projects",

  // Event Management
  "events.view": "View events",
  "events.create": "Create new events",
  "events.edit": "Edit event details",
  "events.delete": "Delete events",
  "events.manage": "Manage event attendance and hours",

  // Announcement Management
  "announcements.view": "View announcements",
  "announcements.create": "Create new announcements",
  "announcements.edit": "Edit announcement details",
  "announcements.delete": "Delete announcements",

  // Volunteer Management
  "volunteers.view": "View volunteers",
  "volunteers.edit": "Edit volunteer details",
  "volunteers.approve": "Approve volunteer applications",
  "volunteers.reject": "Reject volunteer applications",
  "volunteers.idcard": "Generate volunteer ID cards",

  // Email System
  "email.view": "View email logs and templates",
  "email.send": "Send emails to volunteers",
  "email.templates": "Manage email templates",
  "email.test": "Test email functionality",

  // Social Media Management
  "social.view": "View social media links",
  "social.edit": "Edit NSS social media links",

  // Reports
  "reports.view": "View reports",
  "reports.generate": "Generate reports",
  "reports.export": "Export reports",

  // Settings
  "settings.view": "View system settings",
  "settings.edit": "Edit system settings",

  // System Administration
  "system.admin": "Full system administration access",
  "system.logs": "View system logs",
  "system.backup": "Manage system backups",
} as const

export type PermissionKey = keyof typeof PERMISSIONS

// Permission categories for organization
export const PERMISSION_CATEGORIES = {
  applications: "Application Management",
  users: "User Management",
  projects: "Project Management",
  events: "Event Management",
  announcements: "Announcement Management",
  volunteers: "Volunteer Management",
  email: "Email System",
  social: "Social Media Management",
  reports: "Reports & Analytics",
  settings: "System Settings",
  system: "System Administration",
} as const

// Default permission sets for different roles
export const DEFAULT_PERMISSIONS = {
  admin: Object.keys(PERMISSIONS) as PermissionKey[],
  "sub-admin": [
    // Application Management
    "applications.view",
    "applications.review",
    "applications.stats",
    "applications.export",
    // User Management
    "users.view",
    // Project Management
    "projects.view",
    // Event Management
    "events.view",
    // Announcement Management
    "announcements.view",
    // Volunteer Management
    "volunteers.view",
    // Email System
    "email.view",
    // Social Media Management
    "social.view",
    // Reports
    "reports.view",
    "reports.generate",
  ] as PermissionKey[],
  user: [] as PermissionKey[],
}

// Helper function to check if user has permission
export function hasPermission(userPermissions: string[], requiredPermission: PermissionKey): boolean {
  return userPermissions.includes(requiredPermission) || userPermissions.includes("system.admin")
}

// Helper function to get permissions by category
export function getPermissionsByCategory() {
  const categorized: Record<string, Array<{ key: PermissionKey; description: string }>> = {}

  Object.entries(PERMISSIONS).forEach(([key, description]) => {
    const category = key.split(".")[0]
    if (!categorized[category]) {
      categorized[category] = []
    }
    categorized[category].push({ key: key as PermissionKey, description })
  })

  return categorized
}
