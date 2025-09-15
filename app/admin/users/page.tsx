import AdminHeader from "@/components/admin/AdminHeader"
import UserManagement from "@/components/admin/UserManagement"

export default function UsersPage() {
  return (
    <>
      <AdminHeader title="User Management" subtitle="Manage admin users and permissions" />

      <div className="p-6">
        <UserManagement />
      </div>
    </>
  )
}
