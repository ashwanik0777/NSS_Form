// Define all available permissions
export const PERMISSIONS = {
  // Application Management
  "applications.view": "View applications",
  "applications.review": "Review and approve/reject applications",
  "applications.edit": "Edit application details",
  "applications.delete": "Delete applications",
  "applications.export": "Export application data",

  // User Management
  "users.view": "View users",
  "users.create": "Create new users",
  "users.edit": "Edit user details",
  "users.delete": "Delete users",
  "users.permissions": "Manage user permissions",

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
  reports: "Reports & Analytics",
  settings: "System Settings",
  system: "System Administration",
} as const

// Default permission sets for different roles
export const DEFAULT_PERMISSIONS = {
  admin: Object.keys(PERMISSIONS) as PermissionKey[],
  "sub-admin": [
    "applications.view",
    "applications.review",
    "applications.export",
    "users.view",
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
