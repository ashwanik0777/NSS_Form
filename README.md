# 🌟 NSS Registration System

A comprehensive **National Service Scheme (NSS)** volunteer registration and management system built using **Next.js 15**, **MongoDB**, and modern web technologies.

---

## ✨ Features

### 👤 For Applicants
- 🧩 **Multi-step Registration Form** — Intuitive 4-step form with real-time validation
- 🌐 **Bilingual Support** — English & Hindi interface
- 👁️‍🗨️ **Form Preview** — Review all details before final submission
- 📧 **Email Notifications** — Automatic status updates via email
- 📁 **Document Upload** — Upload necessary supporting documents securely

### 🛠️ For Administrators
- 📊 **Admin Dashboard** — Complete management interface with analytics
- 🔎 **Application Review** — Approve/reject forms with dynamic reasoning
- 👥 **User Management** — Create/manage Sub-admins with granular permissions
- 📬 **Email System** — Automated email templates for all status changes
- 📈 **Reports & Analytics** — Real-time statistics and performance tracking
- 🔐 **Role-based Access** — Secure permission-based routing and API control

---

## 🧱 Technology Stack

| Layer         | Tech Used                            |
|--------------|----------------------------------------|
| **Frontend**  | Next.js 15, React 19, TypeScript       |
| **Styling**   | Tailwind CSS v4, Custom Design System  |
| **Backend**   | Next.js API Routes, MongoDB, Mongoose  |
| **Auth**      | NextAuth.js with JWT, RBAC             |
| **Forms**     | React Hook Form + Zod Validation       |
| **Email**     | Nodemailer with HTML Templates         |
| **UI**        | Radix UI Primitives                    |

---

## 🚀 Getting Started

### ✅ Prerequisites
- **Node.js** v18 or later
- **MongoDB** (Atlas or local)
- **SMTP** Email service (e.g. Gmail, SendGrid)

### 🔧 Installation

1. **Clone the repository**
```bash
git clone https://github.com/your-username/nss-registration-system.git
cd nss-registration-system
```


---

## 📋 Key Features Explained

### 🧾 Multi-step Form

The registration process is divided into:

- 🏫 Institution Details
- 👤 Personal Information
- 🎓 Educational Background
- ✅ Review & Declaration

Includes input validation, field masking (e.g., phone numbers), and real-time previews.

### 🔐 Permission System

| Role       | Access Level                      |
|------------|----------------------------------|
| Admin      | Full access to all features       |
| Sub-admin  | Limited access (assignable)       |
| User       | Form submission & tracking only   |

Permissions are enforced both in the UI and the backend via middleware.

### 📬 Email Notifications

Users receive updates at each stage:
- ✔️ Application submission confirmation
- 🟢 Approval (with certificate or download link)
- 🔴 Rejection (with reason and retry instructions)

Admins can test emails via the dashboard interface.

### 📊 Admin Dashboard

Modern dashboard includes:
- 📈 Application stats (pending, approved, rejected)
- 🔍 Review interface with approve/reject actions
- 📋 Sub-admin management (create, assign, remove)
- ⚙️ Form layout editor (dynamic field configuration)
- 🧪 Test email templates

---

### ⚙️ Deployment

To build for production:

You can deploy this app on platforms like **Vercel**, **Render**, or **DigitalOcean App Platform**.

---

### 🤝 Contributing

Want to help improve this system?
- Fork this repository
- Create a new feature branch
- Commit your changes
- Submit a Pull Request

We welcome contributions of all sizes.

---

### 📄 License

This project is licensed under the MIT License.

---

### 📞 Support

Need help or want to report an issue?
- 💬 Open an issue on GitHub
- 📧 Contact the dev team
- 📝 Refer to the documentation folder

Developed for the National Service Scheme (NSS), Uttar Pradesh 🇮🇳

---

<!-- YAML block for advanced documentation systems -->
