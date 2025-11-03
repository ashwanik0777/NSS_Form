# 🌟 NSS Registration System

A comprehensive **National Service Scheme (NSS)** volunteer registration and management system built with **Next.js 15**, **MongoDB**, and modern web technologies.

---

## 📚 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Getting Started](#-getting-started)
- [App Usage Guide](#-app-usage-guide)
  - [Volunteer Flow](#volunteer-flow)
  - [Admin Flow](#admin-flow)
- [Flow Diagrams](#-flow-diagrams)
  - [Volunteer Dashboard Flow](#volunteer-dashboard-flow)
  - [Admin Dashboard Flow](#admin-dashboard-flow)
- [Permission System](#-permission-system)
- [Deployment](#️-deployment)
- [Contributing](#-contributing)
- [License](#-license)
- [Support](#-support)

---

## ✨ Features

### 👤 For Applicants (Volunteers)
- Multi-step Registration Form (4 steps, real-time validation)
- Bilingual Support (English & Hindi)
- Form Preview before submission
- Email Notifications for every status update
- Secure Document Upload
- Set password and complete profile after approval
- Project selection and ID card generation
- Event participation with location-based photo check-in/out
- Automatic working hours calculation

### 🛠️ For Administrators
- Admin Dashboard with analytics
- Application Review (approve/reject with reason)
- User Management (Admins/Sub-admins/Volunteers)
- Project Management (create, assign, monitor)
- Volunteer Management (track progress, hours, events)
- Event Management (create, assign, monitor attendance)
- Announcements (send to all or selected users)
- Automated Email System
- Reports & Real-time Analytics
- Role-based Access Control

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

2. **Install dependencies**
    ```bash
    npm install
    ```

3. **Configure Environment Variables**

    Create a `.env.local` file in the root directory and add:
    ```
    MONGODB_URI=your_mongodb_connection_string
    NEXTAUTH_SECRET=your_nextauth_secret
    EMAIL_SERVER_USER=your_email@example.com
    EMAIL_SERVER_PASSWORD=your_email_password
    EMAIL_SERVER_HOST=smtp.example.com
    EMAIL_SERVER_PORT=587
    ```

4. **Run the development server**
    ```bash
    npm run dev
    ```

5. **Open the app**
    - Visit [http://localhost:3000](http://localhost:3000) in your browser.

---

## 🧑‍💻 App Usage Guide

### Volunteer Flow

1. **Go to Registration Page**
2. **Select Language** (English/Hindi)
3. **Fill Multi-step Form**
    - Step 1: Institution Details
    - Step 2: Personal Information
    - Step 3: Educational Background
    - Step 4: Review & Declaration
4. **Upload Required Documents**
5. **Preview All Details**
6. **Submit Application**
7. **Check Email for Confirmation**
8. **Wait for Admin Approval**
9. **After Approval:**
    - Set your password (first login)
    - Complete your profile (add missing details)
    - Select your project from available options
    - Download your digital ID card
10. **Participate in Events:**
    - Join events assigned to your project
    - At event start: Upload location-based selfie (check-in)
    - At event end: Upload location-based selfie (check-out)
    - Working hours are automatically added to your profile based on event participation
11. **Track your progress and working hours in your dashboard**
12. **Receive announcements and notifications from admin**

### Admin Flow

1. **Login as Admin**
2. **Access Admin Dashboard**
3. **User Management**
    - View, add, edit, or remove admins, sub-admins, and volunteers
    - Assign roles and permissions
4. **Project Management**
    - Create new projects
    - Assign volunteers to projects
    - Monitor project progress and volunteer participation
5. **Volunteer Management**
    - Track volunteer registrations, approvals, and working hours
    - View volunteer profiles and event participation
6. **Event Management**
    - Create and schedule events for projects
    - Assign volunteers to events
    - Monitor attendance and working hours (via photo check-in/out)
7. **Announcements**
    - Send announcements to all users or selected groups
8. **Application Review**
    - Approve or reject volunteer applications (with reason)
    - Automated status emails sent to applicants
9. **Reports & Analytics**
    - Download reports on volunteers, projects, events, and hours
    - View real-time analytics on dashboard

---

## 🗂️ Flow Diagrams

### Volunteer Dashboard Flow

```mermaid
flowchart TD
    A[Start: Visit Registration Page] --> B[Select Language]
    B --> C[Fill Step 1: Institution Details]
    C --> D[Fill Step 2: Personal Info]
    D --> E[Fill Step 3: Education]
    E --> F[Upload Documents]
    F --> G[Review & Declaration]
    G --> H[Submit Application]
    H --> I[Receive Email Confirmation]
    I --> J[Wait for Admin Approval]
    J -->|Approved| K[Set Password (First Login)]
    K --> L[Complete Profile]
    L --> M[Select Project]
    M --> N[Download Digital ID Card]
    N --> O[Participate in Events]
    O --> P1[Event Start: Upload Location-based Selfie (Check-in)]
    P1 --> P2[Event End: Upload Location-based Selfie (Check-out)]
    P2 --> Q[Working Hours Added to Profile]
    Q --> R[Track Progress & Hours in Dashboard]
    R --> S[Receive Announcements & Notifications]
    J -->|Rejected| T[See Reason & Retry]
```

---

### Admin Dashboard Flow

```mermaid
flowchart TD
    A[Admin Login] --> B[View Dashboard]
    B --> C[User Management]
    C --> C1[Add/Edit/Remove Admins/Sub-admins/Volunteers]
    C --> C2[Assign Roles & Permissions]
    B --> D[Project Management]
    D --> D1[Create/Edit Projects]
    D --> D2[Assign Volunteers to Projects]
    D --> D3[Monitor Project Progress]
    B --> E[Volunteer Management]
    E --> E1[Track Registrations & Approvals]
    E --> E2[View Volunteer Profiles]
    E --> E3[Monitor Working Hours & Event Participation]
    B --> F[Event Management]
    F --> F1[Create/Schedule Events]
    F --> F2[Assign Volunteers to Events]
    F --> F3[Monitor Attendance (Photo Check-in/out)]
    B --> G[Announcements]
    G --> G1[Send Announcements to Users]
    B --> H[Application Review]
    H --> H1[Approve/Reject Applications]
    H --> H2[Send Status Emails]
    B --> I[Reports & Analytics]
    I --> I1[Download Reports]
    I --> I2[View Real-time Analytics]
```

---

## 🔐 Permission System

| Role       | Access Level                      |
|------------|----------------------------------|
| Admin      | Full access to all features       |
| Sub-admin  | Limited access (assignable)       |
| User       | Form submission & tracking only   |

- Permissions enforced in UI and backend.
- Sub-admins can be created/managed by Admins.

---

## ⚙️ Deployment

To build for production:

```bash
npm run build
npm start
```

You can deploy on **Vercel**, **Render**, or **DigitalOcean App Platform**.

---

## 🤝 Contributing

1. Fork this repository
2. Create a new feature branch
3. Commit your changes
4. Submit a Pull Request

All contributions are welcome!

---

## 📄 License

MIT License

---

## 📞 Support

- Open an issue on GitHub
- Email the dev team
- See the `/docs` folder for more help

Developed for the National Service Scheme (NSS), Uttar Pradesh 🇮🇳

---
