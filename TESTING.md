# Testing Guide

## Authentication Testing

The application now uses **username/password** authentication with role-based access control.

### Creating a Default Admin User

1. **Start the application** (locally or on Render)
2. **Go to the login page** - you'll see a blue development helper box
3. **Click "Create Default Admin User"** - this will create:
   - Username: `admin`
   - Password: `admin123`
4. **The form will auto-fill** with these credentials
5. **Click "Login"** to access the application

### User Roles

The system supports three user roles:

- **Admin**: Full system access, can manage users, configure settings
- **Approver**: Can approve/reject requests up to certain limits
- **User**: Can create requests and upload receipts

### Admin User Management

Once logged in as admin, you can:

1. **Navigate to "User Management"** from the sidebar
2. **Add new users** with different roles
3. **Edit existing users** (name and role)
4. **Delete users** (except yourself)
5. **See first login status** - users with temporary passwords

### First Login Flow

New users created by admin will:

1. **Receive temporary credentials** (shown to admin when creating user)
2. **Must change password** on first login
3. **Cannot access the app** until password is changed
4. **Get full access** after setting their own password

### Production Deployment

⚠️ **Important**: The development helper and `/api/auth/create-default-admin` endpoint should be removed in production for security reasons.

### Database Requirements

Make sure your database has a `users` table with the following structure:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  username VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'user',
  is_first_login BOOLEAN DEFAULT true,
  email VARCHAR(255),
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Testing Checklist

### Basic Authentication
- [ ] Database is connected and `users` table exists with correct schema
- [ ] Default admin can be created via the development helper
- [ ] Login works with username/password (admin/admin123)
- [ ] Authentication state persists on page refresh
- [ ] Token-based authentication is working for API calls

### User Management (Admin Only)
- [ ] User Management page is accessible from sidebar (admin only)
- [ ] Can create new users with different roles
- [ ] Temporary passwords are generated and displayed
- [ ] Can edit user details (name, role)
- [ ] Can delete users (except self)
- [ ] Non-admin users cannot access user management

### First Login Flow
- [ ] New users are marked with "First Login Required"
- [ ] First login redirects to password change screen
- [ ] Cannot access app until password is changed
- [ ] Password change works correctly
- [ ] After password change, user has normal access

### Role-Based Access
- [ ] Admin users see all menu items
- [ ] Regular users see appropriate menu items
- [ ] Approver users have correct permissions
- [ ] API endpoints respect role-based permissions