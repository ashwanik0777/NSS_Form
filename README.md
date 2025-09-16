# NSS Registration System

A comprehensive National Service Scheme (NSS) volunteer registration and management system built with Next.js 15, MongoDB, and modern web technologies.

## Features

### For Applicants
- **Multi-step Registration Form**: Intuitive 4-step form with validation
- **Bilingual Support**: English and Hindi interface
- **Form Preview**: Review all details before submission
- **Email Notifications**: Automatic status updates via email
- **Document Upload**: Support for required documents

### For Administrators
- **Admin Dashboard**: Comprehensive management interface
- **Application Review**: Approve/reject applications with reasons
- **User Management**: Create and manage sub-admins with custom permissions
- **Email System**: Automated email notifications for all status changes
- **Reports & Analytics**: Track application statistics
- **Role-based Access**: Granular permission system

## Technology Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS v4, Custom design system
- **Backend**: Next.js API Routes, MongoDB with Mongoose
- **Authentication**: NextAuth.js with JWT
- **Email**: Nodemailer with HTML templates
- **UI Components**: Radix UI primitives
- **Form Handling**: React Hook Form with Zod validation

## Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB database
- SMTP email service (Gmail, etc.)

### Installation

1. Clone the repository:
\`\`\`bash
git clone <repository-url>
cd nss-registration-system
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
\`\`\`


\`\`\`

4. Run the development server:
\`\`\`bash
npm run dev
\`\`\`

5. Open [http://localhost:3000](http://localhost:3000) in your browser.



## Project Structure

\`\`\`
├── app/                    # Next.js app directory
│   ├── admin/             # Admin dashboard pages
│   ├── api/               # API routes
│   ├── login/             # Authentication pages
│   └── register/          # Registration form
├── components/            # React components
│   ├── admin/            # Admin-specific components
│   ├── auth/             # Authentication components
│   └── nss/              # NSS form components
├── lib/                  # Utility libraries
│   ├── auth.ts           # NextAuth configuration
│   ├── email.ts          # Email templates and sending
│   ├── mongodb.ts        # Database connection
│   ├── permissions.ts    # Permission system
│   └── validation.ts     # Form validation
├── models/               # MongoDB models
└── scripts/              # Database scripts
\`\`\`

## Key Features Explained

### Multi-step Form
The registration form is divided into logical steps:
1. **Institution Details**: Basic institutional information
2. **Personal Details**: Applicant's personal information
3. **Educational Details**: Academic background
4. **Review & Submit**: Final review with declaration

### Permission System
Granular permissions for different user roles:
- **Admin**: Full system access
- **Sub-Admin**: Configurable permissions
- **User**: Basic access

### Email Notifications
Automated emails for:
- Application submission confirmation
- Approval notifications with certificate
- Rejection notifications with reasons

### Admin Dashboard
Comprehensive management interface with:
- Application statistics
- User management
- Permission assignment
- Email system testing

## Deployment


### Build and Deploy
\`\`\`bash
npm run build
npm start
\`\`\`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support and questions:
- Create an issue in the repository
- Contact the development team
- Check the documentation

---

**National Service Scheme - Uttar Pradesh**
