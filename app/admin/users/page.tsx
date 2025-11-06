import AdminHeader from "@/components/admin/AdminHeader"
import UserManagement from "@/components/admin/UserManagement"
import ProtectedRoute from "@/components/auth/ProtectedRoute"

export default function UsersPage() {
  return (
    <ProtectedRoute requiredRole="sub-admin" requiredPermission="users.view">
      <AdminHeader title="User Management" subtitle="Manage admin users and permissions" />

      <div className="p-6">
        <UserManagement />
      </div>
    </ProtectedRoute>
  )
}
