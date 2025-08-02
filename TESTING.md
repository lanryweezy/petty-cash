# Testing Guide

## Authentication Testing

Since the application now uses email/password authentication, you need to create a user before you can log in.

### Creating a Default User

1. **Start the application** (locally or on Render)
2. **Go to the login page** - you'll see a blue development helper box
3. **Click "Create Default Admin User"** - this will create:
   - Email: `admin@test.com`
   - Password: `password123`
4. **The form will auto-fill** with these credentials
5. **Click "Login"** to access the application

### Alternative: Manual User Creation

If you prefer to create users manually, you can use the registration endpoint:

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "your-email@example.com",
    "password": "your-password",
    "name": "Your Name"
  }'
```

### Production Deployment

⚠️ **Important**: The development helper and `/api/auth/create-default-user` endpoint should be removed in production for security reasons.

### Database Requirements

Make sure your database has a `users` table with the following structure:

```sql
CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Testing Checklist

- [ ] Database is connected and `users` table exists
- [ ] Default user can be created via the development helper
- [ ] Login works with created credentials
- [ ] Authentication state persists on page refresh
- [ ] Password change functionality works
- [ ] Token-based authentication is working for API calls