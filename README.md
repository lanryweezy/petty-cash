# Petty Cash Management System (Python/Flask)

A simple, clean petty cash management system built with Python Flask.

## Features

- **User Authentication**: Username/password login with role-based access
- **Request Management**: Create and track petty cash requests
- **Approval Workflow**: Approve/reject requests (Admin/Approver roles)
- **Receipt Upload**: Upload receipt files for approved requests
- **User Management**: Admin can create and manage users
- **Activity Logs**: Track all system activities
- **First Login Security**: Force password change on first login

## User Roles

- **Admin**: Full system access, user management, approvals
- **Approver**: Can approve/reject requests
- **User**: Can create requests and upload receipts

## Quick Start

### Local Development

1. **Install Python 3.8+**

2. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the application:**
   ```bash
   python app.py
   ```

4. **Access the application:**
   - Open http://localhost:5000
   - Default admin: username=`admin`, password=`admin123`

### Deployment on Render

1. **Connect your GitHub repository to Render**

2. **Use these settings:**
   - **Environment**: Python
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `gunicorn app:app`

3. **Environment Variables:**
   - `SECRET_KEY`: Auto-generate in Render

4. **Deploy!**

## File Structure

```
├── app.py                 # Main Flask application
├── requirements.txt       # Python dependencies
├── render.yaml           # Render deployment config
├── petty_cash.db         # SQLite database (auto-created)
├── uploads/              # Receipt files (auto-created)
└── templates/            # HTML templates
    ├── base.html
    ├── login.html
    ├── dashboard.html
    ├── create_request.html
    ├── upload_receipt.html
    ├── change_password.html
    ├── users.html
    ├── create_user.html
    ├── approvals.html
    └── logs.html
```

## Database

Uses SQLite for simplicity. Database and tables are automatically created on first run.

Tables:
- `users` - User accounts and roles
- `requests` - Petty cash requests
- `receipts` - Uploaded receipt files
- `logs` - System activity logs

## Key Features

### Simple & Clean
- Minimal dependencies (just Flask + Werkzeug)
- Bootstrap 5 for responsive UI
- SQLite database (no setup required)
- File uploads to local directory

### Secure
- Password hashing with Werkzeug
- Session-based authentication
- Role-based access control
- First login password change requirement

### Production Ready
- Gunicorn WSGI server
- Environment variable configuration
- Activity logging
- File upload validation

## Default Admin

When the app starts, if no users exist, it automatically creates:
- **Username**: `admin`
- **Password**: `admin123`
- **Role**: Admin

## Development Notes

This is designed to be as simple as possible while maintaining essential functionality:

- Uses SQLite (no database server required)
- Uses local file storage (no cloud storage setup)
- Uses session-based auth (no JWT complexity)
- Uses server-side templates (no API/frontend separation)

Perfect for small organizations or as a starting point for larger systems!
