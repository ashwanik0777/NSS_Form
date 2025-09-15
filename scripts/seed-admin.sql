-- Create initial admin user
-- This script should be run after setting up the database

-- Note: In a real application, you would hash the password properly
-- For demo purposes, the password 'admin123' is hashed using bcrypt

INSERT INTO users (name, email, password, role, permissions, createdAt, updatedAt) VALUES (
  'System Administrator',
  'admin@nss-up.gov.in',
  '$2a$12$LQv3c1yqBwEHxv5hSe8./.H.DqwO9jrjVklHlbwWaAqCd9jjO3ZGi', -- admin123
  'admin',
  '["system.admin"]',
  NOW(),
  NOW()
);

-- Create sample permissions
INSERT INTO permissions (name, description, category, createdAt, updatedAt) VALUES
('applications.view', 'View applications', 'applications', NOW(), NOW()),
('applications.review', 'Review and approve/reject applications', 'applications', NOW(), NOW()),
('applications.edit', 'Edit application details', 'applications', NOW(), NOW()),
('applications.delete', 'Delete applications', 'applications', NOW(), NOW()),
('applications.export', 'Export application data', 'applications', NOW(), NOW()),
('users.view', 'View users', 'users', NOW(), NOW()),
('users.create', 'Create new users', 'users', NOW(), NOW()),
('users.edit', 'Edit user details', 'users', NOW(), NOW()),
('users.delete', 'Delete users', 'users', NOW(), NOW()),
('users.permissions', 'Manage user permissions', 'users', NOW(), NOW()),
('reports.view', 'View reports', 'reports', NOW(), NOW()),
('reports.generate', 'Generate reports', 'reports', NOW(), NOW()),
('reports.export', 'Export reports', 'reports', NOW(), NOW()),
('settings.view', 'View system settings', 'settings', NOW(), NOW()),
('settings.edit', 'Edit system settings', 'settings', NOW(), NOW()),
('system.admin', 'Full system administration access', 'system', NOW(), NOW()),
('system.logs', 'View system logs', 'system', NOW(), NOW()),
('system.backup', 'Manage system backups', 'system', NOW(), NOW());
