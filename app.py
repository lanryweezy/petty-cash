"""
Petty Cash Management System
This module implements the core Flask application, handling user authentication,
request creation, receipt uploads (with base64 database storage for serverless support),
and role-based approvals.
"""
from flask import Flask, render_template, request, redirect, url_for, flash, session, jsonify
from werkzeug.security import generate_password_hash, check_password_hash
from werkzeug.utils import secure_filename
import sqlite3
import os
from datetime import datetime
import secrets
import base64

try:
    import psycopg2
    import psycopg2.extras
except ImportError:
    pass

from api_routes import api



app = Flask(__name__)
app.register_blueprint(api)

# Ensure DB is initialized before first request on Vercel
@app.before_request
def initialize_database():
    app.before_request_funcs[None].remove(initialize_database)
    try:
        init_db()
    except Exception as e:
        print(f"DB Init Error: {e}")

app.secret_key = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['UPLOAD_FOLDER'] = 'uploads'
app.config['MAX_CONTENT_LENGTH'] = 5 * 1024 * 1024  # 5MB max file size

# Ensure upload directory exists

# Ensure upload directory exists (use /tmp for Vercel)
app.config['UPLOAD_FOLDER'] = '/tmp/uploads' if os.environ.get('VERCEL') else 'uploads'
try:
    os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
except OSError:
    pass # Ignore on read-only filesystems


def init_db():
    """Initialize the database with required tables"""
    conn = get_db_connection()
    is_pg = hasattr(conn, 'cursor_factory')
    cursor = conn.cursor()
    
    # SQLite syntax vs Postgres syntax differences handled simply here
    autoincrement = "SERIAL PRIMARY KEY" if is_pg else "INTEGER PRIMARY KEY AUTOINCREMENT"
    boolean_type = "BOOLEAN DEFAULT TRUE" if is_pg else "BOOLEAN DEFAULT 1"

    # Users table
    cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS users (
            id {autoincrement},
            username VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            name VARCHAR(255) NOT NULL,
            role VARCHAR(50) DEFAULT 'user',
            is_first_login {boolean_type},
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    # Requests table
    cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS requests (
            id {autoincrement},
            user_id INTEGER,
            purpose TEXT NOT NULL,
            amount REAL NOT NULL,
            status VARCHAR(50) DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            approved_by INTEGER,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (approved_by) REFERENCES users (id)
        )
    ''')
    
    # Receipts table (updated to not use local files, but store base64 or just small references)
    cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS receipts (
            id {autoincrement},
            user_id INTEGER,
            request_id INTEGER,
            filename VARCHAR(255) NOT NULL,
            file_data TEXT,
            description TEXT,
            amount REAL NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id),
            FOREIGN KEY (request_id) REFERENCES requests (id)
        )
    ''')
    
    # Logs table
    cursor.execute(f'''
        CREATE TABLE IF NOT EXISTS logs (
            id {autoincrement},
            user_id INTEGER,
            action TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users (id)
        )
    ''')
    
    conn.commit()
    conn.close()


def get_db_connection():
    """Get database connection"""
    db_url = os.environ.get('DATABASE_URL')
    if db_url:
        conn = psycopg2.connect(db_url)
        # Use DictCursor for rows
    else:
        # For Vercel serverless we should use /tmp if not using PG
        db_path = '/tmp/petty_cash.db' if os.environ.get('VERCEL') else 'petty_cash.db'
        conn = sqlite3.connect(db_path)
        conn.row_factory = sqlite3.Row
    return conn

def get_cursor(conn):
    if hasattr(conn, 'cursor_factory'): # psycopg2
        return conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
    return conn.cursor()


def log_action(user_id, action):
    """Log user action"""
    conn = get_db_connection()
    is_pg = hasattr(conn, 'cursor_factory')
    cursor = conn.cursor()
    if is_pg:
        cursor.execute('INSERT INTO logs (user_id, action) VALUES (%s, %s)', (user_id, action))
    else:
        cursor.execute('INSERT INTO logs (user_id, action) VALUES (?, ?)', (user_id, action))
    conn.commit()
    conn.close()

def execute_query(conn, query, params=None):
    cursor = get_cursor(conn)
    is_pg = hasattr(conn, 'cursor_factory')

    if is_pg and params:
        query = query.replace('?', '%s')

    if params:
        cursor.execute(query, params)
    else:
        cursor.execute(query)
    return cursor

def require_login(f):
    """Decorator to require login"""
    def wrapper(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        return f(*args, **kwargs)
    wrapper.__name__ = f.__name__
    return wrapper

def require_admin(f):
    """Decorator to require admin role"""
    def wrapper(*args, **kwargs):
        if 'user_id' not in session:
            return redirect(url_for('login'))
        
        conn = get_db_connection()
        user = execute_query(conn, 'SELECT role FROM users WHERE id = ?', (session['user_id'],)).fetchone()
        conn.close()
        
        if not user or user['role'] != 'admin':
            flash('Admin access required.', 'error')
            return redirect(url_for('dashboard'))
        return f(*args, **kwargs)
    wrapper.__name__ = f.__name__
    return wrapper

@app.route('/')
def index():
    if 'user_id' in session:
        return redirect(url_for('dashboard'))
    return redirect(url_for('login'))

@app.route('/login', methods=['GET', 'POST'])
def login():
    if request.method == 'POST':
        username = request.form['username']
        password = request.form['password']
        
        conn = get_db_connection()
        user = execute_query(conn, 'SELECT * FROM users WHERE username = ?', (username,)).fetchone()
        conn.close()
        
        if user and check_password_hash(user['password_hash'], password):
            session['user_id'] = user['id']
            session['username'] = user['username']
            session['role'] = user['role']
            session['name'] = user['name']
            
            log_action(user['id'], f'User {username} logged in')
            
            if user['is_first_login']:
                return redirect(url_for('change_password', first_login=1))
            
            flash(f'Welcome back, {user["name"]}!', 'success')
            return redirect(url_for('dashboard'))
        else:
            flash('Invalid username or password.', 'error')
    
    return render_template('login.html')

@app.route('/logout')
def logout():
    if 'user_id' in session:
        log_action(session['user_id'], f'User {session["username"]} logged out')
    session.clear()
    flash('You have been logged out.', 'info')
    return redirect(url_for('login'))

@app.route('/change_password', methods=['GET', 'POST'])
@require_login
def change_password():
    first_login = request.args.get('first_login', False)
    
    if request.method == 'POST':
        current_password = request.form.get('current_password')
        new_password = request.form['new_password']
        confirm_password = request.form['confirm_password']
        
        if new_password != confirm_password:
            flash('New passwords do not match.', 'error')
            return render_template('change_password.html', first_login=first_login)
        
        if len(new_password) < 6:
            flash('Password must be at least 6 characters long.', 'error')
            return render_template('change_password.html', first_login=first_login)
        
        conn = get_db_connection()
        user = execute_query(conn, 'SELECT * FROM users WHERE id = ?', (session['user_id'],)).fetchone()
        
        # Verify current password for non-first-login
        if not first_login and not check_password_hash(user['password_hash'], current_password):
            flash('Current password is incorrect.', 'error')
            conn.close()
            return render_template('change_password.html', first_login=first_login)
        
        # Update password
        new_hash = generate_password_hash(new_password)
        execute_query(conn, 'UPDATE users SET password_hash = ?, is_first_login = 0 WHERE id = ?',
                    (new_hash, session['user_id']))
        conn.commit()
        conn.close()
        
        log_action(session['user_id'], 'Password changed')
        flash('Password updated successfully!', 'success')
        return redirect(url_for('dashboard'))
    
    return render_template('change_password.html', first_login=first_login)

@app.route('/dashboard')
@require_login
def dashboard():
    conn = get_db_connection()
    
    # Get user's requests
    requests = execute_query(conn, '''
        SELECT r.*, u.name as approved_by_name 
        FROM requests r 
        LEFT JOIN users u ON r.approved_by = u.id 
        WHERE r.user_id = ? 
        ORDER BY r.created_at DESC
    ''', (session['user_id'],)).fetchall()
    
    # Get recent receipts
    receipts = execute_query(conn, '''
        SELECT r.*, req.purpose 
        FROM receipts r 
        LEFT JOIN requests req ON r.request_id = req.id 
        WHERE r.user_id = ? 
        ORDER BY r.created_at DESC LIMIT 5
    ''', (session['user_id'],)).fetchall()
    
    conn.close()
    
    return render_template('dashboard.html', requests=requests, receipts=receipts)

@app.route('/create_request', methods=['GET', 'POST'])
@require_login
def create_request():
    if request.method == 'POST':
        purpose = request.form['purpose']
        amount = float(request.form['amount'])
        
        conn = get_db_connection()
        execute_query(conn, 'INSERT INTO requests (user_id, purpose, amount) VALUES (?, ?, ?)',
                    (session['user_id'], purpose, amount))
        conn.commit()
        conn.close()
        
        log_action(session['user_id'], f'Created request: {purpose} - ${amount:.2f}')
        flash('Request created successfully!', 'success')
        return redirect(url_for('dashboard'))
    
    return render_template('create_request.html')

@app.route('/upload_receipt', methods=['GET', 'POST'])
@require_login
def upload_receipt():
    if request.method == 'POST':
        file = request.files.get('receipt')
        description = request.form['description']
        amount = float(request.form['amount'])
        request_id = request.form.get('request_id')
        
        if file and file.filename:
            filename = secure_filename(file.filename)
            # Read file data and convert to base64 for serverless compatibility
            file_data = base64.b64encode(file.read()).decode('utf-8')
            
            conn = get_db_connection()
            execute_query(conn, '''
                INSERT INTO receipts (user_id, request_id, filename, file_data, description, amount)
                VALUES (?, ?, ?, ?, ?, ?)
            ''', (session['user_id'], request_id if request_id else None, filename, file_data, description, amount))
            conn.commit()
            conn.close()
            
            log_action(session['user_id'], f'Uploaded receipt: {description} - ${amount:.2f}')
            flash('Receipt uploaded successfully!', 'success')
            return redirect(url_for('dashboard'))
    
    # Get user's approved requests for dropdown
    conn = get_db_connection()
    approved_requests = execute_query(conn, '''
        SELECT * FROM requests 
        WHERE user_id = ? AND status = 'approved' 
        ORDER BY created_at DESC
    ''', (session['user_id'],)).fetchall()
    conn.close()
    
    return render_template('upload_receipt.html', requests=approved_requests)

@app.route('/approvals')
@require_login
def approvals():
    conn = get_db_connection()
    user = execute_query(conn, 'SELECT role FROM users WHERE id = ?', (session['user_id'],)).fetchone()
    
    if user['role'] not in ['admin', 'approver']:
        flash('You do not have permission to view approvals.', 'error')
        return redirect(url_for('dashboard'))
    
    # Get pending requests
    pending_requests = execute_query(conn, '''
        SELECT r.*, u.name as user_name 
        FROM requests r 
        JOIN users u ON r.user_id = u.id 
        WHERE r.status = 'pending' 
        ORDER BY r.created_at ASC
    ''').fetchall()
    
    conn.close()
    return render_template('approvals.html', requests=pending_requests)

@app.route('/approve_request/<int:request_id>')
@require_login
def approve_request(request_id):
    conn = get_db_connection()
    user = execute_query(conn, 'SELECT role FROM users WHERE id = ?', (session['user_id'],)).fetchone()
    
    if user['role'] not in ['admin', 'approver']:
        flash('You do not have permission to approve requests.', 'error')
        return redirect(url_for('dashboard'))
    
    execute_query(conn, '''
        UPDATE requests 
        SET status = 'approved', approved_by = ? 
        WHERE id = ? AND status = 'pending'
    ''', (session['user_id'], request_id))
    conn.commit()
    
    # Log the approval
    request_info = execute_query(conn, 'SELECT purpose, amount FROM requests WHERE id = ?', (request_id,)).fetchone()
    conn.close()
    
    log_action(session['user_id'], f'Approved request: {request_info["purpose"]} - ${request_info["amount"]:.2f}')
    flash('Request approved successfully!', 'success')
    return redirect(url_for('approvals'))

@app.route('/reject_request/<int:request_id>')
@require_login
def reject_request(request_id):
    conn = get_db_connection()
    user = execute_query(conn, 'SELECT role FROM users WHERE id = ?', (session['user_id'],)).fetchone()
    
    if user['role'] not in ['admin', 'approver']:
        flash('You do not have permission to reject requests.', 'error')
        return redirect(url_for('dashboard'))
    
    execute_query(conn, "UPDATE requests SET status = 'rejected' WHERE id = ? AND status = 'pending'", (request_id,))
    conn.commit()
    
    # Log the rejection
    request_info = execute_query(conn, 'SELECT purpose, amount FROM requests WHERE id = ?', (request_id,)).fetchone()
    conn.close()
    
    log_action(session['user_id'], f'Rejected request: {request_info["purpose"]} - ${request_info["amount"]:.2f}')
    flash('Request rejected.', 'info')
    return redirect(url_for('approvals'))



@app.route('/receipt/<int:receipt_id>')
@require_login
def view_receipt(receipt_id):
    conn = get_db_connection()
    receipt = execute_query(conn, 'SELECT * FROM receipts WHERE id = ?', (receipt_id,)).fetchone()
    user = execute_query(conn, 'SELECT role FROM users WHERE id = ?', (session['user_id'],)).fetchone()
    conn.close()

    if not receipt:
        flash('Receipt not found.', 'error')
        return redirect(url_for('dashboard'))

    # Check permissions: user must own the receipt, or be an admin/approver
    if receipt['user_id'] != session['user_id'] and user['role'] not in ['admin', 'approver']:
        flash('You do not have permission to view this receipt.', 'error')
        return redirect(url_for('dashboard'))


    if receipt['file_data']:
        # If we have base64 data, return it
        file_data = base64.b64decode(receipt['file_data'])
        from flask import Response
        import mimetypes

        mimetype, _ = mimetypes.guess_type(receipt['filename'])
        if not mimetype:
            mimetype = 'application/octet-stream'

        return Response(file_data, mimetype=mimetype)
    else:
        # Legacy local file
        from flask import send_from_directory
        return send_from_directory(app.config['UPLOAD_FOLDER'], receipt['filename'])

@app.route('/users')

@require_admin
def user_management():
    conn = get_db_connection()
    users = execute_query(conn, 'SELECT * FROM users ORDER BY created_at DESC').fetchall()
    conn.close()
    return render_template('users.html', users=users)

@app.route('/create_user', methods=['GET', 'POST'])
@require_admin
def create_user():
    if request.method == 'POST':
        username = request.form['username']
        name = request.form['name']
        role = request.form['role']
        temp_password = secrets.token_urlsafe(8)
        
        conn = get_db_connection()
        
        # Check if username exists
        existing = execute_query(conn, 'SELECT id FROM users WHERE username = ?', (username,)).fetchone()
        if existing:
            flash('Username already exists.', 'error')
            conn.close()
            return render_template('create_user.html')
        
        # Create user
        password_hash = generate_password_hash(temp_password)
        execute_query(conn, '''
            INSERT INTO users (username, password_hash, name, role, is_first_login) 
            VALUES (?, ?, ?, ?, 1)
        ''', (username, password_hash, name, role))
        conn.commit()
        conn.close()
        
        log_action(session['user_id'], f'Created user: {username} ({role})')
        flash(f'User created! Temporary password: {temp_password}', 'success')
        return redirect(url_for('user_management'))
    
    return render_template('create_user.html')

@app.route('/create_default_admin', methods=['POST'])
def create_default_admin():
    """Create default admin user if no users exist"""
    conn = get_db_connection()
    user_count = execute_query(conn, 'SELECT COUNT(*) as count FROM users').fetchone()['count']
    
    if user_count > 0:
        conn.close()
        return jsonify({'error': 'Users already exist'}), 400
    
    # Create default admin
    password_hash = generate_password_hash('admin123')
    execute_query(conn, '''
        INSERT INTO users (username, password_hash, name, role, is_first_login) 
        VALUES (?, ?, ?, ?, 0)
    ''', ('admin', password_hash, 'Administrator', 'admin'))
    conn.commit()
    conn.close()
    
    return jsonify({
        'message': 'Default admin created',
        'username': 'admin',
        'password': 'admin123'
    })

@app.route('/logs')
@require_admin
def view_logs():
    conn = get_db_connection()
    logs = execute_query(conn, '''
        SELECT l.*, u.username, u.name 
        FROM logs l 
        JOIN users u ON l.user_id = u.id 
        ORDER BY l.created_at DESC 
        LIMIT 100
    ''').fetchall()
    conn.close()
    return render_template('logs.html', logs=logs)

if __name__ == '__main__':
    init_db()
    
    # Create default admin if no users exist
    conn = get_db_connection()
    user_count = execute_query(conn, 'SELECT COUNT(*) as count FROM users').fetchone()['count']
    if user_count == 0:
        password_hash = generate_password_hash('admin123')
        execute_query(conn, '''
            INSERT INTO users (username, password_hash, name, role, is_first_login) 
            VALUES (?, ?, ?, ?, 0)
        ''', ('admin', password_hash, 'Administrator', 'admin'))
        conn.commit()
        print("Default admin created: username=admin, password=admin123")
    conn.close()
    
    app.run(debug=True, host='0.0.0.0', port=int(os.environ.get('PORT', 5000)))